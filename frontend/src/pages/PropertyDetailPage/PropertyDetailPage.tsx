import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import styles from './PropertyDetailPage.module.css';
import { FaBed, FaBath, FaRulerCombined, FaMapMarkerAlt, FaPhoneAlt, FaEnvelope, FaChevronLeft, FaChevronRight, FaBuilding, FaMap, FaTh, FaTimes } from 'react-icons/fa';
import { useCurrency } from '../../context/CurrencyContext';
import 'leaflet/dist/leaflet.css'; // Leaflet CSS'ini import et
import L from 'leaflet';
import axios from 'axios';

// Leaflet varsayılan ikonlarını düzeltme (görselin bozuk çıkmaması için gerekli)
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});


// İlan tipi tanımı (backend'deki ile uyumlu olmalı)
interface Property {
  id: string;
  nameKey: string;
  descriptionKey: string;
  priceTRY: number;
  priceUSD: number;
  priceEUR: number;
  imageUrl: string;
  galleryImages: string[];
  location: string;
  latitude?: number; // Harita için enlem
  longitude?: number;
  // Harita için boylam
  bedrooms?: number;
  bathrooms?: number;
  area: number;
  type: 'apartment' | 'land';
  status: 'available' | 'sold';
  isFeatured: boolean;
  blockNumber?: string;
  parcelNumber?: string;
}

// Koordinatları doğrulamak için yardımcı fonksiyon
const isValidCoordinate = (coord: number | undefined, type: 'lat' | 'lng'): boolean => {
  if (typeof coord !== 'number' || isNaN(coord)) {
    return false;
  }
  if (type === 'lat') {
    return coord >= -90 && coord <= 90;
  }
  if (type === 'lng') {
    return coord >= -180 && coord <= 180;
  }
  return false;
};

