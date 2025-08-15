import React, { useEffect, useState, useRef } from 'react';
import PropertyGrid from '../../components/PropertyGrid/PropertyGrid';
import { useTranslation } from 'react-i18next';
import { FaArrowDown } from 'react-icons/fa';
import styles from './ForSalePage.module.css';

const API_BASE_URL = 'https://taylanhomes.onrender.com';

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
  bedrooms?: number;
  bathrooms?: number;
  area: number;
  type: 'apartment' | 'land';
  status: 'available' | 'sold';
  isFeatured: boolean;
  blockNumber?: string;
  parcelNumber?: string;
}

const ForSalePage: React.FC = () => {
  const { t } = useTranslation();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const landSectionRef = useRef<HTMLDivElement>(null);
  const [showScrollToLandsButton, setShowScrollToLandsButton] = useState(false);

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/api/properties`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: Property[] = await response.json();

        // !!! Düzeltme: URL birleştirme kaldırıldı ve yer tutucu mantığı eklendi
        const correctedData = data.map(p => {
          // Ana resim için kontrol
          const finalImageUrl = p.imageUrl && p.imageUrl.startsWith('http')
            ? p.imageUrl
            : 'https://placehold.co/600x400/E0BBE4/FFFFFF?text=No+Image';

          // Galeri resimleri için kontrol
          const finalGalleryImages = p.galleryImages ? p.galleryImages.map(img =>
            img && img.startsWith('http') ? img : 'https://placehold.co/600x400/E0BBE4/FFFFFF?text=No+Image'
          ) : [];

          return {
            ...p,
            imageUrl: finalImageUrl,
            galleryImages: finalGalleryImages
          };
        });

        setProperties(correctedData);
      } catch (err: any) {
        console.error("Failed to fetch properties:", err);
        setError(t('failedToLoadProperties') + ': ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, [t]);

  const handleScrollToLands = () => {
    if (landSectionRef.current) {
      landSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      if (landSectionRef.current) {
        const landSectionOffsetTop = landSectionRef.current.offsetTop;
        const currentScrollY = window.scrollY;

        if (window.innerWidth <= 768 && currentScrollY < landSectionOffsetTop - window.innerHeight + 200) {
          setShowScrollToLandsButton(true);
        } else {
          setShowScrollToLandsButton(false);
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleScroll);
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [properties]);

  const apartments = properties.filter(p => p.type === 'apartment');
  const lands = properties.filter(p => p.type === 'land');

  if (loading) {
    return <div className={styles.loadingMessage}>{t('loadingProperties')}</div>;
  }

  if (error) {
    return <div className={styles.errorMessage}>{error}</div>;
  }

  return (
    <div className={styles.forSalePage}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>{t('forSalePageBannerTitle')}</h1>
        <div className={styles.breadcrumbs}>
          <a href="/" onClick={(e) => { e.preventDefault(); window.history.pushState({}, '', '/'); window.dispatchEvent(new PopStateEvent('popstate')); }}>{t('home')}</a> / <span>{t('for_sale')}</span>
        </div>
      </div>

      {lands.length > 0 && (
        <button
          onClick={handleScrollToLands}
          className={`${styles.scrollButton} ${styles.scrollToLandsButtonMobile} ${showScrollToLandsButton ? styles.visible : ''}`}
        >
          {t('lands_title')} <FaArrowDown className={styles.arrowIcon} />
        </button>
      )}

      <div className={styles.mainContent}>
        <div className={styles.categoryColumn}>
          <div className={styles.categorySection}>
            <h2 className={styles.categoryTitle}>{t('apartments_title')}</h2>
            {apartments.length === 0 ? (
              <p className={styles.noPropertiesMessage}>{t('noPropertiesFound')}</p>
            ) : (
              <PropertyGrid properties={apartments} showTitle={false} animationType="vertical" layoutType="single-column" />
            )}
          </div>
        </div>

        <div className={styles.categoryColumn}>
          <div ref={landSectionRef} className={styles.categorySection}>
            <h2 className={styles.categoryTitle}>{t('lands_title')}</h2>
            {lands.length === 0 ? (
              <p className={styles.noPropertiesMessage}>{t('noPropertiesFound')}</p>
            ) : (
              <PropertyGrid properties={lands} showTitle={false} animationType="vertical" layoutType="single-column" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForSalePage;