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
import './DashboardPage.css';
import { apiService } from '../services/apiService';

export type DashboardTabType = 'summary' | 'products' | 'workshop' | 'favorites' | 'collections' | 'purchases' | 'sales' | 'analytics' | 'wallet' | 'settings' | 'platform' | 'dao' | 'live';

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
                live: 'Прямой эфир'
            };
            showHint(`${tabLabels[tab] || tab} скоро будет доступно`);
        }
    };
    
    useEffect(() => {
        // FIX: Replaced NodeJS.Timeout with ReturnType<typeof setTimeout> to resolve type error in browser environment.
        let timer: ReturnType<typeof setTimeout>;
        if (hintText) {
            timer = setTimeout(() => setHintText(''), 1500);
        }
        return () => clearTimeout(timer);
    }, [hintText]);

    const showHint = useCallback((text: string) => setHintText(text), []);

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

    if (!user) {
        return <div className="flex justify-center py-16"><Spinner size="lg"/></div>;
    }

    const renderTabContent = () => {
        if (isLoading) {
            return <div className="flex justify-center items-center h-full"><Spinner size="lg" /></div>;
        }
        switch (activeTab) {
            case 'summary': return <DashboardTab />;
            case 'products': return <ListingsTab products={userProducts} isOwnProfile={true} onProductUpdate={handleProductUpdate} />;
            case 'sales': return <SalesTab />;
            case 'analytics': return <AnalyticsDashboard sellerId={user.id} />;
            case 'wallet': return <WalletTab user={user} />;
            case 'settings': return <SettingsTab user={user} />;
            default: return null;
        }
    };
    
    const sidebarTabs: { id: DashboardTabType, label: string, icon: string }[] = [
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
    
    const topBarTabs: { id: DashboardTabType, label: string, icon: string }[] = [
        { id: 'summary', label: 'Сводка', icon: 'https://api.iconify.design/lucide-activity.svg' },
        { id: 'products', label: 'Товары', icon: 'https://api.iconify.design/lucide-box.svg' },
        { id: 'sales', label: 'Мои продажи', icon: 'https://api.iconify.design/lucide-receipt-russian-ruble.svg' },
        { id: 'analytics', label: 'Аналитика', icon: 'https://api.iconify.design/lucide-chart-line.svg' },
        { id: 'wallet', label: 'Кошелек', icon: 'https://api.iconify.design/lucide-wallet.svg' },
        { id: 'settings', label: 'Настройки', icon: 'https://api.iconify.design/lucide-settings.svg' },
    ];

    return (
        <section id="sb-account" className={isSidebarOpen ? 'sidebar-open' : ''}>
            {hintText && (
                <div id="acc-hint" style={{
                    position: 'fixed', left: '50%', bottom: '22px', transform: 'translateX(-50%)',
                    padding: '10px 14px', borderRadius: '12px', border: '1px solid rgb(254, 243, 199)',
                    background: 'rgb(255, 251, 235)', color: 'rgba(120, 53, 15, 0.95)',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)', zIndex: 60, opacity: 1, transition: 'opacity 300ms'
                }}>
                    {hintText}
                </div>
            )}
            <div className="container">
                <div className="card">
                    <aside aria-label="Меню личного кабинета" className="sidebar">
                        <div className="sidebar-head">
                            <img alt={`Аватар: ${user.name}`} src={user.avatarUrl} className="avatar" />
                            <div className="profile">
                                <strong className="name">{user.name}</strong>
                                <span className="role">Продавец</span>
                            </div>
                        </div>
                        <nav role="tablist" aria-label="Разделы" className="menu">
                             {sidebarTabs.map(tab => (
                                <button
                                    key={tab.id}
                                    type="button"
                                    role="tab"
                                    className={`menu-btn ${activeTab === tab.id ? 'is-active' : ''}`}
                                    aria-selected={activeTab === tab.id}
                                    onClick={() => handleSetTab(tab.id)}
                                >
                                    <img src={tab.icon} alt={tab.label} />
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
                            <form method="get" action="#search" role="search" className="search">
                                <div className="search-field">
                                    <img src="https://api.iconify.design/lucide-search.svg" alt="Поиск" />
                                    <input type="search" placeholder="Поиск по объявлениям..." aria-label="Поиск по объявлениям" className="search-input" />
                                </div>
                            </form>
                        </header>
                        <div role="tablist" aria-label="Вкладки" className="tabs">
                            {topBarTabs.map(tab => (
                                <button
                                    key={tab.id}
                                    type="button"
                                    className={`tab-btn ${activeTab === tab.id ? 'is-active' : ''}`}
                                    onClick={() => handleSetTab(tab.id)}
                                >
                                    <img src={tab.icon} alt="" />
                                    <span>{tab.label}</span>
                                </button>
                            ))}
                        </div>
                        <section className="panels">
                            <div className={`panel is-active`}>
                                {renderTabContent()}
                            </div>
                        </section>
                    </main>
                </div>
            </div>
        </section>
    );
};

export default DashboardPage;