import React from 'react';
import { motion } from 'framer-motion';
import styles from './PropertyCard.module.css';
import { useTranslation } from 'react-i18next';
import { FaBed, FaBath, FaRulerCombined, FaMapMarkerAlt, FaMap, FaTh } from 'react-icons/fa'; // Yeni ikonlar eklendi
import { useCurrency } from '../../context/CurrencyContext';

// İlan tipi tanımı (TypeScript için önemli)
interface Property {
  id: string;
  nameKey: string; // İlan adı için çeviri anahtarı
  descriptionKey?: string; // Açıklama için çeviri anahtarı (opsiyonel)
  priceTRY?: number; // TL fiyatı
  priceUSD?: number; // USD fiyatı
  priceEUR?: number; // EUR fiyatı
  imageUrl: string;
  galleryImages?: string[]; // Galeri görselleri (opsiyonel)
  location: string;
  bedrooms?: number; // Yatak odası sayısı (daireler için)
  bathrooms?: number; // Banyo sayısı (daireler için)
  area?: number; // Alan (metrekare)
  type: 'apartment' | 'land'; // İlan tipi
  status?: 'available' | 'sold'; // Yeni: İlan durumu
  blockNumber?: string; // Ada No (arsalar için) - EKLENDİ
  parcelNumber?: string; // Parsel No (arsalar için) - EKLENDİ
}

interface PropertyCardProps {
  property: Property;
  index: number; // Animasyon gecikmesi için index
  animationType?: 'vertical' | 'horizontal'; // Animasyon yönü
}

const PropertyCard: React.FC<PropertyCardProps> = ({ property, index, animationType = 'vertical' }) => {
  const { t } = useTranslation();
  const { getPriceForCurrency, getCurrencySymbol, selectedCurrency } = useCurrency();

  // Seçilen para birimine göre fiyatı ve sembolü al
  const displayPrice = getPriceForCurrency({
    TRY: property.priceTRY,
    USD: property.priceUSD,
    EUR: property.priceEUR
  });
  const currencySymbol = getCurrencySymbol(selectedCurrency);

  const isSold = property.status === 'sold';

    // Animasyon varyantları
  const cardVariants = {
    hidden: animationType === 'vertical'
      ? { opacity: 0, y: 100 }
      : { opacity: 0, x: index % 2 === 0 ? -100 : 100 },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut" as const,   // <-- burası değişti
        delay: index * 0.05
      }
    }
  };


  // İlk N ilan için animasyonu devre dışı bırak
  const initialVisibleThreshold = 3;

  return (
    <motion.div
      className={styles.card}
      // Animasyon prop'larını doğrudan ve koşullu olarak uygula
      initial={index < initialVisibleThreshold ? false : "hidden"} // İlk 3 kart için başlangıç animasyonu yok
      animate={"visible"} // Her zaman 'visible' durumuna animasyon yap
      whileInView={index < initialVisibleThreshold ? undefined : "visible"} // İlk 3 kart dışındakiler için görünür olduğunda animasyon yap
      viewport={index < initialVisibleThreshold ? undefined : { once: true, amount: 0.3 }} // İlk 3 kart dışındakiler için viewport ayarları
      variants={index < initialVisibleThreshold ? undefined : cardVariants} // İlk 3 kart dışındakiler için varyantları kullan
      transition={index < initialVisibleThreshold ? { duration: 0 } : cardVariants.visible.transition} // İlk 3 kart için geçiş süresi 0
      whileHover={{ y: -5, boxShadow: "0 10px 20px rgba(0,0,0,0.15)" }}
      whileTap={{ scale: 0.98 }}
      onClick={() => {
        window.history.pushState({}, '', `/ilanlar/${property.id}`);
        window.dispatchEvent(new PopStateEvent('popstate'));
      }}
    >
      <div className={styles.imageWrapper}>
        <img
          src={property.imageUrl}
          alt={t(property.nameKey)}
          className={styles.propertyImage}
          // onError handler kaldırıldı
        />
        <div className={styles.propertyType}>{property.type === 'apartment' ? t('property_type_apartment') : t('property_type_land')}</div>
        {isSold && <div className={styles.soldOverlay}>{t('sold_status')}</div>}
      </div>
      <div className={styles.info}>
        <h3 className={styles.propertyName}>{t(property.nameKey)}</h3>
        <p className={styles.propertyLocation}><FaMapMarkerAlt /> {property.location}</p>
        {property.type === 'apartment' && (
          <div className={styles.features}>
            {property.bedrooms && <span><FaBed /> {property.bedrooms} {t('bedrooms')}</span>}
            {property.bathrooms && <span><FaBath /> {property.bathrooms} {t('bathrooms')}</span>}
            {property.area && <span><FaRulerCombined /> {property.area} m² {t('area')}</span>}
          </div>
        )}
        {property.type === 'land' && property.area && (
          <div className={styles.features}>
            <span><FaRulerCombined /> {property.area} m² {t('area')}</span>
          </div>
        )}
        {property.type === 'land' && property.blockNumber && (
          <div className={styles.features}>
            <span><FaMap /> {t('block_number')}: {property.blockNumber}</span> {/* Ada No ikonu eklendi */}
          </div>
        )}
        {property.type === 'land' && property.parcelNumber && (
          <div className={styles.features}>
            <span><FaTh /> {t('parcel_number')}: {property.parcelNumber}</span> {/* Parsel No ikonu eklendi */}
          </div>
        )}
        {!isSold && displayPrice !== undefined && (
          <p className={styles.propertyPrice}>{currencySymbol} {displayPrice.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
        )}
        {isSold && (
          <p className={styles.soldText}>{t('sold_status')}</p>
        )}
      </div>
    </motion.div>
  );
};

export default PropertyCard;
