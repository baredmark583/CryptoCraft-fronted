import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { apiService } from '../services/apiService';
import type { Product } from '../types';

import Spinner from '../components/Spinner';
import DashboardTab from '../components/DashboardTab';
import ListingsTab from '../components/ListingsTab';
import WorkshopTab from '../components/WorkshopTab';
import WishlistTab from '../components/WishlistTab';
import CollectionsTab from '../components/CollectionsTab';
import PurchasesTab from '../components/PurchasesTab';
import SalesTab from '../components/SalesTab';
import AnalyticsDashboard from '../components/AnalyticsDashboard';
import WalletTab from '../components/WalletTab';
import SettingsTab from '../components/SettingsTab';
import './DashboardPage.css'; // Import new styles

export type DashboardTabType = 'dashboard' | 'listings' | 'workshop' | 'wishlist' | 'collections' | 'purchases' | 'sales' | 'analytics' | 'wallet' | 'settings';

// Copied from old DashboardSidebar for use within this component
const TABS: { id: DashboardTabType; label: string; iconUrl: string; }[] = [
    { id: 'dashboard', label: 'Сводка', iconUrl: 'https://api.iconify.design/lucide-layout-dashboard.svg' },
    { id: 'listings', label: 'Товары', iconUrl: 'https://api.iconify.design/lucide-box.svg' },
    { id: 'workshop', label: 'Мастерская', iconUrl: 'https://api.iconify.design/lucide-hammer.svg' },
    { id: 'wishlist', label: 'Избранное', iconUrl: 'https://api.iconify.design/lucide-heart.svg' },
    { id: 'collections', label: 'Коллекции', iconUrl: 'https://api.iconify.design/lucide-folders.svg' },
    { id: 'purchases', label: 'Мои покупки', iconUrl: 'https://api.iconify.design/lucide-shopping-bag.svg' },
    { id: 'sales', label: 'Мои продажи', iconUrl: 'https://api.iconify.design/lucide-receipt-russian-ruble.svg' },
    { id: 'analytics', label: 'Аналитика', iconUrl: 'https://api.iconify.design/lucide-chart-line.svg' },
    { id: 'wallet', label: 'Кошелек', iconUrl: 'https://api.iconify.design/lucide-wallet.svg' },
    { id: 'settings', label: 'Настройки', iconUrl: 'https://api.iconify.design/lucide-settings.svg' },
];


const DashboardPage: React.FC = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    const [userProducts, setUserProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const activeTab = (searchParams.get('tab') as DashboardTabType) || 'dashboard';

    const setActiveTab = (tab: DashboardTabType) => {
        setSearchParams({ tab });
        setIsSidebarOpen(false); // Close sidebar on selection
    };

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
                console.error("Failed to fetch user products:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchProfileData();
    }, [user]);
    
    const handleProductUpdate = (updatedProduct: Product) => {
        setUserProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
    };

    const renderTabContent = () => {
        if (isLoading) {
            return <div className="flex justify-center items-center h-96"><Spinner /></div>;
        }
        if (!user) return null;

        // Render only the active tab
        const CurrentTab = () => {
             switch (activeTab) {
                case 'dashboard': return <DashboardTab />;
                case 'listings': return <ListingsTab products={userProducts} isOwnProfile={true} onProductUpdate={handleProductUpdate} />;
                case 'workshop': return <WorkshopTab user={user} />;
                case 'wishlist': return <WishlistTab />;
                case 'collections': return <CollectionsTab />;
                case 'purchases': return <PurchasesTab />;
                case 'sales': return <SalesTab />;
                case 'analytics': return <AnalyticsDashboard sellerId={user.id} />;
                case 'wallet': return <WalletTab user={user} />;
                case 'settings': return <SettingsTab user={user} />;
                default: return <DashboardTab />;
            }
        }

        return (
            <section className="panels">
                <div data-panel={activeTab} className="panel is-active">
                    <CurrentTab />
                </div>
            </section>
        );
    };
    
    if (!user) return <div className="flex justify-center py-16"><Spinner size="lg"/></div>;

    const topTabs: DashboardTabType[] = ['dashboard', 'listings', 'sales', 'analytics', 'wallet', 'settings'];

    return (
        <section id="sb-account" className={isSidebarOpen ? 'sidebar-open' : ''}>
            <div className="container">
                <div className="card">
                    <aside aria-label="Меню личного кабинета" className="sidebar">
                        <div className="sidebar-head">
                            <img alt={`Аватар: ${user.name}`} loading="lazy" decoding="async" src={user.avatarUrl} className="avatar" />
                            <div className="profile">
                                <strong className="name">{user.name}</strong>
                                <span className="role">Продавец</span>
                            </div>
                        </div>
                        <nav role="tablist" aria-label="Разделы" className="menu">
                            {TABS.map(tab => (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => setActiveTab(tab.id)}
                                    role="tab"
                                    aria-selected={activeTab === tab.id}
                                    className={`menu-btn ${activeTab === tab.id ? 'is-active' : ''}`}
                                >
                                    <img src={tab.iconUrl} alt={tab.label} />
                                    <span>{tab.label}</span>
                                </button>
                            ))}
                        </nav>
                        <div className="sidebar-footer">
                            <button type="button" aria-label="Выйти из аккаунта" className="logout-btn" onClick={logout}>
                                <img src="https://api.iconify.design/lucide-log-out.svg" alt="Выйти" />
                                <span>Выйти</span>
                            </button>
                        </div>
                    </aside>
                    <main aria-label="Рабочая область" className="main">
                        <div aria-hidden={!isSidebarOpen} className="overlay" onClick={() => setIsSidebarOpen(false)}></div>
                        <header className="main-header">
                            <button type="button" id="acc-open" aria-label="Открыть меню" className="mobile-toggle" onClick={() => setIsSidebarOpen(true)}>
                                <img src="https://api.iconify.design/lucide-menu.svg" alt="Меню" />
                            </button>
                            <div className="title-wrap">
                                <img src="https://api.iconify.design/lucide-sparkles.svg" alt="SandBoard" width="18" height="18" />
                                <strong className="title">Личный кабинет</strong>
                            </div>
                        </header>
                        <div role="tablist" aria-label="Вкладки" className="tabs">
                           {topTabs.map(tabId => {
                               const tab = TABS.find(t => t.id === tabId);
                               if (!tab) return null;
                               return (
                                   <button 
                                     key={tab.id}
                                     type="button"
                                     onClick={() => setActiveTab(tab.id)}
                                     className={`tab-btn ${activeTab === tab.id ? 'is-active' : ''}`}
                                   >
                                       <img src={tab.iconUrl} alt="" />
                                       <span>{tab.label}</span>
                                   </button>
                               )
                           })}
                        </div>
                        {renderTabContent()}
                    </main>
                </div>
            </div>
        </section>
    );
};

export default DashboardPage;