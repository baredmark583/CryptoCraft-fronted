import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import type { Product } from '../types';

import Spinner from '../components/Spinner';
import ListingsTab from '../components/ListingsTab';
import SalesTab from '../components/SalesTab';
import AnalyticsDashboard from '../components/AnalyticsDashboard';
import WalletTab from '../components/WalletTab';
import SettingsTab from '../components/SettingsTab';
import DashboardTab from '../components/DashboardTab';
import { apiService } from '../services/apiService';

export type DashboardTabType =
  | 'summary'
  | 'products'
  | 'workshop'
  | 'favorites'
  | 'collections'
  | 'purchases'
  | 'sales'
  | 'analytics'
  | 'wallet'
  | 'settings'
  | 'platform'
  | 'dao'
  | 'live';

const DashboardPage: React.FC = () => {
  const { user, logout } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [userProducts, setUserProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hintText, setHintText] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const activeTabParam = searchParams.get('tab') as DashboardTabType;
  const [activeTab, setActiveTab] = useState<DashboardTabType>(activeTabParam || 'summary');

  useEffect(() => {
    if (activeTabParam && activeTabParam !== activeTab) {
      setActiveTab(activeTabParam);
    }
  }, [activeTabParam]);

  const showHint = useCallback((text: string) => setHintText(text), []);

  const handleSetTab = (tab: DashboardTabType) => {
    const primaryTabs = ['summary', 'products', 'sales', 'analytics', 'wallet', 'settings'];
    if (primaryTabs.includes(tab)) {
      setActiveTab(tab);
      setSearchParams({ tab });
      setIsSidebarOpen(false);
    } else {
      const tabLabels: Record<string, string> = {
        workshop: 'Мастерская',
        favorites: 'Избранное',
        collections: 'Коллекции',
        purchases: 'Мои покупки',
        platform: 'Платформа',
        dao: 'Управление DAO',
        live: 'Прямой эфир',
      };
      showHint(`${tabLabels[tab] || tab} скоро будет доступно`);
    }
  };

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (hintText) {
      timer = setTimeout(() => setHintText(''), 1500);
    }
    return () => clearTimeout(timer);
  }, [hintText]);

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const products = await apiService.getProductsBySellerId(user.id);
        setUserProducts(products);
      } catch (error) {
        console.error('Failed to fetch user products:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfileData();
  }, [user]);

  const handleProductUpdate = (updatedProduct: Product) => {
    setUserProducts((prev) => prev.map((p) => (p.id === updatedProduct.id ? updatedProduct : p)));
  };

  if (!user) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  const sidebarTabs: { id: DashboardTabType; label: string; icon: string }[] = [
    { id: 'summary', label: 'Сводка', icon: 'https://api.iconify.design/lucide-layout-dashboard.svg' },
    { id: 'products', label: 'Товары', icon: 'https://api.iconify.design/lucide-box.svg' },
    { id: 'workshop', label: 'Мастерская', icon: 'https://api.iconify.design/lucide-hammer.svg' },
    { id: 'favorites', label: 'Избранное', icon: 'https://api.iconify.design/lucide-heart.svg' },
    { id: 'collections', label: 'Коллекции', icon: 'https://api.iconify.design/lucide-folders.svg' },
    { id: 'purchases', label: 'Мои покупки', icon: 'https://api.iconify.design/lucide-shopping-bag.svg' },
    { id: 'sales', label: 'Мои продажи', icon: 'https://api.iconify.design/lucide-receipt-russian-ruble.svg' },
    { id: 'analytics', label: 'Аналитика', icon: 'https://api.iconify.design/lucide-chart-line.svg' },
    { id: 'wallet', label: 'Кошелек', icon: 'https://api.iconify.design/lucide-wallet.svg' },
    { id: 'settings', label: 'Настройки', icon: 'https://api.iconify.design/lucide-settings.svg' },
    { id: 'platform', label: 'Платформа', icon: 'https://api.iconify.design/lucide-layers.svg' },
    { id: 'dao', label: 'Управление DAO', icon: 'https://api.iconify.design/lucide-organization.svg' },
    { id: 'live', label: 'Прямой эфир', icon: 'https://api.iconify.design/lucide-radio.svg' },
  ];

  const topBarTabs: { id: DashboardTabType; label: string; icon: string }[] = [
    { id: 'summary', label: 'Сводка', icon: 'https://api.iconify.design/lucide-activity.svg' },
    { id: 'products', label: 'Товары', icon: 'https://api.iconify.design/lucide-box.svg' },
    { id: 'sales', label: 'Мои продажи', icon: 'https://api.iconify.design/lucide-receipt-russian-ruble.svg' },
    { id: 'analytics', label: 'Аналитика', icon: 'https://api.iconify.design/lucide-chart-line.svg' },
    { id: 'wallet', label: 'Кошелек', icon: 'https://api.iconify.design/lucide-wallet.svg' },
    { id: 'settings', label: 'Настройки', icon: 'https://api.iconify.design/lucide-settings.svg' },
  ];

  const renderTabContent = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center h-full">
          <Spinner size="lg" />
        </div>
      );
    }
    switch (activeTab) {
      case 'summary':
        return <DashboardTab />;
      case 'products':
        return <ListingsTab products={userProducts} isOwnProfile={true} onProductUpdate={handleProductUpdate} />;
      case 'sales':
        return <SalesTab />;
      case 'analytics':
        return <AnalyticsDashboard sellerId={user.id} />;
      case 'wallet':
        return <WalletTab user={user} />;
      case 'settings':
        return <SettingsTab user={user} />;
      default:
        return null;
    }
  };

  return (
    <section className="w-full h-full">
      {hintText && (
        <div
          style={{
            position: 'fixed',
            left: '50%',
            bottom: 22,
            transform: 'translateX(-50%)',
            padding: '10px 14px',
            borderRadius: 12,
            border: '1px solid rgb(254, 243, 199)',
            background: 'rgb(255, 251, 235)',
            color: 'rgba(120, 53, 15, 0.95)',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            zIndex: 60,
            opacity: 1,
            transition: 'opacity 300ms',
          }}
        >
          {hintText}
        </div>
      )}
      <div className="mx-auto p-1 lg:p-4 h-full">
        <div className="grid lg:grid-cols-[300px_1fr] grid-cols-1 bg-white border border-amber-200/80 rounded-2xl overflow-hidden h-full relative">
          <aside
            aria-label="Меню личного кабинета"
            className={`p-5 flex flex-col gap-3 bg-white overflow-hidden fixed lg:relative inset-y-0 left-0 z-50 w-4/5 max-w-sm lg:w-full lg:max-w-none transition-transform duration-300 ease-in-out lg:translate-x-0 lg:border-r lg:border-amber-200/80 shadow-2xl lg:shadow-none ${
              isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
          >
            <div className="flex items-center gap-3 p-3 rounded-xl border border-amber-200/80 bg-white">
              <img
                alt={`Аватар: ${user.name}`}
                src={user.avatarUrl}
                className="w-11 h-11 rounded-xl border border-amber-100 object-cover bg-white shrink-0"
              />
              <div className="flex flex-col min-w-0">
                <strong className="font-bold text-amber-900 truncate font-manrope">{user.name}</strong>
                <span className="text-sm text-amber-800/70">Продавец</span>
              </div>
            </div>
            <nav role="tablist" aria-label="Разделы" className="mt-1 flex flex-col gap-1 overflow-y-auto flex-grow">
              {sidebarTabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  className={`grid grid-cols-[22px_1fr_auto] items-center gap-2 p-2 rounded-lg border text-left font-semibold w-full transition-colors ${
                    activeTab === tab.id
                      ? 'border-amber-500 bg-amber-950/5 text-amber-900'
                      : 'border-transparent text-amber-950/90 hover:bg-amber-50 hover:border-amber-100'
                  }`}
                  aria-selected={activeTab === tab.id}
                  onClick={() => handleSetTab(tab.id)}
                >
                  <img src={tab.icon} alt="" className="w-[18px] h-[18px] opacity-90" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
            <div className="mt-auto pt-2">
              <button
                type="button"
                aria-label="Выйти из аккаунта"
                className="inline-flex items-center gap-2 justify-center p-2.5 font-bold text-white bg-red-500 rounded-xl w-full hover:brightness-95 transition-all"
                onClick={logout}
              >
                <img src="https://api.iconify.design/lucide-log-out.svg" alt="Выйти" className="w-[18px] h-[18px]" />
                <span>Выйти</span>
              </button>
            </div>
          </aside>
          <main aria-label="Рабочая область" className="p-1 sm:p-5 flex flex-col bg-white overflow-hidden">
            <div
              aria-hidden={!isSidebarOpen}
              className={`fixed inset-0 bg-stone-900/40 z-40 lg:hidden ${isSidebarOpen ? 'block' : 'hidden'}`}
              onClick={() => setIsSidebarOpen(false)}
            />
            <header className="flex items-center justify-between gap-3 p-2.5 px-3 border border-amber-200/80 rounded-xl bg-white shadow-sm">
              <button
                type="button"
                aria-label="Открыть меню"
                className="lg:hidden inline-flex items-center gap-2 p-2 rounded-lg border border-amber-300 bg-white text-amber-900/90 hover:bg-amber-50 transition-colors"
                onClick={() => setIsSidebarOpen(true)}
              >
                <img src="https://api.iconify.design/lucide-menu.svg" alt="Меню" className="w-[18px] h-[18px]" />
              </button>
              <div className="flex items-center gap-2 min-w-0">
                <img src="https://api.iconify.design/lucide-sparkles.svg" alt="SandBoard" width={18} height={18} />
                <strong className="font-extrabold text-amber-900 font-manrope text-xl truncate">Личный кабинет</strong>
              </div>
              <form method="get" action="#search" role="search" className="hidden lg:block">
                <div className="flex items-center gap-2 bg-amber-50/80 border border-amber-200/80 rounded-xl px-4 py-2">
                  <img src="https://api.iconify.design/lucide-search.svg" alt="Поиск" className="w-5 h-5 opacity-70" />
                  <input
                    type="search"
                    placeholder="Поиск по объявлениям..."
                    aria-label="Поиск по объявлениям"
                    className="w-full bg-transparent outline-none placeholder:opacity-60 text-base-content"
                  />
                </div>
              </form>
            </header>
            <div role="tablist" aria-label="Вкладки" className="mt-3 grid gap-2 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
              {topBarTabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  className={`inline-flex items-center gap-2 justify-center p-2 rounded-lg border text-sm font-semibold transition-colors cursor-pointer w-full ${
                    activeTab === tab.id
                      ? 'bg-amber-50 border-amber-500 text-amber-900'
                      : 'border-amber-300 bg-white text-amber-950 hover:bg-amber-50'
                  }`}
                  onClick={() => handleSetTab(tab.id)}
                >
                  <img src={tab.icon} alt="" className="w-[18px] h-[18px]" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
            </div>
            <section className="mt-3 flex-grow overflow-y-auto pr-2">{renderTabContent()}</section>
          </main>
        </div>
      </div>
    </section>
  );
};

export default DashboardPage;