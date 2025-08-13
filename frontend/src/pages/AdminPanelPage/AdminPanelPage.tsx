import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import type { User } from 'firebase/auth';
//import { getFirestore } from 'firebase/firestore';
import styles from './AdminPanelPage.module.css';
import { FaEdit, FaTrash, FaPlus, FaGlobe } from 'react-icons/fa';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import type { Property } from '../../types/Property';
import markerIcon from '../../assets/images/marker-icon.png';
import markerIcon2x from '../../assets/images/marker-icon-2x.png';
import markerShadow from '../../assets/images/marker-shadow.png';


// Leaflet varsayılan ikonlarını düzeltme (görselin bozuk çıkmaması için gerekli)
// Bu kısım, ikonların doğru yüklenmesini sağlamak için önemlidir.
// Eğer hala ikonlar görünmezse, bu URL'lerin erişilebilirliğini kontrol edin.
// Bu kontrol, _getIconUrl'nin zaten tanımlı olup olmadığını kontrol eder.


// Firebase yapılandırması (Kendi Firebase projenizin config'ini buraya yapıştırın)
// Kullanıcının sağladığı Firebase config bilgileri:
const firebaseConfig = {
  apiKey: "AIzaSyBiewGDWYUw0fI4CY1DXYSGswMJOvW06wU",
  authDomain: "taylanhomes.firebaseapp.com",
  projectId: "taylanhomes",
  storageBucket: "taylanhomes.firebasestorage.app",
  messagingSenderId: "752891520824",
  appId: "1:752891520824:web:520a8f6c75b332238d43cd",
  measurementId: "G-W81K0VT9E3"
};

// Firebase uygulamasını başlat
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
//const db = getFirestore(app); // Firestore'u başlat

// Backend URL'nizi buraya ekleyin
const API_BASE_URL = 'http://localhost:5000'; // Backend sunucunuzun adresi



// Özel alert/modal için state
interface CustomAlert {
  message: string;
  type: 'success' | 'error' | 'info' | 'confirm';
  actionId?: string; // Onay gerektiren eylemler için ID
}



