// Gerekli paketleri dahil et
const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// .env dosyasını yerel ortamda okumak için
// Canlıda (Render'da) bu satır bir şey yapmayacaktır, çünkü ortam değişkenleri zaten tanımlıdır.
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Firebase Admin SDK'sını başlat
// Canlı (Render) ve yerel ortamlar için koşullu yükleme
let serviceAccount;

if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
  // Canlı ortamda (Render) çalışıyorsa, ortam değişkenini kullan
  try {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
  } catch (error) {
    console.error('FIREBASE_SERVICE_ACCOUNT_KEY JSON formatı geçersiz! Lütfen Render ortam değişkenini kontrol edin.');
    process.exit(1);
  }
} else {
  // Yerel ortamda çalışıyorsa, dosyadan oku
  try {
    serviceAccount = require('./serviceAccountKey.json');
  } catch (error) {
    console.error('Yerel serviceAccountKey.json dosyası bulunamadı! Lütfen dosyanın var olduğundan ve .gitignore içinde olmadığından emin olun.');
    process.exit(1);
  }
}

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
const corsOptions = {
  origin: ['https://taylanhomes.com', 'http://localhost:3000'],
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
console.log(`'uploads' klasörü şu adresten sunuluyor: ${path.join(__dirname, 'uploads')}`);

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) return res.sendStatus(401);

  try {
    const decodedToken = await auth.verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Token doğrulama hatası:', error);
    return res.sendStatus(403);
  }
};

// İlanları getirme (HERKESE AÇIK)
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
app.post('/api/properties/with-files', authenticateToken, upload.fields([
  { name: 'mainImage', maxCount: 1 },
  { name: 'galleryImages', maxCount: 10 },
  // KRİTİK DÜZELTME: Multer'ın 'data' alanını da işlemesini sağlıyoruz.
  { name: 'data', maxCount: 1 }
]), async (req, res) => {
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
    if (error.message.includes('Cannot use "undefined" as a Firestore value')) {
      res.status(400).json({ message: 'Geçersiz veri: Bazı alanlar boş veya hatalı tanımlanmış olabilir. Lütfen tüm alanları kontrol edin.' });
    } else {
      res.status(500).json({ message: 'Sunucu hatası, ilan eklenemedi.' });
    }
  }
});

// İlan güncelleme (dosya yüklemeli - Kimlik doğrulama gerektirir)
app.put('/api/properties/:id/with-files', authenticateToken, upload.fields([
  { name: 'mainImage', maxCount: 1 },
  { name: 'galleryImages', maxCount: 10 },
  // KRİTİK DÜZELTME: Multer'ın 'data' alanını da işlemesini sağlıyoruz.
  { name: 'data', maxCount: 1 }
]), async (req, res) => {
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

    if (mainImageFile) {
      if (oldPropertyData.imageUrl && oldPropertyData.imageUrl.startsWith('/uploads/')) {
        const oldMainImagePath = path.join(__dirname, oldPropertyData.imageUrl);
        fs.unlink(oldMainImagePath, (err) => {
          if (err) console.error(`Eski ana görsel silinirken hata oluştu: ${oldMainImagePath}`, err);
        });
      }
      updatedImageUrl = `/uploads/${mainImageFile.filename}`;
    }

    const existingGalleryImagesFromFrontend = data.existingGalleryImages || [];
    const newGalleryImagePaths = galleryImageFiles.map(file => `/uploads/${file.filename}`);

    updatedGalleryImages = existingGalleryImagesFromFrontend.filter(img => img.startsWith('/uploads/'))
      .concat(newGalleryImagePaths);

    const updatedProperty = {
      ...data,
      imageUrl: updatedImageUrl,
      galleryImages: updatedGalleryImages,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

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