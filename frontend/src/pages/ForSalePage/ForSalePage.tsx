import React, { useEffect, useState, useRef } from 'react';
import PropertyGrid from '../../components/PropertyGrid/PropertyGrid';
import { useTranslation } from 'react-i18next';
import { FaArrowDown } from 'react-icons/fa'; // Sadece aşağı ok ikonu için
import styles from './ForSalePage.module.css';

// Backend URL'nizi buraya ekleyin
const API_BASE_URL = 'https://taylanhomes.onrender.com'; // Backend sunucunuzun adresi

// İlan tipi tanımı (backend'deki ile uyumlu olmalı)
interface Property {
  id: string;
  nameKey: string;
  descriptionKey: string; // Açıklama için çeviri anahtarı
  priceTRY: number;
  priceUSD: number;
  priceEUR: number;
  imageUrl: string; // Ana görsel URL'si
  galleryImages: string[]; // Galeri görselleri URL'leri
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
  const landSectionRef = useRef<HTMLDivElement>(null); // Arsalar bölümü için ref
  const [showScrollToLandsButton, setShowScrollToLandsButton] = useState(false); // Buton görünürlüğü için state

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        setLoading(true);
        // Backend API endpoint'inizden ilanları çekin (kimlik doğrulama gerektirmez)
        const response = await fetch(`${API_BASE_URL}/api/properties`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        let data: Property[] = await response.json();

        // Her bir ilanın görsel URL'lerini düzelt
        data = data.map(p => ({
          ...p,
          imageUrl: `${API_BASE_URL}${p.imageUrl}`,
          galleryImages: p.galleryImages ? p.galleryImages.map(img => `${API_BASE_URL}${img}`) : [],
        }));

        setProperties(data);
      } catch (err: any) {
        console.error("Failed to fetch properties:", err);
        setError(t('failedToLoadProperties') + ': ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, [t]);

  // Butona tıklandığında arsalar bölümüne kaydırma işlevi
  const handleScrollToLands = () => {
    if (landSectionRef.current) {
      landSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Kaydırma olayını dinleyerek butonun görünürlüğünü ayarla
  useEffect(() => {
    const handleScroll = () => {
      if (landSectionRef.current) {
        // Arsalar bölümünün sayfanın üstünden uzaklığı
        const landSectionOffsetTop = landSectionRef.current.offsetTop;
        // Mevcut kaydırma konumu
        const currentScrollY = window.scrollY;

        // Butonun görünür olması için koşul:
        // Eğer mevcut kaydırma konumu, arsalar bölümünün başlangıcından belirli bir mesafe (örneğin 100px) yukarıdaysa
        // ve arsalar bölümü ekranın üst kısmında henüz görünmüyorsa butonu göster.
        // Aksi takdirde butonu gizle.
        // Sadece mobil cihazlarda göster
        if (window.innerWidth <= 768 && currentScrollY < landSectionOffsetTop - window.innerHeight + 200) { // 200px ek marj
          setShowScrollToLandsButton(true);
        } else {
          setShowScrollToLandsButton(false);
        }
      }
    };

    // Component yüklendiğinde ve her kaydırma olayında dinleyiciyi ekle
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleScroll); // Ekran boyutu değiştiğinde de kontrol et
    // Sayfa yüklendiğinde veya properties değiştiğinde başlangıç durumunu ayarla
    handleScroll();

    // Component kaldırıldığında olay dinleyicisini temizle
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [properties]); // properties değiştiğinde de scroll kontrolü yapsın

  // Backend'den çekilen ilanları tipine göre ayır
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

      {/* Sabit Kaydırma Butonu (Sadece mobil görünümde ve Daireler başlığı hizasında) */}
      {lands.length > 0 && ( // Sadece arsalar varsa "Arsalar" butonunu göster
        <button
          onClick={handleScrollToLands}
          className={`${styles.scrollButton} ${styles.scrollToLandsButtonMobile} ${showScrollToLandsButton ? styles.visible : ''}`}
        >
          {t('lands_title')} <FaArrowDown className={styles.arrowIcon} /> {/* Buton metni "Arsalar" olarak değiştirildi */}
        </button>
      )}

      <div className={styles.mainContent}>
        {/* Daireler Bölümü */}
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

        {/* Arsalar Bölümü */}
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
