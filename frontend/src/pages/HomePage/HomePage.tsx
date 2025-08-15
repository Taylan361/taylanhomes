import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import styles from './HomePage.module.css';
import { FaBed, FaBath, FaRulerCombined, FaMapMarkerAlt, FaMap, FaTh } from 'react-icons/fa';
import { useCurrency } from '../../context/CurrencyContext';
import HeroSection from '../../components/HeroSection/HeroSection';

// Backend URL'nizi buraya ekleyin
const API_BASE_URL = 'https://taylanhomes.onrender.com';

// Property type definition (should match backend)
interface Property {
  id: string;
  nameKey: string;
  descriptionKey: string;
  priceTRY: number;
  priceUSD: number;
  priceEUR: number;
  imageUrl: string;
  location: string;
  bedrooms?: number;
  bathrooms?: number;
  area: number;
  type: 'apartment' | 'land';
  status: 'available' | 'sold';
  isFeatured: boolean;
  blockNumber?: string;
  parcelNumber?: string;
}

const HomePage: React.FC = () => {
  const { t } = useTranslation();
  const { getPriceForCurrency, getCurrencySymbol, selectedCurrency } = useCurrency();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/api/properties`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: Property[] = await response.json();
        
        // !!! Düzeltme: Resim URL'leri zaten tam olduğu için birleştirme kaldırıldı.
        // Ayrıca, eski ilanlar için yer tutucu resim göstermek amacıyla bir kontrol eklendi.
        const correctedData = data.map(p => {
          // Eğer URL http ile başlamıyorsa, yer tutucu URL kullan
          const finalImageUrl = p.imageUrl && p.imageUrl.startsWith('http')
            ? p.imageUrl
            : 'https://placehold.co/600x400/E0BBE4/FFFFFF?text=No+Image';

          return {
            ...p,
            imageUrl: finalImageUrl
          };
        });
        
        setProperties(correctedData);
      } catch (err: any) {
        setError(t('failedToLoadProperties') + ': ' + err.message);
        console.error("Failed to fetch properties:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, [t]);

  const featuredProperties = properties.filter(p => p.isFeatured);

  const handleExploreClick = () => {
    window.history.pushState({}, '', '/ilanlar');
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  if (loading) {
    return <div className={styles.loading}>{t('loadingProperties')}...</div>;
  }

  if (error) {
    return <div className={styles.error}>{t('error')}: {error}</div>;
  }

  return (
    <div className={styles.homePage}>
      <HeroSection onExploreClick={handleExploreClick} />

      <section className={styles.featuredPropertiesSection}>
        <h2>{t('featured_properties')}</h2>
        {featuredProperties.length > 0 ? (
          <div className={styles.propertiesGrid}>
            {featuredProperties.map(property => {
              const isSold = property.status === 'sold';
              const displayPrice = getPriceForCurrency({
              TRY: property.priceTRY,
              USD: property.priceUSD,
              EUR: property.priceEUR
            });
              const currencySymbol = getCurrencySymbol(selectedCurrency);

              return (
                <div key={property.id} className={styles.propertyCardWrapper}>
                  <Link to={`/ilanlar/${property.id}`} className={styles.propertyCard}>
                    <div className={styles.imageWrapper}>
                      <img
                        // !!! Düzeltme: Doğrudan `property.imageUrl` kullanılıyor
                        src={property.imageUrl}
                        alt={t(property.nameKey)}
                        className={styles.propertyImage}
                        // !!! Düzeltme: onError işlevi de yer tutucu URL'yi kullanıyor
                        onError={(e) => { e.currentTarget.src = `https://placehold.co/600x400/E0BBE4/FFFFFF?text=${t(property.nameKey)}`; }}
                      />
                      <div className={styles.propertyTypeBadge}>
                        {property.type === 'apartment' ? t('property_type_apartment') : t('property_type_land')}
                      </div>
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
                      {!isSold && typeof displayPrice === 'number' && (
                        <p className={styles.propertyPrice}>
                          {currencySymbol} {displayPrice.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </p>
                      )}
                      {isSold && (
                        <p className={styles.soldText}>{t('sold_status')}</p>
                      )}
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        ) : (
          <p>{t('noFeaturedProperties')}</p>
        )}
      </section>
    </div>
  );
};

export default HomePage;