// frontend/src/context/CurrencyContext.tsx
import React, { createContext, useState, useContext } from 'react';
import type { ReactNode } from 'react';


// Para birimi tiplerini tanımlıyoruz
export type CurrencyCode = 'TRY' | 'USD' | 'EUR';

// Context'in sağlayacağı değerlerin arayüzü
interface CurrencyContextType {
  selectedCurrency: CurrencyCode;
  setSelectedCurrency: (currency: CurrencyCode) => void;
  // Fiyatı doğrudan seçilen para birimine göre döndüren fonksiyon
  getPriceForCurrency: (prices: { TRY?: number; USD?: number; EUR?: number }) => number | undefined;
  getCurrencySymbol: (currencyCode: CurrencyCode) => string;
}

// Context'i oluştur
const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

// Para Birimi Sembolleri
const currencySymbols: { [key in CurrencyCode]: string } = {
  'TRY': '₺',
  'USD': '$',
  'EUR': '€'
};

interface CurrencyProviderProps {
  children: ReactNode;
}

export const CurrencyProvider: React.FC<CurrencyProviderProps> = ({ children }) => {
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyCode>('TRY'); // Varsayılan TL

  // İlan fiyatlarını doğrudan seçilen para birimine göre döndüren fonksiyon
  const getPriceForCurrency = (prices: { TRY?: number; USD?: number; EUR?: number }): number | undefined => {
    switch (selectedCurrency) {
      case 'TRY':
        return prices.TRY;
      case 'USD':
        return prices.USD;
      case 'EUR':
        return prices.EUR;
      default:
        return undefined; // Desteklenmeyen para birimi
    }
  };

  // Para birimi sembolünü getirme fonksiyonu
  const getCurrencySymbol = (currencyCode: CurrencyCode): string => {
    return currencySymbols[currencyCode];
  };

  return (
    <CurrencyContext.Provider value={{ selectedCurrency, setSelectedCurrency, getPriceForCurrency, getCurrencySymbol }}>
      {children}
    </CurrencyContext.Provider>
  );
};

// Context'i kullanmak için custom hook
export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};
