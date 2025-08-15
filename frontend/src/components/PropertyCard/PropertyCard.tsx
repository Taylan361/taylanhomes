import React from 'react';
import { motion } from 'framer-motion';
import styles from './PropertyCard.module.css';
import { useTranslation } from 'react-i18next';
import { FaBed, FaBath, FaRulerCombined, FaMapMarkerAlt, FaMap, FaTh } from 'react-icons/fa';
import { useCurrency } from '../../context/CurrencyContext';
import type { Property } from '../../types/Property';


interface PropertyCardProps {
  property: Property;
  index: number;
  animationType?: 'vertical' | 'horizontal';
}

const PropertyCard: React.FC<PropertyCardProps> = ({ property, index, animationType = 'vertical' }) => {
  const { t } = useTranslation();
  const { getPriceForCurrency, getCurrencySymbol, selectedCurrency } = useCurrency();

  const displayPrice = getPriceForCurrency({
    TRY: property.priceTRY,
    USD: property.priceUSD,
    EUR: property.priceEUR
  });
  const currencySymbol = getCurrencySymbol(selectedCurrency);

  const isSold = property.status === 'sold';

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
        ease: "easeOut" as const,
        delay: index * 0.05
      }
    }
  };

  const initialVisibleThreshold = 3;

  return (
    <motion.div
      className={styles.card}
      initial={index < initialVisibleThreshold ? false : "hidden"}
      animate={"visible"}
      whileInView={index < initialVisibleThreshold ? undefined : "visible"}
      viewport={index < initialVisibleThreshold ? undefined : { once: true, amount: 0.3 }}
      variants={index < initialVisibleThreshold ? undefined : cardVariants}
      transition={index < initialVisibleThreshold ? { duration: 0 } : cardVariants.visible.transition}
      whileHover={{ y: -5, boxShadow: "0 10px 20px rgba(0,0,0,0.15)" }}
      whileTap={{ scale: 0.98 }}
      onClick={() => {
        window.history.pushState({}, '', `/ilanlar/${property.id}`);
        window.dispatchEvent(new PopStateEvent('popstate'));
      }}
    >
      <div className={styles.imageWrapper}>
        <img
          src={property.imageUrl || 'https://placehold.co/600x400/E0E0E0/333333?text=No+Image'}
          alt={t(property.nameKey)}
          className={styles.propertyImage}
          onError={(e) => { e.currentTarget.src = 'https://placehold.co/600x400/E0E0E0/333333?text=No+Image'; }}
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
            <span><FaMap /> {t('block_number')}: {property.blockNumber}</span>
          </div>
        )}
        {property.type === 'land' && property.parcelNumber && (
          <div className={styles.features}>
            <span><FaTh /> {t('parcel_number')}: {property.parcelNumber}</span>
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