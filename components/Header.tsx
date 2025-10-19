import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import LoginModal from './LoginModal';

const Header: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const authLinks = user ? (
    <>
      <Link to="/dashboard" className="nav-link-login">
        Профиль
      </Link>
      <Link to="/create" className="gjs-t-button cta-create-listing btn btn-primary">
        Создать объявление
      </Link>
    </>
  ) : (
    <>
      <button onClick={() => setIsLoginModalOpen(true)} className="nav-link-login">
        Вход
      </button>
      <button onClick={() => setIsLoginModalOpen(true)} className="gjs-t-button cta-create-listing btn btn-primary">
        Создать объявление
      </button>
    </>
  );

  return (
    <>
      <header className="header-primary sticky top-0 z-40">
        <div className="header-container">
          <Link to="/" className="gjs-t-link brand-link">
            <div className="brand-mark">
              <img loading="lazy" decoding="async" alt="Логотип" src="https://api.iconify.design/lucide-sparkles.svg" className="brand-icon" />
            </div>
            <span className="brand-name">SandBoard</span>
          </Link>
          
          <form method="get" onSubmit={handleSearchSubmit} className="header-search-form">
            <div className="search-field-wrapper">
              <img loading="lazy" decoding="async" alt="Поиск" src="https://api.iconify.design/lucide-search.svg" className="search-icon" />
              <input 
                type="search" 
                placeholder="Поиск по объявлениям..." 
                className="search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </form>

          <nav className="header-navigation">
            <Link to="/products" className="gjs-t-link nav-link-categories">Категории</Link>
            <Link to="/products" className="gjs-t-link nav-link-vip">VIP</Link>
            <Link to="/products" className="gjs-t-link nav-link-main">Объявления</Link>
            {authLinks}
          </nav>
        </div>
        <div className="header-search-mobile">
          <form method="get" onSubmit={handleSearchSubmit} className="header-search-form-mobile">
            <div className="search-field-wrapper-mobile">
              <img loading="lazy" decoding="async" alt="Поиск" src="https://api.iconify.design/lucide-search.svg" className="search-icon-mobile" />
              <input 
                type="search" 
                placeholder="Поиск по объявлениям..." 
                className="search-input-mobile"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </form>
        </div>
      </header>
      {isLoginModalOpen && <LoginModal onClose={() => setIsLoginModalOpen(false)} />}
    </>
  );
};

export default Header;