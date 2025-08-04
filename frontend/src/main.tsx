    import React from 'react';
    import ReactDOM from 'react-dom/client';
    import App from './App';
    import './index.css'; // Global CSS'iniz
    import './i18n'; // <-- BU SATIR ÇOK ÖNEMLİ! i18n yapılandırmanızı import edin

    const root = ReactDOM.createRoot(
      document.getElementById('root') as HTMLElement
    );
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    