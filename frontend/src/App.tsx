import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import Header from './components/Header/Header';
import Footer from './components/Footer/Footer';
import { CurrencyProvider } from './context/CurrencyContext';
import ForSalePage from './pages/ForSalePage/ForSalePage';
import PropertyDetailPage from './pages/PropertyDetailPage/PropertyDetailPage';
import AboutUsPage from './pages/AboutUsPage/AboutUsPage';
import ContactUsPage from './pages/ContactUsPage/ContactUsPage';
import AdminPanelPage from './pages/AdminPanelPage/AdminPanelPage';
import NotFoundPage from './pages/NotFoundPage/NotFoundPage';
import HomePage from './pages/HomePage/HomePage';
import FloatingVideoPlayer from './components/FloatingVideoPlayer/FloatingVideoPlayer';
import './index.css';

// Ana uygulama içeriğini barındıran bileşen
function AppContent() {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(window.location.pathname);

  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPage(window.location.pathname);
    };
    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  const handleNavLinkClick = (path: string) => {
    navigate(path);
  };

  const shouldShowFloatingVideoPlayer =
    !currentPage.startsWith('/ilanlar/') && !currentPage.startsWith('/admin-panel');
  const shouldShowHeaderFooter = !currentPage.startsWith('/admin-panel');

  return (
    <div className="App">
      {shouldShowHeaderFooter && <Header onNavLinkClick={handleNavLinkClick} />}

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/ilanlar" element={<ForSalePage />} />
        <Route path="/ilanlar/:id" element={<PropertyDetailPage />} />
        <Route path="/hakkimizda" element={<AboutUsPage />} />
        <Route path="/iletisim" element={<ContactUsPage />} />
        <Route path="/admin-panel" element={<AdminPanelPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>

      {shouldShowHeaderFooter && <Footer />}
      {shouldShowFloatingVideoPlayer && <FloatingVideoPlayer />}
    </div>
  );
}

// Ana App bileşeni
function App() {
  return (
    <CurrencyProvider>
      <Router>
        <AppContent />
      </Router>
    </CurrencyProvider>
  );
}

export default App;
