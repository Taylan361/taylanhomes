import React from 'react';
import ContactForm from '../../components/ContactForm/ContactForm'; // ContactForm'u import ediyoruz
import { useTranslation } from 'react-i18next';
import './ContactUsPage.css'; // İletişim sayfasının genel stilleri için

const ContactUsPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="contact-us-page">
      {/* "Taylan Homes Ana Sayfa" başlık kısmı kaldırıldı */}
      {/* <div className="page-header-banner">
        <h1 className="page-title">{t('contact')}</h1>
        <p className="page-subtitle">{t('contactPageSubtitle')}</p>
      </div> */}

      <div className="contact-content-wrapper" style={{ paddingTop: '80px', paddingBottom: '80px' }}> {/* Üst ve alt boşluk eklendi */}
        {/* İletişim Formu Bileşeni */}
        <ContactForm />

        {/* İletişim Bilgileri Bölümü */}
        <div className="contact-info-section">
          <h3 className="section-title">{t('ourContactInfo')}</h3>
          <div className="info-item">
            <span className="info-icon">📍</span>
            <p><strong>{t('address')}:</strong> Antalya, Alanya, Türkiye</p>
          </div>
          <div className="info-item">
            <span className="info-icon">📞</span>
            <p><strong>{t('phone')}:</strong> +90 542 671 50 64</p>
          </div>
          <div className="info-item">
            <span className="info-icon">📧</span>
            <p><strong>{t('email')}:</strong> empolijewellery@hotmail.com</p>
          </div>
          

          {/* Google Haritalar iframe'i kaldırıldı */}
          {/* <div className="map-container">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3191.03608146399!2d30.00000000000000!3d36.54321000000000!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x14c029b3a0b1d3d1%3A0x123456789abcdef!2sAlanya%2C%20Antalya%2C%20Turkey!5e0!3m2!1sen!2sus!4v1678901234567!5m2!1sen!2sus"
              width="100%"
              height="450"
              style={{ border: 0, borderRadius: '8px' }}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Google Haritalar - Alanya, Antalya"
            ></iframe>
          </div> */}
        </div>
      </div>
    </div>
  );
};

export default ContactUsPage;
