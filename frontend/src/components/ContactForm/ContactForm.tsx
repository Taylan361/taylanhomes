import React, { useState } from 'react';
import './ContactForm.css'; // Stil dosyamızı import ediyoruz
import { useTranslation } from 'react-i18next'; // Dil desteği için

const ContactForm: React.FC = () => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  // Formspree endpoint'iniz buraya yerleştirildi.
  // Kendi Formspree formunuzu oluşturduktan sonra alacaksınız.
  const FORMSPREE_ENDPOINT = 'https://formspree.io/f/xnnznzyz'; // <-- Formspree URL'iniz burada

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');

    try {
      const response = await fetch(FORMSPREE_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json', // Formspree için gerekli
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setStatus('success');
        setFormData({ name: '', email: '', phone: '', message: '' }); // Formu sıfırla
      } else {
        // Formspree'den gelen hata mesajını yakalamaya çalışın
        const errorData = await response.json();
        console.error('Formspree Hatası:', errorData);
        setStatus('error');
      }
    } catch (error) {
      console.error('Form gönderilirken bir ağ hatası oluştu:', error);
      setStatus('error');
    }
  };

  return (
    <div className="contact-form-container">
      <h2 className="contact-form-title">{t('contactFormTitle')}</h2>
      {status === 'success' && (
        <p className="success-message">{t('formSubmitSuccess')}</p>
      )}
      {status === 'error' && (
        <p className="error-message">{t('formSubmitError')}</p>
      )}
      <form className="contact-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">{t('yourName')}</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            aria-label={t('yourName')}
          />
        </div>

        <div className="form-group">
          <label htmlFor="email">{t('yourEmail')}</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            aria-label={t('yourEmail')}
          />
        </div>

        <div className="form-group">
          <label htmlFor="phone">{t('yourPhone')}</label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            aria-label={t('yourPhone')}
          />
        </div>

        <div className="form-group">
          <label htmlFor="message">{t('yourMessage')}</label>
          <textarea
            id="message"
            name="message"
            value={formData.message}
            onChange={handleChange}
            required
            rows={5}
            aria-label={t('yourMessage')}
          ></textarea>
        </div>

        <button type="submit" className="submit-button" disabled={status === 'submitting'}>
          {status === 'submitting' ? t('submitting') : t('submitForm')}
        </button>
      </form>
    </div>
  );
};

export default ContactForm;
