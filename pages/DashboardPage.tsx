import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
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
import './DashboardPage.css';

export type DashboardTabType = 'summary' | 'products' | 'workshop' | 'favorites' | 'collections' | 'purchases' | 'sales' | 'analytics' | 'wallet' | 'settings';
type SpecialTabType = 'platform' | 'dao' | 'live';

const TABS: { id: DashboardTabType | SpecialTabType; label: string; iconUrl: string; implemented: boolean }[] = [
    { id: 'summary', label: 'Сводка', iconUrl: 'https://api.iconify.design/lucide-layout-dashboard.svg', implemented: true },
    { id: 'products', label: 'Товары', iconUrl: 'https://api.iconify.design/lucide-box.svg', implemented: true },
    { id: 'workshop', label: 'Мастерская', iconUrl: 'https://api.iconify.design/lucide-hammer.svg', implemented: true },
    { id: 'favorites', label: 'Избранное', iconUrl: 'https://api.iconify.design/lucide-heart.svg', implemented: true },
    { id: 'collections', label: 'Коллекции', iconUrl: 'https://api.iconify.design/lucide-folders.svg', implemented: true },
    { id: 'purchases', label: 'Мои покупки', iconUrl: 'https://api.iconify.design/lucide-shopping-bag.svg', implemented: true },
    { id: 'sales', label: 'Мои продажи', iconUrl: 'https://api.iconify.design/lucide-receipt-russian-ruble.svg', implemented: true },
    { id: 'analytics', label: 'Аналитика', iconUrl: 'https://api.iconify.design/lucide-chart-line.svg', implemented: true },
    { id: 'wallet', label: 'Кошелек', iconUrl: 'https://api.iconify.design/lucide-wallet.svg', implemented: true },
    { id: 'settings', label: 'Настройки', iconUrl: 'https://api.iconify.design/lucide-settings.svg', implemented: true },
    { id: 'platform', label: 'Платформа', iconUrl: 'https://api.iconify.design/lucide-layers.svg', implemented: false },
    { id: 'dao', label: 'Управление DAO', iconUrl: 'https://api.iconify.design/lucide-organization.svg', implemented: false },
    { id: 'live', label: 'Прямой эфир', iconUrl: 'https://api.iconify.design/lucide-radio.svg', implemented: false },
];

const DashboardPage: React.FC = () => {
    const { user, logout } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();

    const [userProducts, setUserProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [hint, setHint] = useState<{ text: string, visible: boolean }>({ text: '', visible: false });

    const activeTab = (searchParams.get('tab') as DashboardTabType) || 'summary';

    const showHint = (text: string) => {
        setHint({ text, visible: true });
        setTimeout(() => setHint({ text: '', visible: false }), 2000);
    };

    const handleTabClick = (tab: typeof TABS[0]) => {
        if (tab.implemented) {
            setSearchParams({ tab: tab.id });
        } else {
            showHint(`${tab.label} скоро будет доступно`);
        }
        setIsSidebarOpen(false); // Close sidebar on any selection
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

        switch (activeTab) {
            case 'summary': return <DashboardTab />;
            case 'products': return <ListingsTab products={userProducts} isOwnProfile={true} onProductUpdate={handleProductUpdate} />;
            case 'workshop': return <WorkshopTab user={user} />;
            case 'favorites': return <WishlistTab />;
            case 'collections': return <CollectionsTab />;
            case 'purchases': return <PurchasesTab />;
            case 'sales': return <SalesTab />;
            case 'analytics': return <AnalyticsDashboard sellerId={user.id} />;
            case 'wallet': return <WalletTab user={user} />;
            case 'settings': return <SettingsTab user={user} />;
            default: return <DashboardTab />;
        }
    };
    
    if (!user) return <div className="flex justify-center py-16"><Spinner size="lg"/></div>;

    const topTabs: (DashboardTabType)[] = ['summary', 'products', 'sales', 'analytics', 'wallet', 'settings'];

    return (
        <section id="sb-account" className={`h-full ${isSidebarOpen ? 'sidebar-open' : ''}`}>
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
                                    onClick={() => handleTabClick(tab)}
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
                                     onClick={() => handleTabClick(tab)}
                                     className={`tab-btn ${activeTab === tab.id ? 'is-active' : ''}`}
                                   >
                                       <img src={tab.iconUrl} alt="" />
                                       <span>{tab.label}</span>
                                   </button>
                               )
                           })}
                        </div>
                        <section className="panels">
                            <div className="panel is-active">
                                {renderTabContent()}
                            </div>
                        </section>
                    </main>
                </div>
            </div>
             {hint.visible && (
                <div
                    style={{
                        position: 'fixed',
                        left: '50%',
                        bottom: '22px',
                        transform: 'translateX(-50%)',
                        padding: '10px 14px',
                        borderRadius: '12px',
                        border: '1px solid rgb(254, 243, 199)',
                        background: 'rgb(255, 251, 235)',
                        color: 'rgba(120, 53, 15, 0.95)',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                        zIndex: 60,
                        transition: 'opacity 0.3s ease-in-out',
                        opacity: 1,
                    }}
                >
                    {hint.text}
                </div>
            )}
        </section>
    );
};

export default DashboardPage;