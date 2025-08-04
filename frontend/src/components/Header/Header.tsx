import React, { useState } from 'react';
import styles from './Header.module.css';
import { FaWhatsapp, FaPhoneAlt, FaAngleDown } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import { useCurrency, type CurrencyCode } from '../../context/CurrencyContext';
import { motion, AnimatePresence } from 'framer-motion';
import HamburgerMenu from '../HamburgerMenu/HamburgerMenu'; // HamburgerMenu'yu import et

// Bayrak PNG'lerini import et
import trFlag from '../../assets/images/tr.png';
import gbFlag from '../../assets/images/gb.png';
import ruFlag from '../../assets/images/ru.png';
import deFlag from '../../assets/images/de.png';

// Logonuzu import edin (dosya adını kendi SVG logonuzla değiştirin)
import myLogo from '../../assets/images/taylan-homes-logo.svg'; // <-- SVG logonuzun yolu ve adı

interface HeaderProps {
  onNavLinkClick: (path: string) => void;
}

const Header: React.FC<HeaderProps> = ({ onNavLinkClick }) => {
  const { t, i18n } = useTranslation();
  const { selectedCurrency, setSelectedCurrency, getCurrencySymbol } = useCurrency();

  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    setShowLanguageDropdown(false);
  };

  const changeCurrency = (currency: CurrencyCode) => {
    setSelectedCurrency(currency);
    setShowCurrencyDropdown(false);
  };

  const languages = [
    { code: 'tr', name: 'Türkçe', flagSrc: trFlag },
    { code: 'en', name: 'English', flagSrc: gbFlag },
    { code: 'ru', name: 'Русский', flagSrc: ruFlag },
    { code: 'de', name: 'Deutsch', flagSrc: deFlag },
  ];

  const currencies: CurrencyCode[] = ['TRY', 'USD', 'EUR'];

  // Dropdown animasyon varyantları