// PropertyDetailPage bileşeni
const PropertyDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { getPriceForCurrency, getCurrencySymbol, selectedCurrency } = useCurrency();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mainImageIndex, setMainImageIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxImageIndex, setLightboxImageIndex] = useState(0);

  // Leaflet harita için referanslar
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const mapElementRef = useRef<HTMLDivElement>(null);

  // Backend URL'nizi buraya ekleyin
  const API_BASE_URL = 'http://localhost:5000';

  const initMap = useCallback((lat: number, lng: number) => {
    console.log(`[initMap] Harita başlatma çağrıldı: Lat: ${lat}, Lng: ${lng}`);

    if (!mapElementRef.current) {
      console.error("[initMap] HATA: Harita elementi referansı boş. Harita başlatılamıyor.");
      return;
    }

    const mapElement = mapElementRef.current;
    const { clientWidth, clientHeight } = mapElement;

    if (clientWidth === 0 || clientHeight === 0) {
      console.warn(`[initMap] UYARI: Harita div'inin boyutu sıfır. Harita görünmeyebilir. Bir sonraki animasyon karesinde tekrar denenecek.`);
      requestAnimationFrame(() => initMap(lat, lng));
      return;
    }

    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
      markerRef.current = null;
    }

    const initialZoom = 14;

    try {
    mapRef.current = L.map(mapElement, {
  center: [lat, lng],
  zoom: initialZoom,
  zoomControl: false,
  scrollWheelZoom: false,
  doubleClickZoom: false,
  dragging: false,
});
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> katkıda bulunanları'
      }).addTo(mapRef.current);
      markerRef.current = L.marker([lat, lng]).addTo(mapRef.current);

      console.log("[initMap] Leaflet harita başarıyla başlatıldı.");

      mapRef.current.invalidateSize();
      console.log("[initMap] Harita boyutu güncellendi (invalidateSize).");

    } catch (mapError) {
      console.error("[initMap] HATA: Leaflet harita başlatılırken veya güncellenirken hata oluştu:", mapError);
      setError(t('mapInitializationError') + ': ' + (mapError as Error).message);
    }
  }, [t]);

  useEffect(() => {
    let resizeObserver: ResizeObserver | null = null;
    if (mapElementRef.current && mapRef.current) {
      const mapInstance = mapRef.current;
      resizeObserver = new ResizeObserver(() => {
        if (mapInstance) {
          mapInstance.invalidateSize();
          console.log("[ResizeObserver] Harita boyutu değişti, invalidateSize çağrıldı.");
        }
      });
      resizeObserver.observe(mapElementRef.current);
    }

    return () => {
      if (resizeObserver) {
        resizeObserver.disconnect();
        console.log("[ResizeObserver] Bağlantı kesildi.");
      }
    };
  }, [property, initMap]);

  useEffect(() => {
    let isMounted = true;
    const fetchPropertyDetails = async () => {
      setLoading(true);
      setError(null);
      if (!id) {
        setLoading(false);
        setError(t('propertyNotFoundMessage'));
        console.error("[useEffect] HATA: İlan ID'si bulunamadı.");
        return;
      }
      try {
        console.log(`[useEffect] PropertyDetailPage: ID ile ilan çekiliyor: ${id}`);
        const response = await axios.get<Property>(`${API_BASE_URL}/api/properties/${id}`);
        const data = response.data;

        if (!isMounted) return;

        if (!data.galleryImages || data.galleryImages.length === 0) {
          data.galleryImages = [data.imageUrl];
        }
        
        setProperty(data);
        setMainImageIndex(0);
        console.log('[useEffect] Çekilen ilan verisi:', data);

        if (data.latitude !== undefined && data.longitude !== undefined) {
          const validLat = isValidCoordinate(data.latitude, 'lat');
          const validLng = isValidCoordinate(data.longitude, 'lng');

          if (validLat && validLng) {
            console.log(`[useEffect] Harita başlatma için geçerli koordinatlar mevcut: Lat: ${data.latitude}, Lng: ${data.longitude}`);
            requestAnimationFrame(() => {
              if (isMounted) {
                initMap(data.latitude!, data.longitude!);
              }
            });
          } else {
            console.warn(`[useEffect] UYARI: Harita başlatma için geçersiz enlem (${data.latitude}) veya boylam (${data.longitude}) verisi. Harita başlatılmayacak.`);
            if (mapRef.current) {
              mapRef.current.remove();
              mapRef.current = null;
              markerRef.current = null;
              console.log("[useEffect] Geçersiz harita verisi olduğu için mevcut harita kaldırıldı.");
            }
          }
        } else {
          console.warn("[useEffect] UYARI: Harita başlatma için enlem veya boylam verisi eksik. Harita başlatılmayacak.");
          if (mapRef.current) {
            mapRef.current.remove();
            mapRef.current = null;
            markerRef.current = null;
            console.log("[useEffect] Harita verisi eksik olduğu için mevcut harita kaldırıldı.");
          }
        }

      } catch (err: any) {
        if (!isMounted) return;
        console.error('[useEffect] HATA: İlan detayları çekilirken hata oluştu:', err);
        let displayErrorMessage = t('propertyNotFoundMessage');
        if (axios.isAxiosError(err)) {
          if (err.response) {
            console.error('[Axios Error] Yanıt verisi:', err.response.data);
            console.error('[Axios Error] Yanıt durumu:', err.response.status);
            displayErrorMessage = err.response.data.message || t('serverError') + `: ${err.response.status}`;
          } else if (err.request) {
            console.error('[Axios Error] İstek:', err.request);
            displayErrorMessage = t('networkError') + `: ${err.message}`;
          } else {
            console.error('[Axios Error] Hata mesajı:', err.message);
            displayErrorMessage = t('requestError') + `: ${err.message}`;
          }
        } else {
          displayErrorMessage = t('unknownError') + `: ${err.message}`;
        }
        setError(displayErrorMessage);
      } finally {
        if (isMounted) {
          setLoading(false);
          console.log('[useEffect] Yükleme durumu tamamlandı.');
        }
      }
    };

    fetchPropertyDetails();
    return () => {
      isMounted = false;
      console.log("Cleanup: Harita ve işaretleyici temizleniyor...");
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
        console.log("Cleanup: İşaretleyici kaldırıldı.");
      }
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        console.log("Cleanup: Harita kaldırıldı.");
      }
    };
  }, [id, t, initMap, API_BASE_URL]);

  const goToNextImage = () => {
    if (property?.galleryImages && property.galleryImages.length > 0) {
      setMainImageIndex((prevIndex) => (prevIndex + 1) % property.galleryImages.length);
    }
  };

  const goToPreviousImage = () => {
    if (property?.galleryImages && property.galleryImages.length > 0) {
      setMainImageIndex((prevIndex) => (prevIndex - 1 + property.galleryImages.length) % property.galleryImages.length);
    }
  };

  const openLightbox = (index: number) => {
    setLightboxImageIndex(index);
    setIsLightboxOpen(true);
  };

  const closeLightbox = () => {
    setIsLightboxOpen(false);
  };

  const goToNextLightboxImage = () => {
    if (property?.galleryImages && property.galleryImages.length > 0) {
      setLightboxImageIndex((prevIndex) => (prevIndex + 1) % property.galleryImages.length);
    }
  };

  const goToPreviousLightboxImage = () => {
    if (property?.galleryImages && property.galleryImages.length > 0) {
      setLightboxImageIndex((prevIndex) => (prevIndex - 1 + property.galleryImages.length) % property.galleryImages.length);
    }
  };

  if (loading) {
    return <div className={styles.loadingMessage}>{t('loadingProperties')}</div>;
  }

  if (error || !property) {
    return (
      <div className={styles.errorContainer}>
        <h1 className={styles.errorMessage}>{t('propertyNotFound')}</h1>
        <p className={styles.errorMessage}>{error || t('propertyNotFoundMessage')}</p>
        <button
          onClick={() => navigate('/ilanlar')}
          className={styles.backButton}
        >
          {t('goBackToAllProperties')}
        </button>
      </div>
    );
  }

  const displayPrice = getPriceForCurrency({
    TRY: property.priceTRY,
    USD: property.priceUSD,
    EUR: property.priceEUR
  });
  const currencySymbol = getCurrencySymbol(selectedCurrency);

  const showMap = property.latitude !== undefined && property.longitude !== undefined &&
                  isValidCoordinate(property.latitude, 'lat') && isValidCoordinate(property.longitude, 'lng');

  return (
    <>
      <div className={styles.pageHeaderBanner}>
        <div className={styles.bannerContent}>
          <h1 className={styles.propertyTitle}>{t(property.nameKey)}</h1>
          <div className={styles.breadcrumbs}>
            <a href="/" onClick={(e) => { e.preventDefault(); navigate('/'); }}>{t('home')}</a> /
            <a href="/ilanlar" onClick={(e) => { e.preventDefault(); navigate('/ilanlar'); }}> {t('for_sale')}</a> /
            <span> {t(property.nameKey)}</span>
          </div>
        </div>
      </div>

      <div className={styles.propertyDetailPageContainer}>
        <div className={styles.contentWrapper}>
          <div className={styles.imageGallery}>
            <img
              src={property.galleryImages[mainImageIndex] ? `${API_BASE_URL}${property.galleryImages[mainImageIndex]}` : 'https://placehold.co/1200x800/E0E0E0/333333?text=No+Image'}
              alt={t(property.nameKey)}
              className={styles.mainImage}
              onClick={() => openLightbox(mainImageIndex)} // Fotoğrafa tıklayınca lightbox'u aç
              onError={(e) => { e.currentTarget.src = 'https://placehold.co/1200x800/E0E0E0/333333?text=No+Image';
              }}
            />
            {property.galleryImages && property.galleryImages.length > 1 && (
              <div className={styles.imageNavBelow}>
                <button onClick={goToPreviousImage} className={styles.navButtonBelow}>
                  <FaChevronLeft /> 
                </button>
                <button onClick={goToNextImage} className={styles.navButtonBelow}>
                  <FaChevronRight />
                </button>
              </div>
            )}

            {property.galleryImages && property.galleryImages.length > 0 && (
              <div className={styles.thumbnailContainer}>
                {property.galleryImages.map((img, index) => (
                  <img
                    key={index}
                    src={img ? `${API_BASE_URL}${img}` : 'https://placehold.co/100x75/E0E0E0/333333?text=Img'}
                    alt={`${t(property.nameKey)} - ${index + 1}`}
                    className={`${styles.thumbnail} ${mainImageIndex === index ? styles.activeThumbnail : ''}`}
                    onClick={() => setMainImageIndex(index)}
                    onError={(e) => { e.currentTarget.src = 'https://placehold.co/100x75/E0E0E0/333333?text=Img';
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          <div className={styles.detailsSection}>
            <h2 className={styles.detailTitle}>{t(property.nameKey)}</h2>
            <p className={styles.detailLocation}><FaMapMarkerAlt /> {property.location}</p>

            {property.status === 'sold' ? (
              <p className={styles.detailPrice}><span className={styles.soldStatusBadge}>{t('sold_status')}</span></p>
            ) : (
              displayPrice !== undefined && (
                <p className={styles.detailPrice}>{currencySymbol} {displayPrice.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
              )
            )}

            <div className={styles.featuresGrid}>
              {property.type === 'apartment' && (
                <>
                  {property.bedrooms !== undefined && property.bedrooms > 0 && <div className={styles.featureItem}><FaBed /> {property.bedrooms} {t('bedrooms')}</div>}
                  {property.bathrooms !== undefined && property.bathrooms > 0 && <div className={styles.featureItem}><FaBath /> {property.bathrooms} {t('bathrooms')}</div>}
                </>
              )}
              {property.area !== undefined && property.area > 0 && <div className={styles.featureItem}><FaRulerCombined /> {property.area} m² {t('area')}</div>}
              <div className={styles.featureItem}>
                <FaBuilding /> {t('type')}: {property.type === 'apartment' ? t('property_type_apartment') : t('property_type_land')}
              </div>
              {property.type === 'land' && property.blockNumber && (
                <div className={styles.featureItem}><FaMap /> {t('block_number')}: {property.blockNumber}</div>
              )}
              {property.type === 'land' && property.parcelNumber && (
                <div className={styles.featureItem}><FaTh /> {t('parcel_number')}: {property.parcelNumber}</div>
              )}
            </div>

            <div className={styles.descriptionSection}>
              <h3 className={styles.sectionHeading}>{t('description')}</h3>
              <p className={styles.descriptionText}>
                {t(property.descriptionKey || 'no_description_available')}
              </p>
            </div>

            <div className={styles.contactSection}>
              <h3 className={styles.sectionHeading}>{t('contact')}</h3>
              <p><FaPhoneAlt /> +90 542 671 50 64</p>
              <p><FaEnvelope /> info@taylanhomes.com</p>
              <a href="/contact" onClick={(e) => { e.preventDefault(); navigate('/iletisim'); }} className={styles.contactButton}>{t('contactUs')}</a>
            </div>
          </div>
        </div>

        {showMap && (
          <div className={styles.mapSection}>
            <h3 className={styles.sectionHeading}>{t('locationOnMap')}</h3>
            <div ref={mapElementRef} className={styles.mapContainer}></div>
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      {isLightboxOpen && (
        <div className={styles.lightboxOverlay} onClick={closeLightbox}>
          <div className={styles.lightboxContent} onClick={(e) => e.stopPropagation()}>
            <button onClick={closeLightbox} className={styles.lightboxCloseButton}>
              <FaTimes />
            </button>
            <img
              src={property.galleryImages[lightboxImageIndex] ? `${API_BASE_URL}${property.galleryImages[lightboxImageIndex]}` : 'https://placehold.co/1200x800/E0E0E0/333333?text=No+Image'}
              alt={t(property.nameKey)}
              className={styles.lightboxImage}
            />
            {property.galleryImages.length > 1 && (
              <div className={styles.imageNavBelow}>
                <button onClick={goToPreviousLightboxImage} className={styles.navButtonBelow}>
                  <FaChevronLeft />
                </button>
                <button onClick={goToNextLightboxImage} className={styles.navButtonBelow}>
                  <FaChevronRight />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default PropertyDetailPage;