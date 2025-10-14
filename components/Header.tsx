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
      <Link to="/dashboard" className="text-sm font-medium text-base-content/80 hover:text-base-content">
        Профиль
      </Link>
      <Link to="/create" className="btn btn-primary btn-sm shadow-sm transition-transform hover:brightness-95">
        Создать объявление
      </Link>
    </>
  ) : (
    <>
      <button onClick={() => setIsLoginModalOpen(true)} className="text-sm font-medium text-base-content/80 hover:text-base-content">
        Вход
      </button>
      <button onClick={() => setIsLoginModalOpen(true)} className="btn btn-primary btn-sm shadow-sm transition-transform hover:brightness-95">
        Создать объявление
      </button>
    </>
  );

  return (
    <>
      <header className="w-full border-b border-amber-100/60 bg-white/90 backdrop-blur-sm sticky top-0 z-40">
        <div className="mx-auto px-6 py-4 flex items-center justify-between gap-6">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-300 flex items-center justify-center">
              <img loading="lazy" decoding="async" alt="Логотип" src="https://api.iconify.design/lucide-sparkles.svg" className="w-5 h-5" />
            </div>
            <span className="font-manrope font-semibold text-lg tracking-tight">SandBoard</span>
          </Link>
          
          <div className="flex-1 max-w-lg hidden lg:block">
            <form onSubmit={handleSearchSubmit} className="w-full">
              <div className="w-full flex items-center gap-3 bg-amber-50/80 border border-amber-200/80 rounded-xl px-4 py-2">
                  <img loading="lazy" decoding="async" alt="Поиск" src="https://api.iconify.design/lucide-search.svg" className="w-5 h-5 opacity-70" />
                  <input 
                    type="search" 
                    placeholder="Поиск по объявлениям..." 
                    className="w-full bg-transparent outline-none placeholder:opacity-60"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
              </div>
            </form>
          </div>

          <nav className="hidden md:flex items-center gap-4">
            <Link to="/products" className="text-sm font-medium">Категории</Link>
            <Link to="/products" className="text-sm font-medium">VIP</Link>
            <Link to="/products" className="text-sm font-medium">Объявления</Link>
            {authLinks}
          </nav>
          
           {/* Mobile menu could be added here if needed */}
        </div>
        
        {/* Mobile Search Bar */}
        <div className="lg:hidden border-t border-amber-200 bg-white px-6 py-3">
          <form onSubmit={handleSearchSubmit} className="w-full">
            <div className="w-full flex items-center gap-3 bg-amber-50/80 border border-amber-200/80 rounded-xl px-4 py-2">
              <img loading="lazy" decoding="async" alt="Поиск" src="https://api.iconify.design/lucide-search.svg" className="w-5 h-5 opacity-70" />
              <input 
                type="search" 
                placeholder="Поиск по объявлениям..." 
                className="w-full bg-transparent outline-none placeholder:opacity-60"
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