const dropdownVariants = {
  hidden: { opacity: 0, y: -10, scaleY: 0, originY: 0 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scaleY: 1, 
    originY: 0, 
    transition: { duration: 0.2, ease: "easeOut" as const } 
  },
  exit: { 
    opacity: 0, 
    y: -10, 
    scaleY: 0, 
    originY: 0, 
    transition: { duration: 0.2, ease: "easeIn" as const } 
  }
};


  return (
    <header className={styles.header}>
      {/* Mobil Üst Bar: Dil ve Para Birimi Seçeneği */}
      <div className={styles.mobileTopBar}>
        {/* Dil Seçeneği */}
        <div 
          className={styles.languageSelectorMobile}
          onMouseEnter={() => setShowLanguageDropdown(true)}
          onMouseLeave={() => setShowLanguageDropdown(false)}
        >
          <span className={styles.currentLanguage}>
            <img
              src={languages.find(lang => lang.code === i18n.language)?.flagSrc}
              alt={i18n.language.toUpperCase()}
              className={styles.flagIcon}
            />
            <FaAngleDown className={styles.dropdownArrow} />
          </span>
          <AnimatePresence>
            {showLanguageDropdown && (
              <motion.div
                className={styles.languageDropdown}
                variants={dropdownVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                {languages.map((lang) => (
                  <div
                    key={lang.code}
                    className={styles.dropdownItem}
                    onClick={() => changeLanguage(lang.code)}
                  >
                    <img
                      src={lang.flagSrc}
                      alt={lang.name}
                      className={styles.flagIcon}
                    />
                    {lang.name}
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Para Birimi Seçeneği */}
        <div
          className={styles.currencySelectorMobile}
          onMouseEnter={() => setShowCurrencyDropdown(true)}
          onMouseLeave={() => setShowCurrencyDropdown(false)}
        >
          <span className={styles.currentCurrency}>
            {getCurrencySymbol(selectedCurrency)} {selectedCurrency} <FaAngleDown className={styles.dropdownArrow} />
          </span>
          <AnimatePresence>
            {showCurrencyDropdown && (
              <motion.div
                className={styles.currencyDropdown}
                variants={dropdownVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                {currencies.map((currency) => (
                  <div
                    key={currency}
                    className={styles.dropdownItem}
                    onClick={() => changeCurrency(currency)}
                  >
                    {getCurrencySymbol(currency)} {currency}
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className={styles.mainHeaderContent}>
        {/* Logo Alanı - Görsel tabanlı ve animasyonlu */}
        <div className={styles.logo}>
          <motion.a
            href="/"
            onClick={(e) => { e.preventDefault(); onNavLinkClick('/'); }}
            whileHover={{ scale: 1.05, rotate: 2 }} // Üzerine gelince büyür ve hafif döner
            whileTap={{ scale: 0.95 }} // Tıklayınca küçülür
            className={styles.logoLink} // Yeni stil sınıfı
          >
            <img src={myLogo} alt={t('taylan_homes')} className={styles.logoImage} /> {/* <-- Logonuz burada */}
          </motion.a>
        </div>

        {/* Masaüstü Navigasyon Menüsü */}
        <nav className={styles.nav}>
          <ul>
            <li><a href="/" className={styles.navLink} onClick={(e) => { e.preventDefault(); onNavLinkClick('/'); }}>{t('home')}</a></li>
            <li><a href="/ilanlar" className={styles.navLink} onClick={(e) => { e.preventDefault(); onNavLinkClick('/ilanlar'); }}>{t('for_sale')}</a></li>
            <li><a href="/hakkimizda" className={styles.navLink} onClick={(e) => { e.preventDefault(); onNavLinkClick('/hakkimizda'); }}>{t('about_us')}</a></li>
            <li><a href="/iletisim" className={styles.navLink} onClick={(e) => { e.preventDefault(); onNavLinkClick('/iletisim'); }}>{t('contact')}</a></li>
            {/* Admin paneli linki kaldırıldı */}
          </ul>
        </nav>

        {/* Masaüstü Sağ Üst İkonlar ve Dil/Para Birimi */}
        <div className={styles.rightIcons}>
          {/* Para Birimi Seçeneği */}
          <div
            className={styles.currencySelector}
            onMouseEnter={() => setShowCurrencyDropdown(true)}
            onMouseLeave={() => setShowCurrencyDropdown(false)}
          >
            <span className={styles.currentCurrency}>
              {getCurrencySymbol(selectedCurrency)} {selectedCurrency} <FaAngleDown className={styles.dropdownArrow} />
            </span>
            <AnimatePresence>
              {showCurrencyDropdown && (
                <motion.div
                  className={styles.currencyDropdown}
                  variants={dropdownVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  {currencies.map((currency) => (
                    <div
                      key={currency}
                      className={styles.dropdownItem}
                      onClick={() => changeCurrency(currency)}
                    >
                      {getCurrencySymbol(currency)} {currency}
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* WhatsApp İkonu - Direkt sohbet açar */}
          <a href="https://wa.me/905426715064?text=Merhaba,%20ilanlarınızla%20ilgili%20bilgi%20almak%20istiyorum." target="_blank" rel="noopener noreferrer" className={styles.contactIcon}>
            <FaWhatsapp />
          </a>

          {/* Telefon İkonu */}
          <a href="tel:+905426715064" className={styles.contactIcon}>
            <FaPhoneAlt />
          </a>

          {/* Dil Seçeneği - Masaüstü */}
          <div
            className={styles.languageSelectorDesktop}
            onMouseEnter={() => setShowLanguageDropdown(true)}
            onMouseLeave={() => setShowLanguageDropdown(false)}
          >
            <span className={styles.currentLanguage}>
              <img
                src={languages.find(lang => lang.code === i18n.language)?.flagSrc}
                alt={i18n.language.toUpperCase()}
                className={styles.flagIcon}
              />
              <FaAngleDown className={styles.dropdownArrow} />
            </span>

            <AnimatePresence>
              {showLanguageDropdown && (
                <motion.div
                  className={styles.languageDropdown}
                  variants={dropdownVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  {languages.map((lang) => (
                    <div
                      key={lang.code}
                      className={styles.dropdownItem}
                      onClick={() => changeLanguage(lang.code)}
                    >
                      <img
                        src={lang.flagSrc}
                        alt={lang.name}
                        className={styles.flagIcon}
                      />
                      {lang.name}
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          {/* Hamburger Menü (Mobil görünümde gösterilecek) */}
          <HamburgerMenu onNavLinkClick={onNavLinkClick} />
        </div>
      </div>
    </header>
  );
};

export default Header;
