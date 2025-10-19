import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useCart } from '../hooks/useCart';
import { useNotifications } from '../hooks/useNotifications';
import DynamicIcon from './DynamicIcon';
import NotificationsDropdown from './NotificationsDropdown';
import LoginModal from './LoginModal';

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const { itemCount } = useCart();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
            setIsNotificationsOpen(false);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
        document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const authSection = user ? (
    <>
      <Link to="/chat" className="btn btn-ghost btn-circle" title="Чаты">
          <DynamicIcon name="chat" className="h-6 w-6" />
      </Link>
      <Link to="/cart" className="btn btn-ghost btn-circle" title="Корзина">
          <div className="indicator">
              <DynamicIcon name="cart" className="h-6 w-6" />
              {itemCount > 0 && <span className="badge badge-sm badge-primary indicator-item">{itemCount}</span>}
          </div>
      </Link>
      <div className="relative" ref={notificationsRef}>
          <button onClick={() => setIsNotificationsOpen(p => !p)} className="btn btn-ghost btn-circle" title="Уведомления">
              <div className="indicator">
                  <DynamicIcon name="bell" className="h-6 w-6" />
                  {unreadCount > 0 && <span className="badge badge-xs badge-primary indicator-item"></span>}
              </div>
          </button>
          {isNotificationsOpen && <NotificationsDropdown onClose={() => setIsNotificationsOpen(false)} />}
      </div>
      <div className="dropdown dropdown-end">
          <label tabIndex={0} className="btn btn-ghost btn-circle avatar">
              <div className="w-9 rounded-full ring-1 ring-amber-300">
                  <img src={user.avatarUrl} alt={user.name} />
              </div>
          </label>
          <ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 z-[51] p-2 shadow bg-base-100 rounded-box w-52 border border-amber-200/80">
              <li><Link to="/dashboard">Личный кабинет</Link></li>
              <li><Link to="/dashboard?tab=settings">Настройки</Link></li>
              <li><button onClick={logout}>Выйти</button></li>
          </ul>
      </div>
    </>
  ) : (
    <button onClick={() => setIsLoginModalOpen(true)} className="nav-link-login">
        Вход
    </button>
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
            {authSection}
             <Link to={user ? "/create" : "#"} onClick={!user ? (e) => { e.preventDefault(); setIsLoginModalOpen(true); } : undefined} className="gjs-t-button cta-create-listing btn btn-primary">
                Создать объявление
            </Link>
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