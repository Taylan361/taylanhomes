import React from 'react';
import { useTranslation } from 'react-i18next';
import styles from './NotFoundPage.module.css'; // Stil dosyasını import ediyoruz

const NotFoundPage: React.FC = () => {
  const { t } = useTranslation();

  // Ana sayfaya dönme işlevi
  const handleGoHome = () => {
    window.history.pushState({}, '', '/');
    window.dispatchEvent(new PopStateEvent('popstate')); // App.tsx'teki route'u tetikle
  };

  return (
    <div className={styles.notFoundContainer}>
      <h1 className={styles.title}>404</h1>
      <h2 className={styles.subtitle}>{t('pageNotFound')}</h2> {/* Çeviri anahtarı */}
      <p className={styles.message}>
        {t('pageNotFoundMessage')} {/* Çeviri anahtarı */}
      </p>
      <button
        onClick={handleGoHome}
        className={styles.homeButton}
      >
        {t('goHome')} {/* Çeviri anahtarı */}
      </button>
    </div>
  );
};

export default NotFoundPage;
