import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaWhatsapp, FaPhoneAlt, FaFacebookF, FaInstagram } from 'react-icons/fa'; // Yeni ikonlar eklendi
import styles from './HamburgerMenu.module.css';
import myLogo from '../../assets/images/taylan-homes-logo.svg'; // Logonuzu import edin

interface HamburgerMenuProps {
  onNavLinkClick: (path: string) => void;
}

const HamburgerMenu: React.FC<HamburgerMenuProps> = ({ onNavLinkClick }) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const handleLinkClick = (path: string) => {
    onNavLinkClick(path);
    setIsOpen(false); // Menüyü kapat
  };

  return (
    <div className={styles.hamburgerContainer}>
      {/* Hamburger İkonu */}
      <button 
        className={`${styles.hamburgerIcon} ${isOpen ? styles.open : ''}`} 
        onClick={toggleMenu}
        aria-label={t('toggle_menu')}
      >
        <span className={styles.iconLine}></span>
        <span className={styles.iconLine}></span>
        <span className={styles.iconLine}></span>
      </button>

      {/* Mobil Menü Overlay */}
      <nav className={`${styles.mobileMenu} ${isOpen ? styles.menuOpen : ''}`}>
        <div className={styles.menuHeader}>
          {/* Admin Panel Linki ve Logo - Admin panel linki kaldırıldı */}
          <img src={myLogo} alt={t('taylan_homes')} className={styles.adminLogoImage} />
        </div>
        <ul className={styles.menuList}>
          <li><a href="/" onClick={() => handleLinkClick('/')}>{t('home')}</a></li>
          <li><a href="/ilanlar" onClick={() => handleLinkClick('/ilanlar')}>{t('for_sale')}</a></li>
          <li><a href="/hakkimizda" onClick={() => handleLinkClick('/hakkimizda')}>{t('about_us')}</a></li>
          <li><a href="/iletisim" onClick={() => handleLinkClick('/iletisim')}>{t('contact')}</a></li>
          {/* Admin panel linki tamamen kaldırıldı */}
        </ul>

        <div className={styles.menuFooter}>
          {/* İletişim İkonları */}
          <div className={styles.contactIcons}>
            <a href="https://wa.me/905426715064?text=Merhaba,%20ilanlarınızla%20ilgili%20bilgi%20almak%20istiyorum." target="_blank" rel="noopener noreferrer" className={styles.contactIcon}>
              <FaWhatsapp />
            </a>
            <a href="tel:+905426715064" className={styles.contactIcon}>
              <FaPhoneAlt />
            </a>
          </div>
          {/* Sosyal Medya İkonları */}
          <div className={styles.socialIcons}>
            <a href="https://www.facebook.com/taylanhomes" target="_blank" rel="noopener noreferrer" className={styles.socialIcon}>
              <FaFacebookF />
            </a>
            <a href="https://www.instagram.com/taylanhomes" target="_blank" rel="noopener noreferrer" className={styles.socialIcon}>
              <FaInstagram />
            </a>
          </div>
        </div>
      </nav>

      {/* Menü açıkken arka planı karartan overlay */}
      {isOpen && <div className={styles.overlay} onClick={toggleMenu}></div>}
    </div>
  );
};

export default HamburgerMenu;
