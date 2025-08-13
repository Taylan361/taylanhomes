    const express = require('express');
    const cors = require('cors');
    const admin = require('firebase-admin');
    const multer = require('multer');
    const path = require('path');
    const fs = require('fs');

    const app = express();
    const PORT = process.env.PORT || 5000;

    // Firebase Admin SDK'sını başlat
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      // KRİTİK: Firestore'a undefined değerlerin gönderilmesi hatasını önlemek için bu ayar mutlaka olmalı.
      firestore: {
        ignoreUndefinedProperties: true
      }
    });

    const auth = admin.auth();
    const db = admin.firestore();

    // Multer ile dosya yükleme yapılandırması
    const storage = multer.diskStorage({
      destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, 'uploads');
        // 'uploads' klasörü yoksa oluştur
        if (!fs.existsSync(uploadPath)) {
          fs.mkdirSync(uploadPath);
        }
        cb(null, uploadPath);
      },
      filename: (req, file, cb) => {
        // Dosya adını benzersiz hale getir
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
      }
    });
    const upload = multer({ storage: storage });

    // Orta katman (Middleware)
    app.use(cors());
    app.use(express.json()); // JSON body parsing
    app.use(express.urlencoded({ extended: true })); // URL-encoded body parsing

    // 'uploads' klasörünü statik olarak sun
    // Bu kısım, yüklenen resimlerin frontend tarafından erişilebilir olmasını sağlar.
    app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
    console.log(`'uploads' klasörü şu adresten sunuluyor: ${path.join(__dirname, 'uploads')}`);

    // JWT doğrulama middleware'i
    const authenticateToken = async (req, res, next) => {
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];

      if (token == null) return res.sendStatus(401); // Token yoksa yetkisiz

      try {
        const decodedToken = await auth.verifyIdToken(token);
        req.user = decodedToken;
        next();
      } catch (error) {
        console.error('Token doğrulama hatası:', error);
        return res.sendStatus(403); // Geçersiz token
      }
    };

    // İlanları getirme (HERKESE AÇIK)
    // Bu rota artık kimlik doğrulama gerektirmeyecek
    app.get('/api/properties', async (req, res) => {
      try {
        const propertiesRef = db.collection('properties');
        const snapshot = await propertiesRef.get();
        const properties = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.status(200).json(properties);
      } catch (error) {
        console.error('İlanlar getirilirken hata oluştu:', error);
        res.status(500).json({ message: 'Sunucu hatası, ilanlar getirilemedi.' });
      }
    });

    // Tek bir ilanı getirme (PropertyDetailPage için - Zaten herkese açık)
    app.get('/api/properties/:id', async (req, res) => {
      try {
        const propertyId = req.params.id;
        const docRef = db.collection('properties').doc(propertyId);
        const docSnap = await docRef.get();

        if (!docSnap.exists) {
          return res.status(404).json({ message: 'İlan bulunamadı.' });
        }

        res.status(200).json({ id: docSnap.id, ...docSnap.data() });
      } catch (error) {
        console.error('Tek ilan getirilirken hata oluştu:', error);
        res.status(500).json({ message: 'Sunucu hatası, ilan getirilemedi.' });
      }
    });


    // İlan ekleme (dosya yüklemeli - Kimlik doğrulama gerektirir)
    app.post('/api/properties/with-files', authenticateToken, upload.fields([{ name: 'mainImage', maxCount: 1 }, { name: 'galleryImages', maxCount: 10 }]), async (req, res) => {
      try {
        const data = JSON.parse(req.body.data); // Frontend'den gelen JSON string'i parse et
        const mainImageFile = req.files['mainImage'] ? req.files['mainImage'][0] : null;
        const galleryImageFiles = req.files['galleryImages'] || [];

        let imageUrl = '';
        if (mainImageFile) {
          imageUrl = `/uploads/${mainImageFile.filename}`;
        }

        const galleryImages = galleryImageFiles.map(file => `/uploads/${file.filename}`);

        const newProperty = {
          ...data,
          imageUrl: imageUrl,
          galleryImages: galleryImages,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        const docRef = await db.collection('properties').add(newProperty);
        res.status(201).json({ id: docRef.id, ...newProperty, message: 'İlan başarıyla eklendi.' });
      } catch (error) {
        console.error('İlan eklenirken hata oluştu (Dosya Yüklemeli):', error);
        // Firestore'un undefined değer hatasını yakalamak için daha spesifik kontrol
        if (error.message.includes('Cannot use "undefined" as a Firestore value')) {
          res.status(400).json({ message: 'Geçersiz veri: Bazı alanlar boş veya hatalı tanımlanmış olabilir. Lütfen tüm alanları kontrol edin.' });
        } else {
          res.status(500).json({ message: 'Sunucu hatası, ilan eklenemedi.' });
        }
      }
    });

    // İlan güncelleme (dosya yüklemeli - Kimlik doğrulama gerektirir)
    app.put('/api/properties/:id/with-files', authenticateToken, upload.fields([{ name: 'mainImage', maxCount: 1 }, { name: 'galleryImages', maxCount: 10 }]), async (req, res) => {
      try {
        const propertyId = req.params.id;
        const data = JSON.parse(req.body.data); // Frontend'den gelen JSON string'i parse et
        const mainImageFile = req.files['mainImage'] ? req.files['mainImage'][0] : null;
        const galleryImageFiles = req.files['galleryImages'] || [];

        const docRef = db.collection('properties').doc(propertyId);
        const docSnap = await docRef.get();

        if (!docSnap.exists) {
          return res.status(404).json({ message: 'İlan bulunamadı.' });
        }

        const oldPropertyData = docSnap.data();
        let updatedImageUrl = oldPropertyData.imageUrl;
        let updatedGalleryImages = oldPropertyData.galleryImages || [];

        // Yeni ana görsel yüklendiyse eskisini sil ve yenisini kaydet
        if (mainImageFile) {
          if (oldPropertyData.imageUrl && oldPropertyData.imageUrl.startsWith('/uploads/')) {
            const oldMainImagePath = path.join(__dirname, oldPropertyData.imageUrl);
            fs.unlink(oldMainImagePath, (err) => {
              if (err) console.error(`Eski ana görsel silinirken hata oluştu: ${oldMainImagePath}`, err);
            });
          }
          updatedImageUrl = `/uploads/${mainImageFile.filename}`;
        }

        // Mevcut galeri görsellerini (frontend'den gelen `existingGalleryImages` ile) koru
        // Frontend'den gelen `data.existingGalleryImages` zaten tam yollar olmalı,
        // ancak biz burada `/uploads/` ile başlayanları bekliyoruz.
        // Eğer frontend sadece dosya adlarını gönderiyorsa, bu kısım farklı ele alınmalı.
        // Varsayım: frontend, mevcut galeri görsellerinin tam yollarını gönderiyor.
        const existingGalleryImagesFromFrontend = data.existingGalleryImages || [];

        // Yeni yüklenen galeri görsellerini ekle
        const newGalleryImagePaths = galleryImageFiles.map(file => `/uploads/${file.filename}`);

        // Frontend'den gelen mevcut görsellerle yeni yüklenenleri birleştir
        // Sadece /uploads/ ile başlayanları alarak güvenlik sağlamak önemli.
        updatedGalleryImages = existingGalleryImagesFromFrontend.filter(img => img.startsWith('/uploads/'))
          .concat(newGalleryImagePaths);

        // Güncellenecek veri
        const updatedProperty = {
          ...data,
          imageUrl: updatedImageUrl,
          galleryImages: updatedGalleryImages,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        // `existingGalleryImages` alanını Firestore'a kaydetmiyoruz, sadece geçici olarak kullandık
        delete updatedProperty.existingGalleryImages;

        await docRef.update(updatedProperty);
        res.status(200).json({ id: propertyId, ...updatedProperty, message: 'İlan başarıyla güncellendi.' });

      } catch (error) {
        console.error('Error updating property (with files):', error);
        res.status(500).json({ message: 'Sunucu hatası, ilan güncellenemedi.' });
      }
    });

    // İlan silme (Kimlik doğrulama gerektirir)
    app.delete('/api/properties/:id', authenticateToken, async (req, res) => {
      try {
        const propertyId = req.params.id;
        const docRef = db.collection('properties').doc(propertyId);
        const docSnap = await docRef.get();

        if (!docSnap.exists) {
          return res.status(404).json({ message: 'İlan bulunamadı.' });
        }

        const propertyData = docSnap.data();

        // Görselleri sunucudan sil
        const deleteImage = (imagePath) => {
          if (imagePath && imagePath.startsWith('/uploads/')) {
            const fullPath = path.join(__dirname, imagePath);
            fs.unlink(fullPath, (err) => {
              if (err) console.error(`Görsel silinirken hata oluştu: ${fullPath}`, err);
              else console.log(`Görsel silindi: ${fullPath}`);
            });
          }
        };

        deleteImage(propertyData.imageUrl);
        if (propertyData.galleryImages && Array.isArray(propertyData.galleryImages)) {
          propertyData.galleryImages.forEach(deleteImage);
        }

        await docRef.delete();
        res.status(200).json({ message: 'İlan başarıyla silindi.' });
      } catch (error) {
        console.error('İlan silinirken hata oluştu:', error);
        res.status(500).json({ message: 'Sunucu hatası, ilan silinemedi.' });
      }
    });

    // Sunucuyu başlat
    app.listen(PORT, () => {
      console.log(`Sunucu http://localhost:${PORT} adresinde çalışıyor`);
    });
    