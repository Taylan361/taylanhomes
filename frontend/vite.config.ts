import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

// Bilgisayarınızın yerel IP adresini buraya yazın
const LOCAL_IP = '192.168.1.2'; // GÜNCELLENDİ: Sizin IP adresiniz

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Tüm ağ arayüzlerinden erişime izin ver
    port: 5173,
    proxy: {
      '/api': {
        target: `http://${LOCAL_IP}:5000`, // Backend sunucunuzun adresi
        changeOrigin: true,
        secure: false,
      },
      '/uploads': {
        target: `http://${LOCAL_IP}:5000`, // Backend'deki statik dosyalar için
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
