// Gerekli paketleri dahil et
const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const multer = require('multer');
const dotenv = require('dotenv');

// Cloudinary paketlerini içe aktar
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Firebase Admin SDK'sını başlat
let serviceAccount;

if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
  try {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
  } catch (error) {
    console.error('FIREBASE_SERVICE_ACCOUNT_KEY JSON formatı geçersiz!');
    process.exit(1);
  }
} else {
  try {
    serviceAccount = require('./serviceAccountKey.json');
  } catch (error) {
    console.error('Yerel serviceAccountKey.json dosyası bulunamadı!');
    process.exit(1);
  }
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  firestore: {
    ignoreUndefinedProperties: true
  }
});

const auth = admin.auth();
const db = admin.firestore();

// Cloudinary'yi .env dosyasından okunan bilgilerle yapılandır
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Multer ile Cloudinary entegrasyonu için depolama ayarı
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'taylanhomes', // Resimlerin Cloudinary'de saklanacağı klasör
    format: async (req, file) => 'webp', // WebP formatına dönüştür
    public_id: (req, file) => `taylanhomes-${Date.now()}-${file.originalname.split('.')[0]}`
  },
});
const upload = multer({ storage: storage });

// Orta katman (Middleware)
const corsOptions = {
  // Burası güncellendi
  origin: ['https://taylanhomes.com', 'https://www.taylanhomes.com', 'https://taylanhomes.onrender.com'],
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Bu satır artık gerekli değil çünkü resimler yerel olarak sunulmayacak
// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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

// --- API ENDPOINT'LERİ ---

// İlanları getirme (hem tümü hem de öne çıkanlar için)
app.get('/api/properties', async (req, res) => {
  try {
    const isFeaturedQuery = req.query.isFeatured;
    let propertiesRef = db.collection('properties');

    if (isFeaturedQuery === 'true') {
      propertiesRef = propertiesRef.where('isFeatured', '==', true);
    }

    const snapshot = await propertiesRef.get();
    const properties = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.status(200).json(properties);
  } catch (error) {
    console.error('İlanlar getirilirken hata oluştu:', error);
    res.status(500).json({ message: 'Sunucu hatası, ilanlar getirilemedi.' });
  }
});

// Tek bir ilanı getirme
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

// İlan ekleme (Cloudinary'ye yüklemeli)
app.post('/api/properties/with-files', authenticateToken, upload.fields([
  { name: 'mainImage', maxCount: 1 },
  { name: 'galleryImages', maxCount: 10 },
  { name: 'data', maxCount: 1 }
]), async (req, res) => {
  try {
    const data = JSON.parse(req.body.data);
    const mainImageFile = req.files['mainImage'] ? req.files['mainImage'][0] : null;
    const galleryImageFiles = req.files['galleryImages'] || [];
    
    // Cloudinary'den dönen URL'leri al
    let imageUrl = mainImageFile ? mainImageFile.path : '';
    const galleryImages = galleryImageFiles.map(file => file.path);

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
    console.error('İlan eklenirken hata oluştu:', error);
    res.status(500).json({ message: 'Sunucu hatası, ilan eklenemedi.' });
  }
});

// İlan güncelleme (Cloudinary'ye yüklemeli)
app.put('/api/properties/:id/with-files', authenticateToken, upload.fields([
  { name: 'mainImage', maxCount: 1 },
  { name: 'galleryImages', maxCount: 10 },
  { name: 'data', maxCount: 1 }
]), async (req, res) => {
  try {
    const propertyId = req.params.id;
    const data = JSON.parse(req.body.data);
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

    // Yeni bir ana resim yüklendiyse, eskisini Cloudinary'den sil
    if (mainImageFile) {
      if (oldPropertyData.imageUrl && oldPropertyData.imageUrl.includes('cloudinary')) {
        const publicId = oldPropertyData.imageUrl.split('/').pop().split('.')[0];
        await cloudinary.uploader.destroy(`taylanhomes/${publicId}`);
      }
      updatedImageUrl = mainImageFile.path;
    }

    // Yeni resimler Cloudinary'den gelen URL'lerdir
    const newGalleryImagePaths = galleryImageFiles.map(file => file.path);
    const existingGalleryImagesFromFrontend = data.existingGalleryImages || [];

    updatedGalleryImages = existingGalleryImagesFromFrontend.concat(newGalleryImagePaths);

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
    console.error('Error updating property:', error);
    res.status(500).json({ message: 'Sunucu hatası, ilan güncellenemedi.' });
  }
});

// İlan silme (Cloudinary'deki resimleri de siler)
app.delete('/api/properties/:id', authenticateToken, async (req, res) => {
  try {
    const propertyId = req.params.id;
    const docRef = db.collection('properties').doc(propertyId);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return res.status(404).json({ message: 'İlan bulunamadı.' });
    }

    const propertyData = docSnap.data();

    const deleteImageFromCloudinary = async (imageUrl) => {
      if (imageUrl && imageUrl.includes('cloudinary')) {
        const publicId = imageUrl.split('/').pop().split('.')[0];
        console.log(`Cloudinary'den siliniyor: taylanhomes/${publicId}`);
        await cloudinary.uploader.destroy(`taylanhomes/${publicId}`);
      }
    };

    await deleteImageFromCloudinary(propertyData.imageUrl);
    if (propertyData.galleryImages && Array.isArray(propertyData.galleryImages)) {
      await Promise.all(propertyData.galleryImages.map(deleteImageFromCloudinary));
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