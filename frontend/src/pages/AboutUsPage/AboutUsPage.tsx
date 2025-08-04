// frontend/src/pages/AboutUsPage/AboutUsPage.tsx
import React from 'react';
import styles from './AboutUsPage.module.css';
import { useTranslation } from 'react-i18next';

const mockProjectImages = [
  'https://picsum.photos/id/200/800/600',
  'https://picsum.photos/id/201/800/600',
  'https://picsum.photos/id/202/800/600',
  'https://picsum.photos/id/203/800/600',
  'https://picsum.photos/id/204/800/600',
  'https://picsum.photos/id/205/800/600',
];

const AboutUsPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className={styles.aboutUsPage}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>{t('about_us_page_title')}</h1>
        <p className={styles.pageSubtitle}>{t('taylan_homes_since')}</p> {/* Yeni eklenen tagline */}
        <div className={styles.breadcrumbs}>
          <a href="/" onClick={(e) => { e.preventDefault(); window.history.pushState({}, '', '/'); window.dispatchEvent(new PopStateEvent('popstate')); }}>{t('home')}</a> / <span>{t('about_us_page_title')}</span>
        </div>
      </div>

      <div className={styles.aboutContentContainer}>
        {/* Vizyonumuz Bölümü */}
        <div className={styles.sectionBlock}>
          <h2 className={styles.sectionHeading}>{t('our_vision')}</h2>
          <p className={styles.sectionText}>
            {t('our_vision_text')}
          </p>
        </div>

        {/* Misyonumuz Bölümü */}
        <div className={styles.sectionBlock}>
          <h2 className={styles.sectionHeading}>{t('our_mission')}</h2>
          <p className={styles.sectionText}>
            {t('our_mission_text')}
          </p>
        </div>

        {/* Değerlerimiz Bölümü */}
        <div className={styles.sectionBlock}>
          <h2 className={styles.sectionHeading}>{t('our_values')}</h2>
          <div className={styles.valuesGrid}>
            <div className={styles.valueItem}>
              <h3>{t('value_honesty_title')}</h3>
              <p>{t('value_honesty_text')}</p>
            </div>
            <div className={styles.valueItem}>
              <h3>{t('value_reliability_title')}</h3>
              <p>{t('value_reliability_text')}</p>
            </div>
            <div className={styles.valueItem}>
              <h3>{t('value_customer_satisfaction_title')}</h3>
              <p>{t('value_customer_satisfaction_text')}</p>
            </div>
            <div className={styles.valueItem}>
              <h3>{t('value_quality_title')}</h3>
              <p>{t('value_quality_text')}</p>
            </div>
            <div className={styles.valueItem}>
              <h3>{t('value_innovation_title')}</h3>
              <p>{t('value_innovation_text')}</p>
            </div>
          </div>
        </div>

        {/* Geçmiş Projelerimiz Bölümü */}
        
      </div>
    </div>
  );
};

export default AboutUsPage;
