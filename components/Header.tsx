import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { TonConnectButton } from '../hooks/useTonConnect';
import { useNotifications } from '../hooks/useNotifications';
import NotificationsDropdown from './NotificationsDropdown';
import CurrencySwitcher from './CurrencySwitcher';
import { useCart } from '../hooks/useCart';

const Header: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const { unreadCount, markAllAsRead } = useNotifications();
  const { itemCount } = useCart();
  const notificationsRef = useRef<HTMLDivElement>(null);


  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
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
    <header className="bg-brand-surface/80 backdrop-blur-lg sticky top-0 z-40 border-b border-brand-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="text-2xl font-bold text-white">
            Crypto<span className="text-brand-primary">Craft</span>
          </Link>

          <div className="hidden md:block w-full max-w-md">
            <form onSubmit={handleSearchSubmit}>
                <div className="relative">
                     <input
                        type="search"
                        placeholder="Поиск по товарам и мастерам..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-brand-background border border-brand-border rounded-lg py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                       <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-brand-text-secondary">
                          <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
                        </svg>
                    </div>
                </div>
            </form>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-4">
            <div className="hidden lg:block">
              <CurrencySwitcher />
            </div>

            <Link to="/create" className="hidden sm:block text-sm bg-brand-secondary hover:bg-brand-primary-hover text-white font-semibold py-2 px-4 rounded-lg transition-colors">
              Продать
            </Link>
            
            <Link to="/community" className="text-brand-text-secondary hover:text-white p-2" title="Центр сообщества">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                  <path d="M4.5 6.375a4.125 4.125 0 118.25 0 4.125 4.125 0 01-8.25 0zM14.25 8.625a3.375 3.375 0 116.75 0 3.375 3.375 0 01-6.75 0zM1.5 19.125a7.125 7.125 0 0114.25 0v.003l-.001.119a.75.75 0 01-.363.63l-2.693 1.57a.75.75 0 01-.67-.015l-1.12-1.12a.75.75 0 00-.869-.086l-1.12 1.12a.75.75 0 01-.67.015l-2.693-1.57a.75.75 0 01-.363-.63l-.001-.12v-.003zM12 19.125a7.125 7.125 0 0114.25 0v.003l-.001.119a.75.75 0 01-.363.63l-2.693 1.57a.75.75 0 01-.67-.015l-1.12-1.12a.75.75 0 00-.869-.086l-1.12 1.12a.75.75 0 01-.67.015l-2.693-1.57a.75.75 0 01-.363-.63l-.001-.12v-.003z" />
                </svg>
            </Link>

            <div className="relative" ref={notificationsRef}>
               <button onClick={toggleNotifications} className="relative text-brand-text-secondary hover:text-white p-2">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                    </svg>
                    {unreadCount > 0 && <span className="absolute top-1 right-1 block h-3 w-3 rounded-full bg-red-500 border-2 border-brand-surface animate-pulse"></span>}
               </button>
               {isNotificationsOpen && <NotificationsDropdown onClose={() => setIsNotificationsOpen(false)} />}
            </div>

            <Link to="/chat" className="text-brand-text-secondary hover:text-white p-2">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            </Link>
            
            <Link to="/cart" className="relative text-brand-text-secondary hover:text-white p-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c.51 0 .962-.328 1.093-.828l2.842-7.094a.75.75 0 00-.143-.882zM7.5 14.25L5.106 5.165A.75.75 0 004.269 4.5H2.25" />
              </svg>
              {itemCount > 0 && 
                <span className="absolute top-0 right-0 block h-5 w-5 rounded-full bg-brand-primary text-white text-xs flex items-center justify-center border-2 border-brand-surface">
                  {itemCount}
                </span>
              }
            </Link>

            <Link to="/profile" className="flex items-center space-x-2 text-white">
              <img src={user.avatarUrl} alt={user.name} className="w-8 h-8 rounded-full border-2 border-brand-border" />
            </Link>

            <div className="hidden sm:block">
                <TonConnectButton />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;