import React, { useState, useRef, useEffect } from 'react';
// FIX: Upgraded react-router-dom to v6. Replaced useHistory with useNavigate.
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { TonConnectButton } from '../hooks/useTonConnect';
import { useNotifications } from '../hooks/useNotifications';
import NotificationsDropdown from './NotificationsDropdown';
import CurrencySwitcher from './CurrencySwitcher';
import { useCart } from '../hooks/useCart';
import DynamicIcon from './DynamicIcon';
import LoginModal from './LoginModal';

const Header: React.FC = () => {
  const { user } = useAuth();
  // FIX: Upgraded react-router-dom to v6. Replaced useHistory with useNavigate.
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const { unreadCount, markAllAsRead } = useNotifications();
  const { itemCount } = useCart();
  const notificationsRef = useRef<HTMLDivElement>(null);


  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // FIX: Use navigate instead of history.push.
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const toggleNotifications = () => {
    if (!isNotificationsOpen && unreadCount > 0) {
      markAllAsRead();
    }
    setIsNotificationsOpen(!isNotificationsOpen);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      <header className="bg-base-200/80 backdrop-blur-lg sticky top-0 z-30 border-b border-base-300">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <Link to="/" className="text-2xl font-bold text-base-content">
                Crypto<span className="text-primary">Craft</span>
              </Link>
               {/* FIX: Use navigate(-1) instead of history.goBack(). */}
               <button onClick={() => navigate(-1)} className="hidden md:flex items-center justify-center text-base-content/60 hover:text-base-content p-2 rounded-full hover:bg-base-300" title="Назад">
                  <DynamicIcon name="back-arrow" className="h-5 w-5" />
              </button>
            </div>

            <div className="hidden md:block w-full max-w-md">
              <form onSubmit={handleSearchSubmit}>
                  <div className="relative">
                       <input
                          type="search"
                          placeholder="Поиск по товарам и мастерам..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full bg-base-100 border border-base-300 rounded-lg py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-base-content/50">
                         <DynamicIcon name="search" className="w-5 h-5" />
                      </div>
                  </div>
              </form>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-4">
               {/* Search Icon for Mobile */}
              <button onClick={() => navigate('/search')} className="md:hidden text-base-content/60 hover:text-base-content p-2" title="Поиск">
                  <DynamicIcon name="search" className="w-6 h-6" />
              </button>
              
              {user ? (
                <>
                  <div className="hidden md:flex items-center space-x-2 sm:space-x-4">
                      <div className="hidden lg:block">
                        <CurrencySwitcher />
                      </div>
          
                      <Link to="/create" className="inline-block bg-primary text-primary-content font-semibold text-center rounded-full px-4 py-1.5 text-sm hover:bg-primary-focus transition-colors">
                        Продать
                      </Link>
                      
                      <Link to="/community" className="text-base-content/60 hover:text-base-content p-2" title="Центр сообщества">
                          <DynamicIcon name="community" className="w-6 h-6" />
                      </Link>

                      <div className="relative" ref={notificationsRef}>
                         <button onClick={toggleNotifications} className="relative text-base-content/60 hover:text-base-content p-2">
                              <DynamicIcon name="bell" className="w-6 h-6" />
                              {unreadCount > 0 && <span className="absolute top-1 right-1 block h-3 w-3 rounded-full bg-red-500 border-2 border-base-200 animate-pulse"></span>}
                         </button>
                         {isNotificationsOpen && <NotificationsDropdown onClose={() => setIsNotificationsOpen(false)} />}
                      </div>
                       <Link to="/chat" className="text-base-content/60 hover:text-base-content p-2">
                          <DynamicIcon name="chat" className="w-6 h-6" />
                      </Link>
                  </div>
                  
                  <Link to="/cart" className="relative text-base-content/60 hover:text-base-content p-2">
                    <DynamicIcon name="cart" className="w-6 h-6" />
                    {itemCount > 0 && 
                      <span className="absolute top-0 right-0 block h-5 w-5 rounded-full bg-primary text-white text-xs flex items-center justify-center border-2 border-base-200">
                        {itemCount}
                      </span>
                    }
                  </Link>

                  <Link to="/dashboard" className="hidden md:flex items-center space-x-2">
                    <img src={user.avatarUrl} alt={user.name} className="w-8 h-8 rounded-full border-2 border-base-300" />
                  </Link>

                  <TonConnectButton />
                </>
              ) : (
                <button onClick={() => setIsLoginModalOpen(true)} className="btn btn-primary btn-sm md:btn-md">Войти</button>
              )}
            </div>
          </div>
        </div>
      </header>
      {isLoginModalOpen && <LoginModal onClose={() => setIsLoginModalOpen(false)} />}
    </>
  );
};

export default Header;