const AdminPanelPage: React.FC = () => {
  const customIcon = L.icon({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});
  
  const { t } = useTranslation();
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [properties, setProperties] = useState<Property[]>([]);
  const [loadingProperties, setLoadingProperties] = useState(true);
  const [propertyError, setPropertyError] = useState('');
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleNumericChange = (e: React.ChangeEvent<HTMLInputElement>, currency: 'TRY' | 'USD' | 'EUR') => {
    const { value } = e.target;
    // Sadece rakamları ve ondalık ayırıcı olarak sadece ilk noktayı kabul et
    let cleanedValue = value.replace(/[^0-9.]/g, '');
    const parts = cleanedValue.split('.');
    if (parts.length > 2) {
        cleanedValue = parts[0] + '.' + parts.slice(1).join('');
    }

    const numericValue = parseFloat(cleanedValue) || 0;

    setEditingProperty(prev => {
        if (!prev) return null;
        return { ...prev, [`price${currency}`]: numericValue };
    });
};

  // Resim yükleme için state'ler
  const [mainImageFile, setMainImageFile] = useState<File | null>(null);
  const [galleryImageFiles, setGalleryImageFiles] = useState<File[]>([]);
  const [mainImagePreview, setMainImagePreview] = useState<string | null>(null);
  const [galleryImagePreviews, setGalleryImagePreviews] = useState<string[]>([]);

  // Özel alert/modal için state
  const [customAlert, setCustomAlert] = useState<CustomAlert | null>(null);

  // Leaflet harita için referanslar
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null); // Başlangıçta null veya varsayılan bir marker
  const mapElementRef = useRef<HTMLDivElement>(null); // Harita div'i için ref

  // Helper: Sayıyı görüntüleme için formatlama (örn: 3.100.000,00)
  const formatNumberForDisplay = (num: number | string | undefined | null): string => {
    if (num === null || num === undefined || num === '') return '';
    const numberValue = typeof num === 'string' ? parseNumberFromInput(num) : num;
    if (isNaN(numberValue as number) || numberValue === null) return '';

    return new Intl.NumberFormat('tr-TR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
      useGrouping: true
    }).format(numberValue as number);
  };

  // Helper: Input'tan gelen formatlı string'i sayıya çevirme veya null döndürme
  // Bu fonksiyon, hem virgülü hem de noktayı ondalık ayırıcı olarak kabul eder.
  const parseNumberFromInput = (str: string | number | undefined | null): number | null => {
    if (str === null || str === undefined || str === '') return null;
    const cleaned = String(str).replace(/\./g, '').replace(/,/g, '.'); // Binlik ayırıcıları kaldır, ondalık ayırıcıyı noktaya çevir
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? null : parsed;
  };

  // Haritayı başlatma ve güncelleme fonksiyonu
  const initMap = useCallback(() => {
    if (!mapElementRef.current) {
      console.warn("Harita elementi referansı boş. Harita başlatılamıyor.");
      return;
    }

    const mapElement = mapElementRef.current;
    const currentLat = editingProperty?.latitude || 38.9637; // Türkiye'nin merkezi
    const currentLng = editingProperty?.longitude || 35.2433;
    const initialZoom = (editingProperty?.latitude !== null && editingProperty?.latitude !== undefined && editingProperty?.longitude !== null && editingProperty?.longitude !== undefined) ? 12 : 6;

    // Eğer harita henüz başlatılmadıysa, yeni bir harita oluştur
    if (!mapRef.current) {
      try {
        mapRef.current = L.map(mapElement, {
          center: [currentLat, currentLng],
          zoom: initialZoom,
          zoomControl: false, // Varsayılan zoom kontrolünü kaldır
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> katkıda bulunanları'
        }).addTo(mapRef.current);

       // İşaretleyiciyi oluştur
markerRef.current = L.marker([currentLat, currentLng], {
  draggable: true,
  icon: customIcon, // <-- Bu satırı ekleyin!
}).addTo(mapRef.current);

        // İşaretleyici sürüklendiğinde konum güncelle
        markerRef.current.on('dragend', (event) => {
          const latLng = event.target.getLatLng();
          setEditingProperty(prev => {
            if (prev) {
              return {
                ...prev,
                latitude: latLng.lat, // Doğrudan number olarak ata
                longitude: latLng.lng, // Doğrudan number olarak ata
              };
            }
            return null;
          });
        });

        // Haritaya tıklandığında konum güncelle
        mapRef.current.on('click', (event: L.LeafletMouseEvent) => {
          const latLng = event.latlng;
          setEditingProperty(prev => {
            if (prev) {
              return {
                ...prev,
                latitude: latLng.lat, // Doğrudan number olarak ata
                longitude: latLng.lng, // Doğrudan number olarak ata
              };
            }
            return null;
          });
          // İşaretleyiciyi yeni konuma taşı
          if (markerRef.current) {
            markerRef.current.setLatLng(latLng);
          }
        });

        console.log("Leaflet harita başlatıldı.");
      } catch (error) {
        console.error("Leaflet harita başlatılırken hata oluştu:", error);
        // Harita başlatma hatasında kullanıcıya bilgi ver
        setCustomAlert({ message: t('mapInitializationError') + ': ' + (error as Error).message, type: 'error' });
      }
    } else {
      // Harita zaten başlatıldıysa, sadece merkezi ve işareti güncelle
      mapRef.current.setView([currentLat, currentLng], initialZoom);
      if (markerRef.current) {
        markerRef.current.setLatLng([currentLat, currentLng]);
      } else {
        // Eğer marker yoksa ve harita var ise, yeni marker oluştur
        // ...
// Eğer marker yoksa ve harita var ise, yeni marker oluştur
try {
  markerRef.current = L.marker([currentLat, currentLng], {
    draggable: true,
    icon: customIcon // <-- Bu satırı ekleyin!
  }).addTo(mapRef.current);
// ...

          markerRef.current.on('dragend', (event) => {
            const latLng = event.target.getLatLng();
            setEditingProperty(prev => {
              if (prev) {
                return {
                  ...prev,
                  latitude: latLng.lat,
                  longitude: latLng.lng,
                };
              }
              return null;
            });
          });
        } catch (error) {
          console.error("Mevcut haritada işaretleyici oluşturulurken hata oluştu:", error);
        }
      }
      console.log("Leaflet harita güncellendi.");
    }

    // Harita boyutunu güncelle (modal açıldığında haritanın doğru görünmesi için)
    // Bu, invalidateSize'ın doğru zamanda çağrılmasını sağlar.
    if (mapRef.current) {
      mapRef.current.invalidateSize();
    }

  }, [t, editingProperty]); // editingProperty'yi bağımlılık olarak ekledik

  // Modal açıldığında haritayı başlat/güncelle
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if ((editingProperty || isAddingNew)) {
      // Haritanın görünür olduğundan emin olmak için küçük bir gecikme
      // Bu gecikme, modalın tamamen açılmasını ve harita div'inin boyutlanmasını bekler.
      timer = setTimeout(() => {
        initMap();
        // Eğer editingProperty'de konum varsa, marker'ı o konuma taşı
        if (editingProperty?.latitude !== null && editingProperty?.latitude !== undefined && editingProperty?.longitude !== null && editingProperty?.longitude !== undefined && markerRef.current) {
          markerRef.current.setLatLng([editingProperty.latitude, editingProperty.longitude]);
          mapRef.current?.setView([editingProperty.latitude, editingProperty.longitude], 12);
        }
      }, 100);
    }

    return () => {
      clearTimeout(timer); // Cleanup on unmount or dependency change
      // Modal kapandığında veya bileşen unmount edildiğinde harita ve işaretleyiciyi temizle
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
      if (mapRef.current) {
        mapRef.current.remove(); // Haritayı tamamen kaldır
        mapRef.current = null;
        console.log("Leaflet harita temizlendi.");
      }
    };
  }, [editingProperty, isAddingNew, initMap]); // initMap'i bağımlılık olarak ekledik


  // İlanları backend'den çekme fonksiyonu
  // currentUser parametresi, onAuthStateChanged'den gelen en güncel kullanıcı bilgisini alır.
  // Diğer yerlerden çağrıldığında (örn: ilan ekleme sonrası), `user` state'indeki değeri kullanırız.
  const fetchProperties = useCallback(async (loggedInUser: User | null = user) => { // Default to state `user`
    setLoadingProperties(true);
    setPropertyError('');
    try {
      if (!loggedInUser) {
        console.warn("Kullanıcı oturumu bulunamadı. İlanlar getirilemiyor.");
        setPropertyError(t('notLoggedIn')); // Kullanıcı yoksa hata mesajı göster
        setLoadingProperties(false);
        return;
      }

      const idToken = await loggedInUser.getIdToken();

      if (!idToken) {
        // Bu durum, kullanıcı oturumu olmasına rağmen token'ın anlık olarak alınamadığı nadir durumlar içindir.
        console.error("Kullanıcı kimlik doğrulama token'ı alınamadı.");
        setPropertyError(t('authError') + ': ' + t('tokenNotFound'));
        setLoadingProperties(false);
        return;
      }

      console.log("Fetching properties with ID Token (first 20 chars):", idToken.substring(0, 20) + '...');
      const response = await fetch(`${API_BASE_URL}/api/properties`, { // API_BASE_URL kullanıldı
        headers: {
          'Authorization': `Bearer ${idToken}`
        }
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();
      setProperties(data);
      console.log("Properties fetched successfully.");
    } catch (err: any) {
      console.error('Error fetching properties:', err);
      setPropertyError(t('failedToLoadProperties') + ': ' + err.message);
    } finally {
      setLoadingProperties(false);
    }
  }, [user, t]); // `user` hala bağımlılık olarak kalmalı, çünkü diğer çağrılar için varsayılan değeri bu.

  // Kullanıcı oturum durumunu dinle
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      console.log("onAuthStateChanged: currentUser", currentUser ? currentUser.email : "null (not logged in)");
      if (currentUser) {
        fetchProperties(currentUser); // En güncel currentUser'ı doğrudan fonksiyona geçir
      } else {
        setProperties([]);
        setPropertyError(t('notLoggedIn')); // Kullanıcı yoksa hata mesajı göster
      }
    });
    return () => unsubscribe();
  }, [fetchProperties, t]); // fetchProperties ve t bağımlılık olarak eklendi

  // Giriş yapma
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      console.error('Login error:', error);
      setLoginError(t('loginFailed') + ': ' + error.message);
    }
  };

  // Çıkış yapma
  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error: any) {
      console.error('Logout error:', error);
      setCustomAlert({ message: t('logoutFailed') + ': ' + error.message, type: 'error' });
    }
  };

  // Ana görsel dosyasını seçme
  const handleMainImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setMainImageFile(file);
      setMainImagePreview(URL.createObjectURL(file));
    } else {
      setMainImageFile(null);
      // Eğer düzenleme modundaysak ve yeni görsel seçilmediyse, mevcut görseli tut
      if (editingProperty?.imageUrl && !isAddingNew) {
        setMainImagePreview(`${API_BASE_URL}${editingProperty.imageUrl}`); // Mevcut URL'ye base URL ekle
      } else {
        setMainImagePreview(null);
      }
    }
  };

  // Galeri görselleri dosyalarını seçme
  const handleGalleryImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setGalleryImageFiles(filesArray);
      const previews = filesArray.map(file => URL.createObjectURL(file));
      // Mevcut galeri görselleri ile yeni seçilenleri birleştir
      // Mevcut galeri görsellerine API_BASE_URL ekle
      const existingPreviews = (editingProperty?.galleryImages || []).map(url => `${API_BASE_URL}${url}`);
      setGalleryImagePreviews([...existingPreviews, ...previews]);
    } else {
      setGalleryImageFiles([]);
      // Mevcut galeri görsellerine API_BASE_URL ekle
      setGalleryImagePreviews((editingProperty?.galleryImages || []).map(url => `${API_BASE_URL}${url}`));
    }
  };

  // Resimleri backend'e yükleme fonksiyonu
  const uploadImagesToBackend = async (mainImage: File | null, galleryImages: File[], propertyId?: string): Promise<{ imageUrl: string, galleryImages: string[] }> => {
    const formData = new FormData();
    if (mainImage) {
      formData.append('mainImage', mainImage);
    }
    galleryImages.forEach(file => {
      formData.append('galleryImages', file);
    });

    // Metin verilerini de FormData'ya ekle
    // parseNumberFromInput'tan dönen null değerleri doğrudan kullanıyoruz.
    const propertyData = {
      nameKey: editingProperty?.nameKey || '',
      descriptionKey: editingProperty?.descriptionKey || '',
      priceTRY: parseNumberFromInput(editingProperty?.priceTRY),
      priceUSD: parseNumberFromInput(editingProperty?.priceUSD),
      priceEUR: parseNumberFromInput(editingProperty?.priceEUR),
      location: editingProperty?.location || '',
      latitude: editingProperty?.latitude ?? null, // Doğrudan number veya null olarak ata
      longitude: editingProperty?.longitude ?? null, // Doğrudan number veya null olarak ata
      area: parseNumberFromInput(editingProperty?.area),
      type: editingProperty?.type || 'apartment',
      status: editingProperty?.status || 'available',
      isFeatured: editingProperty?.isFeatured || false,
      bedrooms: parseNumberFromInput(editingProperty?.bedrooms), // null olabilir
      bathrooms: parseNumberFromInput(editingProperty?.bathrooms), // null olabilir
      blockNumber: editingProperty?.type === 'land' ? (editingProperty?.blockNumber || null) : null, // Arsa değilse null
      parcelNumber: editingProperty?.type === 'land' ? (editingProperty?.parcelNumber || null) : null, // Arsa değilse null
      existingGalleryImages: editingProperty?.galleryImages || [] // Mevcut galeri görsellerini gönder
    };
    formData.append('data', JSON.stringify(propertyData)); // Tüm veriyi 'data' anahtarı altında JSON string olarak gönderiyoruz

    // Backend URL'ini güncelledim
    const url = propertyId
      ? `${API_BASE_URL}/api/properties/${propertyId}/with-files` // API_BASE_URL kullanıldı
      : `${API_BASE_URL}/api/properties/with-files`; // API_BASE_URL kullanıldı

    const method = propertyId ? 'PUT' : 'POST';

    const response = await fetch(url, {
      method: method,
      headers: {
        'Authorization': `Bearer ${await user?.getIdToken()}`
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
    }

    const result = await response.json();
    return {
      imageUrl: result.imageUrl || '',
      galleryImages: result.galleryImages || []
    };
  };

  // İlan ekleme/düzenleme formu gönderimi
  const handleSubmitProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    setPropertyError('');
    setIsUploading(true);

    if (!user) {
      setPropertyError(t('notAuthorized'));
      setIsUploading(false);
      return;
    }

    const idToken = await user?.getIdToken();
    if (!idToken) {
      setPropertyError(t('authError') + ': ' + t('tokenNotFound'));
      setIsUploading(false);
      return;
    }

    if (isAddingNew && !mainImageFile && !editingProperty?.imageUrl) {
      setPropertyError(t('mainImageRequired'));
      setIsUploading(false);
      return;
    }

    try {
      // finalPropertyData'yı doğrudan FormData'ya eklediğimiz için burada tekrar oluşturmaya gerek yok.
      // uploadImagesToBackend zaten tüm veriyi FormData içinde gönderiyor.
      await uploadImagesToBackend(mainImageFile, galleryImageFiles, editingProperty?.id);

      // Başarılı olursa, alert göster ve formu kapat
      setCustomAlert({ message: isAddingNew ? t('propertyAddedSuccess') : t('propertyUpdatedSuccess'), type: 'success' });
      setEditingProperty(null);
      setIsAddingNew(false);
      setMainImageFile(null);
      setGalleryImageFiles([]);
      setMainImagePreview(null);
      setGalleryImagePreviews([]);
      fetchProperties(); // Başarılı işlem sonrası ilanları yeniden çek
    } catch (err: any) {
      setCustomAlert({ message: t('propertyOperationFailed') + ': ' + err.message, type: 'error' });
      setPropertyError(t('propertyOperationFailed') + ': ' + err.message);
    } finally {
      setIsUploading(false);
    }
  };


  // İlan silme
  const handleDeleteProperty = (id: string) => {
    setCustomAlert({ message: t('confirmDeleteProperty'), type: 'confirm', actionId: id });
  };

  // Onay modalından gelen eylemi işle
  const handleConfirmAction = async (action: 'confirm' | 'cancel', id?: string) => {
    setCustomAlert(null); // Modalı kapat

    if (action === 'confirm' && id) {
      setPropertyError('');
      try {
        const idToken = await user?.getIdToken();
        if (!idToken) {
          setPropertyError(t('authError') + ': ' + t('tokenNotFound'));
          return;
        }

        // Backend URL'ini localhost olarak güncelledim
        const response = await fetch(`${API_BASE_URL}/api/properties/${id}`, { // API_BASE_URL kullanıldı
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${idToken}`
          }
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
        }

        setCustomAlert({ message: t('propertyDeletedSuccess'), type: 'success' });
        fetchProperties(); // Başarılı işlem sonrası ilanları yeniden çek
      } catch (err: any) {
        setCustomAlert({ message: t('deletePropertyFailed') + ': ' + err.message, type: 'error' });
        setPropertyError(t('deletePropertyFailed') + ': ' + err.message);
      }
    }
  };

  // Yeni ilan ekleme modunu aç
  const handleAddNewProperty = () => {
    setEditingProperty({
      nameKey: '',
      descriptionKey: '',
      priceTRY: 0,
      priceUSD: 0,
      priceEUR: 0,
      imageUrl: '',
      galleryImages: [],
      location: '',
      latitude: null, // Yeni ilan eklerken konum sıfırlama
      longitude: null, // Yeni ilan eklerken konum sıfırlama
      bedrooms: null,
      bathrooms: null,
      area: 0,
      type: 'apartment',
      status: 'available',
      isFeatured: false,
      blockNumber: null,
      parcelNumber: null,
    });
    setIsAddingNew(true);
    setMainImageFile(null);
    setGalleryImageFiles([]);
    setMainImagePreview(null);
    setGalleryImagePreviews([]);
  };

  // Düzenleme modunu aç
  const handleEditProperty = (property: Property) => {
    setEditingProperty({
      ...property,
      // Sayısal alanları doğrudan atıyoruz, formatNumberForDisplay sadece gösterim için.
      // Input değerleri zaten string olarak tutulacak.
      priceTRY: property.priceTRY,
      priceUSD: property.priceUSD,
      priceEUR: property.priceEUR,
      area: property.area,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      latitude: property.latitude,
      longitude: property.longitude,
      blockNumber: property.blockNumber,
      parcelNumber: property.parcelNumber,
    });
    setIsAddingNew(false);
    // Mevcut resimlerin URL'lerini API_BASE_URL ile birleştirerek önizlemeye hazırla
    setMainImagePreview(property.imageUrl ? `${API_BASE_URL}${property.imageUrl}` : null);
    setGalleryImagePreviews((property.galleryImages || []).map(url => `${API_BASE_URL}${url}`));
    setMainImageFile(null);
    setGalleryImageFiles([]);
  };

  // Formu kapat
  const handleCancelEdit = () => {
    setEditingProperty(null);
    setIsAddingNew(false);
    setMainImageFile(null);
    setGalleryImageFiles([]);
    setMainImagePreview(null);
    setGalleryImagePreviews([]);
    setPropertyError('');
    setIsUploading(false);
  };

  // Otomatik çeviri işlevi (Placeholder - API'siz devam)
  const handleTranslateAll = async () => {
    if (!editingProperty || !editingProperty.nameKey || !editingProperty.descriptionKey) {
      setCustomAlert({ message: t('translateWarning'), type: 'info' });
      return;
    }
    setPropertyError('');
    setCustomAlert({ message: t('translationFeatureComingSoon'), type: 'info' });
  };

  // Alert/Modal içeriğini ve butonlarını dinamik olarak oluştur
  const renderCustomAlert = () => {
    if (!customAlert) return null;

    if (customAlert.type === 'confirm') {
      return (
        <div className={styles.customAlertOverlay}>
          <div className={styles.customAlertBox}>
            <p>{customAlert.message}</p>
            <div className={styles.alertButtons}>
              <button onClick={() => handleConfirmAction('confirm', customAlert.actionId)} className={styles.customAlertButton}>{t('yes')}</button>
              <button onClick={() => handleConfirmAction('cancel')} className={`${styles.customAlertButton} ${styles.cancelAlertButton}`}>{t('no')}</button>
            </div>
          </div>
        </div>
      );
    } else {
      return (
        <div className={styles.customAlertOverlay}>
          <div className={styles.customAlertBox}>
            <p>{customAlert.message}</p>
            <button onClick={() => setCustomAlert(null)} className={styles.customAlertButton}>{t('ok')}</button>
          </div>
        </div>
      );
    }
  };


  if (!user) {
    return (
      <div className={styles.adminLoginContainer}>
        <h2 className={styles.loginTitle}>{t('adminLoginTitle')}</h2>
        <form onSubmit={handleLogin} className={styles.loginForm}>
          <div className={styles.formGroup}>
            <label htmlFor="email">{t('email')}:</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={styles.loginInput}
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="password">{t('password')}:</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className={styles.loginInput}
            />
          </div>
          {loginError && <p className={styles.errorMessage}>{loginError}</p>}
          <button type="submit" className={styles.loginButton}>{t('login')}</button>
        </form>
      </div>
    );
  }

  return (
    <div className={styles.adminPanelContainer}>
      <div className={styles.adminHeader}>
        <h1 className={styles.adminTitle}>{t('adminPanelTitle')}</h1>
        <p>{t('loggedInAs')}: {user.email}</p>
        <button onClick={handleLogout} className={styles.logoutButton}>{t('logout')}</button>
      </div>

      <div className={styles.adminContent}>
        <button onClick={handleAddNewProperty} className={styles.addNewButton}>
          <FaPlus /> {t('addNewProperty')}
        </button>

        {propertyError && <p className={styles.errorMessage}>{propertyError}</p>}
        {isUploading && <p className={styles.uploadingMessage}>{t('uploadingImages')}</p>}

        {(editingProperty || isAddingNew) && (
          <div className={styles.propertyFormContainer}>
            <h3>{isAddingNew ? t('addProperty') : t('editProperty')}</h3>
            <form onSubmit={handleSubmitProperty} className={styles.propertyForm}>
              {/* Property Name and Description - Translation Keys */}
              <div className={styles.formGroup}>
                <label>{t('propertyNameKey')}:</label>
                <input
                  type="text"
                  value={editingProperty?.nameKey || ''}
                  onChange={(e) => setEditingProperty(prev => ({ ...prev!, nameKey: e.target.value }))}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>{t('propertyDescriptionKey')}:</label>
                <textarea
                  value={editingProperty?.descriptionKey || ''}
                  onChange={(e) => setEditingProperty(prev => ({ ...prev!, descriptionKey: e.target.value }))}
                  rows={3}
                ></textarea>
              </div>

              {/* Auto Translate Button - Show only when editing or adding form is open */}
              {(editingProperty || isAddingNew) && (
                <button type="button" onClick={handleTranslateAll} className={styles.translateButton}>
                  <FaGlobe /> {t('translateAllLanguages')}
                </button>
              )}


<div className={styles.priceInputs}>
  <div className={styles.formGroup}>
    <label>{t('priceTRY')}:</label>
    <input
        type="text"
        className={styles.numberInputNoArrows}
        value={editingProperty?.priceTRY || ''}
        onChange={(e) => handleNumericChange(e, 'TRY')}
        required
    />
  </div>
  <div className={styles.formGroup}>
    <label>{t('priceUSD')}:</label>
    <input
      type="text"
      className={styles.numberInputNoArrows}
      value={editingProperty?.priceUSD || ''}
      onChange={(e) => handleNumericChange(e, 'USD')}
      required
    />
  </div>
  <div className={styles.formGroup}>
    <label>{t('priceEUR')}:</label>
    <input
      type="text"
      className={styles.numberInputNoArrows}
      value={editingProperty?.priceEUR || ''}
      onChange={(e) => handleNumericChange(e, 'EUR')}
      required
    />
  </div>
</div>

              {/* Main Image Upload - Now only file input */}
              <div className={styles.formGroup}>
                <label htmlFor="mainImageUpload">{t('mainImageUpload')}:</label>
                <input
                  type="file"
                  id="mainImageUpload"
                  accept="image/*"
                  onChange={handleMainImageChange}
                  className={styles.fileInput}
                  required={isAddingNew && !mainImageFile && !editingProperty?.imageUrl}
                />
                {mainImagePreview && (
                  <div className={styles.imagePreviewContainer}>
                    <img src={mainImagePreview} alt="Main Preview" className={styles.imagePreview} />
                    <p className={styles.imagePreviewText}>{t('currentMainImage')}</p>
                  </div>
                )}
                {isAddingNew && !mainImageFile && !mainImagePreview && <p className={styles.errorMessage}>{t('mainImageRequired')}</p>}
              </div>

              {/* Gallery Images Upload */}
              <div className={styles.formGroup}>
                <label htmlFor="galleryImagesUpload">{t('galleryImagesUpload')}: ({t('selectMultiple')})</label>
                <input
                  type="file"
                  id="galleryImagesUpload"
                  accept="image/*"
                  multiple
                  onChange={handleGalleryImagesChange}
                  className={styles.fileInput}
                />
                {galleryImagePreviews.length > 0 && (
                  <div className={styles.galleryPreviewContainer}>
                    {galleryImagePreviews.map((src, index) => (
                      <img key={index} src={src} alt={`Gallery Preview ${index + 1}`} className={styles.galleryImagePreview} />
                    ))}
                    <p className={styles.imagePreviewText}>{t('currentGalleryImages')}</p>
                  </div>
                )}
              </div>

              {/* Location and Map */}
              <div className={styles.formGroup}>
                <label>{t('location')}:</label>
                <input
                  type="text"
                  value={editingProperty?.location || ''}
                  onChange={(e) => setEditingProperty(prev => ({ ...prev!, location: e.target.value }))}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>{t('selectLocationOnMap')}:</label>
                {/* Harita div'i için stil eklendi */}
                <div ref={mapElementRef} style={{ height: '400px', width: '100%', borderRadius: '8px', overflow: 'hidden', border: '1px solid #ddd' }}></div>
                {editingProperty?.latitude !== undefined && editingProperty?.latitude !== null && editingProperty?.longitude !== undefined && editingProperty?.longitude !== null && (
                  <p className="mt-2 text-sm text-gray-600">
                    Seçilen Konum: Enlem: {editingProperty.latitude.toFixed(4)}, Boylam: {editingProperty.longitude.toFixed(4)}
                  </p>
                )}
              </div>

              {/* Other Information */}
              <div className={styles.twoColumnGrid}>
                <div className={styles.formGroup}>
                  <label>{t('area')}:</label>
                  <input
                    type="text"
                    className={styles.numberInputNoArrows}
                    value={editingProperty?.area !== undefined && editingProperty?.area !== null ? formatNumberForDisplay(editingProperty.area) : ''}
                    onChange={(e) => setEditingProperty(prev => ({ ...prev!, area: e.target.value }))}
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>{t('type')}:</label>
                  <select
                    value={editingProperty?.type || 'apartment'}
                    onChange={(e) => setEditingProperty(prev => ({ ...prev!, type: e.target.value as 'apartment' | 'land' }))}
                    required
                  >
                    <option value="apartment">{t('property_type_apartment')}</option>
                    <option value="land">{t('property_type_land')}</option>
                  </select>
                </div>
                {editingProperty?.type === 'apartment' && (
                  <>
                    <div className={styles.formGroup}>
                      <label>{t('bedrooms')}:</label>
                      <input
                        type="text"
                        className={styles.numberInputNoArrows}
                        value={editingProperty?.bedrooms !== undefined && editingProperty?.bedrooms !== null ? formatNumberForDisplay(editingProperty.bedrooms) : ''}
                        onChange={(e) => setEditingProperty(prev => ({ ...prev!, bedrooms: e.target.value }))}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>{t('bathrooms')}:</label>
                      <input
                        type="text"
                        className={styles.numberInputNoArrows}
                        value={editingProperty?.bathrooms !== undefined && editingProperty?.bathrooms !== null ? formatNumberForDisplay(editingProperty.bathrooms) : ''}
                        onChange={(e) => setEditingProperty(prev => ({ ...prev!, bathrooms: e.target.value }))}
                      />
                    </div>
                  </>
                )}
                {editingProperty?.type === 'land' && (
                  <>
                    <div className={styles.formGroup}>
                      <label>{t('block_number')}:</label>
                      <input
                        type="text"
                        value={editingProperty?.blockNumber || ''}
                        onChange={(e) => setEditingProperty(prev => ({ ...prev!, blockNumber: e.target.value }))}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>{t('parcel_number')}:</label>
                      <input
                        type="text"
                        value={editingProperty?.parcelNumber || ''}
                        onChange={(e) => setEditingProperty(prev => ({ ...prev!, parcelNumber: e.target.value }))}
                      />
                    </div>
                  </>
                )}
                <div className={styles.formGroup}>
                  <label>{t('status')}:</label>
                  <select
                    value={editingProperty?.status || 'available'}
                    onChange={(e) => setEditingProperty(prev => ({ ...prev!, status: e.target.value as 'available' | 'sold' }))}
                    required
                  >
                    <option value="available">{t('available')}</option>
                    <option value="sold">{t('sold_status')}</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={editingProperty?.isFeatured || false}
                      onChange={(e) => setEditingProperty(prev => ({ ...prev!, isFeatured: e.target.checked }))}
                    />
                    {t('isFeatured')}
                  </label>
                </div>
              </div> {/* twoColumnGrid End */}

              <div className={styles.formActions}>
                <button type="submit" className={styles.saveButton} disabled={isUploading}>
                  {isUploading ? t('uploading') : t('save')}
                </button>
                <button type="button" onClick={handleCancelEdit} className={styles.cancelButton} disabled={isUploading}>
                  {t('cancel')}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className={styles.propertiesList}>
          <h3>{t('currentProperties')}</h3>
          {loadingProperties ? (
            <p className={styles.uploadingMessage}>{t('loadingProperties')}</p>
          ) : propertyError ? (
            <p className={styles.errorMessage}>{propertyError}</p>
          ) : properties.length === 0 ? (
            <p className={styles.uploadingMessage}>{t('noPropertiesFound')}</p>
          ) : (
            <table className={styles.propertiesTable}>
              <thead>
                <tr>
                  <th>{t('image')}</th>
                  <th>{t('name')}</th>
                  <th>{t('location')}</th>
                  <th>{t('priceTRY')}</th>
                  <th>{t('status')}</th>
                  <th>{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {properties.map((property) => (
                  <tr key={property.id}>
                    <td data-label={t('image')}>
                      {property.imageUrl ? (
                        // Ana görselin URL'sini düzeltildi
                        <img src={`${API_BASE_URL}${property.imageUrl}`} alt={t(property.nameKey)} className={styles.propertyThumbnail} />
                      ) : (
                        <span>{t('noImage')}</span>
                      )}
                    </td>
                    <td data-label={t('name')}>{t(property.nameKey)}</td>
                    <td data-label={t('location')}>{property.location}</td>
                    <td data-label={t('priceTRY')}>{formatNumberForDisplay(property.priceTRY)} ₺</td>
                    <td data-label={t('status')}>{property.status ? t(property.status) : '-'}</td>


                    <td data-label={t('actions')}>
                      <button onClick={() => handleEditProperty(property)} className={styles.actionButton}>
                        <FaEdit /> {t('edit')}
                      </button>
                      <button onClick={() => handleDeleteProperty(property.id!)} className={`${styles.actionButton} ${styles.deleteButton}`}>
                        <FaTrash /> {t('delete')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
      {renderCustomAlert()}
    </div>
  );
};

export default AdminPanelPage;
