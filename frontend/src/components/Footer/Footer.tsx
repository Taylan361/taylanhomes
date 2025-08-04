// frontend/src/components/Footer/Footer.tsx
import React from 'react';
import styles from './Footer.module.css';
import { useTranslation } from 'react-i18next';
import { FaInstagram, FaFacebookF, FaEnvelope, FaPhoneAlt, FaMapMarkerAlt } from 'react-icons/fa';

const Footer: React.FC = () => {
  const { t } = useTranslation();

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.footerContent}>
          {/* Logo/Şirket Adı */}
          <div className={styles.footerSection}>
            <h3 className={styles.footerLogo}>{t('taylan_homes')}</h3>
            <p className={styles.footerDescription}>
              {/* Buraya şirketinizin kısa bir tanıtımını ekleyebilirsiniz */}
              Hayallerinizdeki evi bulmanız için size özel çözümler sunuyoruz.
            </p>
          </div>

          {/* Hızlı Linkler (isteğe bağlı) */}
          <div className={styles.footerSection}>
            <h4 className={styles.sectionTitle}>Hızlı Linkler</h4>
            <ul>
              <li><a href="/" className={styles.footerLink}>{t('home')}</a></li>
              <li><a href="/ilanlar" className={styles.footerLink}>{t('for_sale')}</a></li>
              <li><a href="/hakkimizda" className={styles.footerLink}>{t('about_us')}</a></li>
              <li><a href="/iletisim" className={styles.footerLink}>{t('contact')}</a></li>
            </ul>
          </div>

          {/* İletişim Bilgileri */}
          <div className={styles.footerSection}>
            <h4 className={styles.sectionTitle}>İletişim</h4>
            <p className={styles.contactInfo}>
              <FaPhoneAlt className={styles.contactIcon} /> +90 542 671 50 64
            </p>
            <p className={styles.contactInfo}>
              <FaEnvelope className={styles.contactIcon} /> empolijewellery@hotmail.com
            </p>
            <p className={styles.contactInfo}>
              <FaMapMarkerAlt className={styles.contactIcon} /> Antalya - Alanya 
            </p>
          </div>

          {/* Sosyal Medya */}
          <div className={styles.footerSection}>
            <h4 className={styles.sectionTitle}>Bizi Takip Edin</h4>
            <div className={styles.socialIcons}>
              <a href="https://www.instagram.com/taylanhomes/" target="_blank" rel="noopener noreferrer" className={styles.socialIcon}>
                <FaInstagram />
              </a>
              <a href="https://www.facebook.com/profile.php?id=100051155142517" target="_blank" rel="noopener noreferrer" className={styles.socialIcon}>
                <FaFacebookF />
              </a>
              {/* Diğer sosyal medya linkleri eklenebilir */}
            </div>
          </div>
        </div>

        <div className={styles.copyright}>
          <p>&copy; {new Date().getFullYear()} {t('taylan_homes')}. {t('all_rights_reserved')}</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
