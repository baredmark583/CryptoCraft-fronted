import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import type { Product } from '../types';

import Spinner from '../components/Spinner';
import ListingsTab from '../components/ListingsTab';
import WorkshopTab from '../components/WorkshopTab';
import WishlistTab from '../components/WishlistTab';
import CollectionsTab from '../components/CollectionsTab';
import PurchasesTab from '../components/PurchasesTab';
import SalesTab from '../components/SalesTab';
import AnalyticsDashboard from '../components/AnalyticsDashboard';
import WalletTab from '../components/WalletTab';
import SettingsTab from '../components/SettingsTab';
import './DashboardPage.css'; // Используй этот файл для CSS ниже
import { apiService } from '../services/apiService';

export type DashboardTabType = 'summary' | 'products' | 'workshop' | 'favorites' | 'collections' | 'purchases' | 'sales' | 'analytics' | 'wallet' | 'settings';

const DashboardPage: React.FC = () => {
    const { user, logout } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();

    const [userProducts, setUserProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [hintText, setHintText] = useState('');
    const [salesData, setSalesData] = useState([0, 1, 0, 2, 1, 0, 0, 1, 0, 1, 0, 0, 2, 0, 0, 1, 0, 0, 0, 2, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1]);
    const [statsData, setStatsData] = useState([{ label: 'Просмотры', value: 12 }, { label: 'Лайки', value: 4 }, { label: 'Сообщения', value: 2 }]);
    const [analyticsData, setAnalyticsData] = useState([2, 3, 1, 4, 2, 3, 2, 4, 1, 3, 2, 4]);
    const [promoList, setPromoList] = useState<any[]>([]);
    const [promoCount, setPromoCount] = useState(0);

    const activeTab = (searchParams.get('tab') as DashboardTabType) || 'summary';
    const canvasSalesRef = useRef<HTMLCanvasElement>(null);
    const canvasStatsRef = useRef<HTMLCanvasElement>(null);
    const canvasAnalyticsRef = useRef<HTMLCanvasElement>(null);

    // Hint hook logic
    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (hintText) {
            timer = setTimeout(() => setHintText(''), 1500);
        }
        return () => clearTimeout(timer);
    }, [hintText]);

    const showHint = (text: string) => setHintText(text);

    useEffect(() => {
        const root = document.getElementById('sb-account');
        if (!root) return;

        const sidebar = root.querySelector('.sidebar');
        const overlay = root.querySelector('.overlay');
        const openBtn = root.querySelector('#acc-open');

        const openSidebar = () => {
            root.classList.add('sidebar-open');
            if (overlay) overlay.setAttribute('aria-hidden', 'false');
        };

        const closeSidebar = () => {
            root.classList.remove('sidebar-open');
            if (overlay) overlay.setAttribute('aria-hidden', 'true');
        };

        if (openBtn) (openBtn as HTMLElement).addEventListener('click', openSidebar);
        if (overlay) (overlay as HTMLElement).addEventListener('click', closeSidebar);

        // Sidebar tab -> top tabs sync
        const sideButtons = Array.from(root.querySelectorAll('.menu-btn'));
        const topTabs = Array.from(root.querySelectorAll('.tab-btn'));
        const panels = Array.from(root.querySelectorAll('.panel'));

        const setActive = (panel: string) => {
            // Top tabs
            topTabs.forEach(b => {
                const active = (b as HTMLElement).getAttribute('data-panel') === panel;
                (b as HTMLElement).classList.toggle('is-active', active);
            });
            // Left menu
            sideButtons.forEach(b => {
                const key = (b as HTMLElement).getAttribute('data-tab');
                const map: Record<string, string> = {
                    summary: 'summary',
                    products: 'products',
                    sales: 'sales',
                    analytics: 'analytics',
                    wallet: 'wallet',
                    settings: 'settings'
                };
                const p = map[key || ''];
                const active = p === panel;
                (b as HTMLElement).classList.toggle('is-active', active);
                (b as HTMLElement).setAttribute('aria-selected', active ? 'true' : 'false');
            });
            // Panels
            panels.forEach(p => {
                const dataPanel = (p as HTMLElement).getAttribute('data-panel');
                (p as HTMLElement).classList.toggle('is-active', dataPanel === panel);
            });
            closeSidebar();
        };

        topTabs.forEach(b => {
            (b as HTMLElement).addEventListener('click', () => setActive((b as HTMLElement).getAttribute('data-panel') || ''));
        });

        sideButtons.forEach(b => {
            (b as HTMLElement).addEventListener('click', () => {
                const key = (b as HTMLElement).getAttribute('data-tab');
                const map: Record<string, string | null> = {
                    summary: 'summary',
                    products: 'products',
                    sales: 'sales',
                    analytics: 'analytics',
                    wallet: 'wallet',
                    settings: 'settings',
                    workshop: null,
                    favorites: null,
                    collections: null,
                    purchases: null,
                    platform: null,
                    dao: null,
                    live: null
                };
                const target = map[key || ''];
                if (target) {
                    setActive(target);
                } else {
                    const span = (b as HTMLElement).querySelector('span');
                    showHint(`${span?.textContent?.trim()} скоро будет доступно`);
                }
            });
        });

        return () => {
            if (openBtn) (openBtn as HTMLElement).removeEventListener('click', openSidebar);
            if (overlay) (overlay as HTMLElement).removeEventListener('click', closeSidebar);
        };
    }, [showHint]);

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

    // Charts drawing
    const drawLineChart = (canvas: HTMLCanvasElement | null, series: number[], opts = {}) => {
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const dpr = window.devicePixelRatio || 1;
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);

        ctx.clearRect(0, 0, width, height);
        const pad = 24;
        const w = width - pad * 2;
        const h = height - pad * 2;

        // Grid
        ctx.strokeStyle = '#E7DCCB';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let i = 0; i <= 4; i++) {
            const y = pad + (h / 4) * i;
            ctx.moveTo(pad, y);
            ctx.lineTo(pad + w, y);
        }
        ctx.stroke();

        // Axis
        ctx.strokeStyle = '#DCCDB6';
        ctx.beginPath();
        ctx.moveTo(pad, pad);
        ctx.lineTo(pad, pad + h);
        ctx.lineTo(pad + w, pad + h);
        ctx.stroke();

        const max = Math.max(1, ...series);
        const stepX = w / Math.max(1, series.length - 1);

        // Area fill
        ctx.beginPath();
        series.forEach((v, i) => {
            const x = pad + i * stepX;
            const y = pad + h - (v / max) * h;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.lineTo(pad + w, pad + h);
        ctx.lineTo(pad, pad + h);
        ctx.closePath();
        ctx.fillStyle = 'rgba(194, 142, 92, 0.12)';
        ctx.fill();

        // Line
        ctx.beginPath();
        series.forEach((v, i) => {
            const x = pad + i * stepX;
            const y = pad + h - (v / max) * h;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--gjs-t-color-primary') || '#C28E5C';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Points
        ctx.fillStyle = '#C28E5C';
        series.forEach((v, i) => {
            const x = pad + i * stepX;
            const y = pad + h - (v / max) * h;
            ctx.beginPath();
            ctx.arc(x, y, 3, 0, Math.PI * 2);
            ctx.fill();
        });
    };

    const drawBars = (canvas: HTMLCanvasElement | null, series: any[], colors: string[]) => {
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const dpr = window.devicePixelRatio || 1;
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);

        ctx.clearRect(0, 0, width, height);
        const pad = 24;
        const w = width - pad * 2;
        const h = height - pad * 2;

        // Grid
        ctx.strokeStyle = '#E7DCCB';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let i = 0; i <= 4; i++) {
            const y = pad + (h / 4) * i;
            ctx.moveTo(pad, y);
            ctx.lineTo(pad + w, y);
        }
        ctx.stroke();

        const max = Math.max(1, ...series.map(s => s.value));
        const barW = w / (series.length * 1.6);
        const gap = barW * 0.6;

        series.forEach((s, i) => {
            const x = pad + i * (barW + gap) + gap;
            const bh = (s.value / max) * h;
            const y = pad + h - bh;
            ctx.fillStyle = colors[i] || '#C28E5C';
            ctx.fillRect(x, y, barW, bh);
            // Label
            ctx.fillStyle = 'rgba(120, 53, 15, 0.9)';
            ctx.font = '12px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(String(s.value), x + barW / 2, y - 6);
        });
    };

    useEffect(() => {
        const renderCharts = () => {
            drawLineChart(canvasSalesRef.current, salesData);
            drawBars(canvasStatsRef.current, statsData, ['#C28E5C', '#E7A977', '#5A4A3B']);
            drawLineChart(canvasAnalyticsRef.current, analyticsData);
        };

        renderCharts();

        let resizeTimer: NodeJS.Timeout;
        const handleResize = () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(renderCharts, 150);
        };
        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
            clearTimeout(resizeTimer);
        };
    }, [salesData, statsData, analyticsData]);

    const handleProductUpdate = (updatedProduct: Product) => {
        setUserProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
    };

    if (!user) return <div className="flex justify-center py-16"><Spinner size="lg"/></div>;

    const renderTabContent = () => {
        if (isLoading) {
            return <div className="flex justify-center items-center h-96"><Spinner /></div>;
        }
        switch (activeTab) {
            case 'products': return <ListingsTab products={userProducts} isOwnProfile={true} onProductUpdate={handleProductUpdate} />;
            case 'workshop': return <WorkshopTab user={user} />;
            case 'favorites': return <WishlistTab />;
            case 'collections': return <CollectionsTab />;
            case 'purchases': return <PurchasesTab />;
            case 'sales': return <SalesTab />;
            case 'analytics': return <AnalyticsDashboard sellerId={user.id} />;
            case 'wallet': return <WalletTab user={user} />;
            case 'settings': return <SettingsTab user={user} />;
            default: return null;
        }
    };

    // Settings interactions
    const handleNameInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const sidebarName = document.querySelector('.sidebar .profile .name');
        if (sidebarName) (sidebarName as HTMLElement).textContent = e.target.value || 'Без имени';
    };

    const handleAvatarInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const url = e.target.value.trim();
        const avatarPreview = document.getElementById('acc-avatar-preview') as HTMLImageElement;
        const sidebarAvatar = document.querySelector('.sidebar .avatar') as HTMLImageElement;
        if (avatarPreview) avatarPreview.src = url || avatarPreview.src;
        if (sidebarAvatar && url) sidebarAvatar.src = url;
    };

    const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        const coverPreview = document.getElementById('acc-cover-preview') as HTMLImageElement;
        if (file && coverPreview) {
            const url = URL.createObjectURL(file);
            coverPreview.src = url;
        }
    };

    const handleCardToggle = () => {
        const cardInput = document.getElementById('acc-card') as HTMLInputElement;
        const cardToggle = document.getElementById('acc-card-toggle') as HTMLButtonElement;
        if (cardInput && cardToggle) {
            const isPwd = cardInput.type === 'password';
            cardInput.type = isPwd ? 'text' : 'password';
            cardToggle.innerHTML = isPwd ?
                '<img src="https://api.iconify.design/lucide-eye-off.svg" alt="Скрыть" width="16" height="16"/> Скрыть' :
                '<img src="https://api.iconify.design/lucide-eye.svg" alt="Показать" width="16" height="16"/> Показать';
        }
    };

    const handleSettingsSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        showHint('Изменения сохранены');
    };

    const handleImportClick = () => showHint('Импорт скоро будет доступен');

    // AI Promo
    const handleAIPromo = () => {
        const aiText = document.getElementById('acc-promo-ai-text') as HTMLTextAreaElement;
        const promoCode = document.getElementById('acc-promo-code') as HTMLInputElement;
        const promoType = document.getElementById('acc-promo-type') as HTMLSelectElement;
        const promoValue = document.getElementById('acc-promo-value') as HTMLInputElement;
        const promoScope = document.getElementById('acc-promo-scope') as HTMLSelectElement;
        const txt = (aiText?.value || '').toLowerCase();
        const match = txt.match(/(\d{1,2})\s*%/);
        const p = match ? parseInt(match[1], 10) : 10;
        if (promoType) promoType.value = 'Процент (%)';
        if (promoValue) promoValue.value = String(p);
        if (promoCode) promoCode.value = `SALE${p}`.toUpperCase();
        if (promoScope) promoScope.value = txt.includes('всю') || txt.includes('весь') ? 'На весь заказ' : 'На выбранные категории';
        showHint('Черновик промоакции заполнен');
    };

    const handlePromoSave = () => {
        const promoCode = document.getElementById('acc-promo-code') as HTMLInputElement;
        const promoType = document.getElementById('acc-promo-type') as HTMLSelectElement;
        const promoValue = document.getElementById('acc-promo-value') as HTMLInputElement;
        const promoScope = document.getElementById('acc-promo-scope') as HTMLSelectElement;
        const promoMin = document.getElementById('acc-promo-min') as HTMLInputElement;
        const code = (promoCode?.value || '').trim();
        if (!code) {
            showHint('Укажите код промо');
            return;
        }
        const type = promoType?.value || 'Процент (%)';
        const value = promoValue?.value || '0';
        const scope = promoScope?.value || 'На весь заказ';
        const min = promoMin?.value || '';
        // Add to promoList state
        setPromoList(prev => [...prev, { code, type, value: value + (type.includes('%') ? '%' : ''), scope, min }]);
        setPromoCount(prev => prev + 1);
        showHint('Промокод добавлен');
    };

    // Wallet withdraw
    const handleWithdraw = () => showHint('Заявка на вывод создана');

    // Add product
    const handleAddProduct = () => showHint('Форма добавления товара скоро будет доступна');

    // Render promo items
    const renderPromoItems = () => {
        return promoList.map((item, index) => (
            <div key={index} className="promo-item">
                <div>
                    <div className="promo-code">
                        <img src="https://api.iconify.design/lucide-ticket.svg" alt="Код" width="18" height="18" />
                        {item.code}
                    </div>
                    <div className="promo-meta">{item.type}: <strong>{item.value}</strong> • {item.scope}{item.min ? ` • Мин.: ${item.min} USDT` : ''}</div>
                </div>
                <div>
                    <button type="button" className="btn-ghost small">
                        <img src="https://api.iconify.design/lucide-trash-2.svg" alt="Удалить" width="16" height="16" />
                        Удалить
                    </button>
                </div>
            </div>
        ));
    };

    return (
        <section id="sb-account">
            {/* Hint */}
            {hintText && (
                <div id="acc-hint" style={{
                    position: 'fixed' as const, left: '50%', bottom: '22px', transform: 'translateX(-50%)',
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
                            <button type="button" data-tab="summary" role="tab" className={`menu-btn ${activeTab === 'summary' ? 'is-active' : ''}`} aria-selected={activeTab === 'summary'}>
                                <img src="https://api.iconify.design/lucide-layout-dashboard.svg" alt="Сводка" />
                                <span>Сводка</span>
                            </button>
                            <button type="button" data-tab="products" role="tab" className={`menu-btn ${activeTab === 'products' ? 'is-active' : ''}`} aria-selected={activeTab === 'products'}>
                                <img src="https://api.iconify.design/lucide-box.svg" alt="Товары" />
                                <span>Товары</span>
                            </button>
                            <button type="button" data-tab="workshop" role="tab" className="menu-btn" aria-selected="false" onClick={() => showHint('Скоро будет доступно')}>
                                <img src="https://api.iconify.design/lucide-hammer.svg" alt="Мастерская" />
                                <span>Мастерская</span>
                            </button>
                            <button type="button" data-tab="favorites" role="tab" className="menu-btn" aria-selected="false" onClick={() => showHint('Скоро будет доступно')}>
                                <img src="https://api.iconify.design/lucide-heart.svg" alt="Избранное" />
                                <span>Избранное</span>
                            </button>
                            <button type="button" data-tab="collections" role="tab" className="menu-btn" aria-selected="false" onClick={() => showHint('Скоро будет доступно')}>
                                <img src="https://api.iconify.design/lucide-folders.svg" alt="Коллекции" />
                                <span>Коллекции</span>
                            </button>
                            <button type="button" data-tab="purchases" role="tab" className="menu-btn" aria-selected="false" onClick={() => showHint('Скоро будет доступно')}>
                                <img src="https://api.iconify.design/lucide-shopping-bag.svg" alt="Мои покупки" />
                                <span>Мои покупки</span>
                            </button>
                            <button type="button" data-tab="sales" role="tab" className={`menu-btn ${activeTab === 'sales' ? 'is-active' : ''}`} aria-selected={activeTab === 'sales'}>
                                <img src="https://api.iconify.design/lucide-receipt-russian-ruble.svg" alt="Мои продажи" />
                                <span>Мои продажи</span>
                            </button>
                            <button type="button" data-tab="analytics" role="tab" className={`menu-btn ${activeTab === 'analytics' ? 'is-active' : ''}`} aria-selected={activeTab === 'analytics'}>
                                <img src="https://api.iconify.design/lucide-chart-line.svg" alt="Аналитика" />
                                <span>Аналитика</span>
                            </button>
                            <button type="button" data-tab="wallet" role="tab" className={`menu-btn ${activeTab === 'wallet' ? 'is-active' : ''}`} aria-selected={activeTab === 'wallet'}>
                                <img src="https://api.iconify.design/lucide-wallet.svg" alt="Кошелек" />
                                <span>Кошелек</span>
                            </button>
                            <button type="button" data-tab="settings" role="tab" className={`menu-btn ${activeTab === 'settings' ? 'is-active' : ''}`} aria-selected={activeTab === 'settings'}>
                                <img src="https://api.iconify.design/lucide-settings.svg" alt="Настройки" />
                                <span>Настройки</span>
                            </button>
                            <button type="button" data-tab="platform" role="tab" className="menu-btn" aria-selected="false" onClick={() => showHint('Скоро будет доступно')}>
                                <img src="https://api.iconify.design/lucide-layers.svg" alt="Платформа" />
                                <span>Платформа</span>
                            </button>
                            <button type="button" data-tab="dao" role="tab" className="menu-btn" aria-selected="false" onClick={() => showHint('Скоро будет доступно')}>
                                <img src="https://api.iconify.design/lucide-organization.svg" alt="Управление DAO" />
                                <span>Управление DAO</span>
                            </button>
                            <button type="button" data-tab="live" role="tab" className="menu-btn" aria-selected="false" onClick={() => showHint('Скоро будет доступно')}>
                                <img src="https://api.iconify.design/lucide-radio.svg" alt="Прямой эфир" />
                                <span>Прямой эфир</span>
                            </button>
                        </nav>
                        <div className="sidebar-footer">
                            <button type="button" aria-label="Выйти из аккаунта" className="logout-btn" onClick={logout}>
                                <img src="https://api.iconify.design/lucide-log-out.svg" alt="Выйти" />
                                <span>Выйти</span>
                            </button>
                        </div>
                    </aside>
                    <main aria-label="Рабочая область" className="main">
                        <div aria-hidden="true" className="overlay"></div>
                        <header className="main-header">
                            <button type="button" id="acc-open" aria-label="Открыть меню" className="mobile-toggle">
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
                            <button type="button" data-panel="summary" className={`tab-btn ${activeTab === 'summary' ? 'is-active' : ''}`}>
                                <img src="https://api.iconify.design/lucide-activity.svg" alt="" />
                                <span>Сводка</span>
                            </button>
                            <button type="button" data-panel="products" className={`tab-btn ${activeTab === 'products' ? 'is-active' : ''}`}>
                                <img src="https://api.iconify.design/lucide-box.svg" alt="" />
                                <span>Товары</span>
                            </button>
                            <button type="button" data-panel="sales" className={`tab-btn ${activeTab === 'sales' ? 'is-active' : ''}`}>
                                <img src="https://api.iconify.design/lucide-receipt-russian-ruble.svg" alt="" />
                                <span>Мои продажи</span>
                            </button>
                            <button type="button" data-panel="analytics" className={`tab-btn ${activeTab === 'analytics' ? 'is-active' : ''}`}>
                                <img src="https://api.iconify.design/lucide-chart-line.svg" alt="" />
                                <span>Аналитика</span>
                            </button>
                            <button type="button" data-panel="wallet" className={`tab-btn ${activeTab === 'wallet' ? 'is-active' : ''}`}>
                                <img src="https://api.iconify.design/lucide-wallet.svg" alt="" />
                                <span>Кошелек</span>
                            </button>
                            <button type="button" data-panel="settings" className={`tab-btn ${activeTab === 'settings' ? 'is-active' : ''}`}>
                                <img src="https://api.iconify.design/lucide-settings.svg" alt="" />
                                <span>Настройки</span>
                            </button>
                        </div>
                        <section className="panels">
                            {/* Summary Panel */}
                            <div data-panel="summary" className={`panel ${activeTab === 'summary' ? 'is-active' : ''}`}>
                                <div className="summary-grid">
                                    <article className="kpi-card">
                                        <div className="kpi-meta">
                                            <span className="kpi-label">Всего покупок</span>
                                            <span className="kpi-value">0</span>
                                        </div>
                                        <span className="kpi-trend down">
                                            <img src="https://api.iconify.design/lucide-trending-down.svg" alt="Снижение" />
                                            -9.05%
                                        </span>
                                    </article>
                                    <article className="kpi-card">
                                        <div className="kpi-meta">
                                            <span className="kpi-label">Всего продаж</span>
                                            <span className="kpi-value">0</span>
                                        </div>
                                        <span className="kpi-trend up">
                                            <img src="https://api.iconify.design/lucide-trending-up.svg" alt="Рост" />
                                            +11.01%
                                        </span>
                                    </article>
                                </div>
                                <div className="charts-grid">
                                    <article className="chart-card">
                                        <div className="card-head">
                                            <strong className="card-title">Продажи за месяц</strong>
                                            <button type="button" className="range">
                                                <img src="https://api.iconify.design/lucide-calendar-range.svg" alt="Период" width="16" height="16" />
                                                Месяц
                                            </button>
                                        </div>
                                        <canvas ref={canvasSalesRef} id="chart-sales" aria-label="График продаж за месяц" role="img"></canvas>
                                    </article>
                                    <article className="chart-card">
                                        <div className="card-head">
                                            <strong className="card-title">Статистика</strong>
                                            <button type="button" className="range">
                                                <img src="https://api.iconify.design/lucide-gauge.svg" alt="Метрики" width="16" height="16" />
                                                Неделя
                                            </button>
                                        </div>
                                        <canvas ref={canvasStatsRef} id="chart-stats" aria-label="График статистики" role="img"></canvas>
                                    </article>
                                </div>
                                <article className="list-card">
                                    <div className="card-head">
                                        <strong className="card-title">Последние заказы</strong>
                                        <span className="muted">0</span>
                                    </div>
                                    <div className="empty">
                                        <div>
                                            <img src="https://api.iconify.design/lucide-inbox.svg" alt="Пусто" />
                                            <strong>Недавних продаж нет.</strong>
                                            <span className="muted">Как только появятся новые заказы, они отобразятся здесь.</span>
                                        </div>
                                    </div>
                                </article>
                            </div>
                            {/* Products Panel */}
                            <div data-panel="products" className={`panel ${activeTab === 'products' ? 'is-active' : ''}`}>
                                <article className="list-card">
                                    <div className="card-head">
                                        <strong className="card-title">Ваши товары</strong>
                                        <button type="button" id="acc-add-product" className="gjs-t-button" onClick={handleAddProduct}>
                                            <img src="https://api.iconify.design/lucide-plus.svg" alt="Добавить" width="18" height="18" />
                                            Добавить товар
                                        </button>
                                    </div>
                                    <div className="products-grid">
                                        {userProducts.length > 0 ? (
                                            userProducts.map((product, index) => (
                                                <article key={product.id || index} className="product-row">
                                                    <img loading="lazy" decoding="async" alt={product.name} src={product.imageUrl} className="thumb" />
                                                    <div className="meta">
                                                        <strong className="name">{product.name}</strong>
                                                        <div className="tags">
                                                            <span className="tag success">
                                                                <img src="https://api.iconify.design/lucide-badge-check.svg" alt="Опубликовано" width="16" height="16" />
                                                                Опубликовано
                                                            </span>
                                                            <span className="tag">
                                                                <img src="https://api.iconify.design/lucide-eye.svg" alt="Просмотры" width="16" height="16" />
                                                                124
                                                            </span>
                                                            <span className="tag">
                                                                <img src="https://api.iconify.design/lucide-heart.svg" alt="Лайки" width="16" height="16" />
                                                                18
                                                            </span>
                                                            <span className="tag">
                                                                <img src="https://api.iconify.design/lucide-message-square.svg" alt="Сообщения" width="16" height="16" />
                                                                3
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="price">{product.price} ₽</div>
                                                    <div className="actions">
                                                        <button type="button" className="btn-secondary">
                                                            <img src="https://api.iconify.design/lucide-pencil.svg" alt="Редактировать" width="16" height="16" />
                                                            Редактировать
                                                        </button>
                                                        <button type="button" className="btn-ghost">
                                                            <img src="https://api.iconify.design/lucide-external-link.svg" alt="Просмотр" width="16" height="16" />
                                                            Просмотр
                                                        </button>
                                                    </div>
                                                </article>
                                            ))
                                        ) : (
                                            <div className="empty hint-muted">
                                                <div>
                                                    <img src="https://api.iconify.design/lucide-package.svg" alt="Нет товаров" />
                                                    <strong>Пока нет товаров</strong>
                                                    <span className="muted">Добавьте первое объявление, чтобы начать продажи.</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </article>
                            </div>
                            {/* Sales Panel */}
                            <div data-panel="sales" className={`panel ${activeTab === 'sales' ? 'is-active' : ''}`}>
                                <article className="list-card">
                                    <div className="card-head">
                                        <strong className="card-title">Мои продажи</strong>
                                        <span className="muted">0</span>
                                    </div>
                                    <div className="empty">
                                        <div>
                                            <img src="https://api.iconify.design/lucide-receipt-russian-ruble.svg" alt="Нет продаж" />
                                            <strong>Продаж еще не было</strong>
                                            <span className="muted">Здесь появится история ваших сделок.</span>
                                        </div>
                                    </div>
                                </article>
                            </div>
                            {/* Analytics Panel */}
                            <div data-panel="analytics" className={`panel ${activeTab === 'analytics' ? 'is-active' : ''}`}>
                                <article className="chart-card">
                                    <div className="card-head">
                                        <strong className="card-title">Общая аналитика</strong>
                                    </div>
                                    <canvas ref={canvasAnalyticsRef} id="chart-analytics" aria-label="Общая аналитика" role="img"></canvas>
                                </article>
                            </div>
                            {/* Wallet Panel */}
                            <div data-panel="wallet" className={`panel ${activeTab === 'wallet' ? 'is-active' : ''}`}>
                                <article className="list-card wallet-card">
                                    <div className="card-head">
                                        <strong className="card-title">Кошелек</strong>
                                        <button type="button" id="acc-wallet-withdraw" className="gjs-t-button" onClick={handleWithdraw}>
                                            <img src="https://api.iconify.design/lucide-banknote.svg" alt="Вывести" width="18" height="18" />
                                            Вывести средства
                                        </button>
                                    </div>
                                    <div className="wallet-grid">
                                        <div className="kpi">
                                            <span className="kpi-label">Доступно к выводу</span>
                                            <span className="kpi-value">50.00 USDT</span>
                                        </div>
                                        <div className="kpi">
                                            <span className="kpi-label">Ожидает поступления</span>
                                            <span className="kpi-value">0.00 USDT</span>
                                        </div>
                                        <div className="kpi">
                                            <span className="kpi-label">Всего заработано</span>
                                            <span className="kpi-value">0.00 USDT</span>
                                        </div>
                                        <div className="kpi">
                                            <span className="kpi-label">Завершенные сделки</span>
                                            <span className="kpi-value">0</span>
                                        </div>
                                    </div>
                                    <div className="notice">
                                        <img src="https://api.iconify.design/lucide-info.svg" alt="Инфо" width="18" height="18" />
                                        Отправленные, но не подтвержденные заказы — средства будут доступны после подтверждения сделки.
                                    </div>
                                </article>
                                <article className="list-card">
                                    <div className="card-head">
                                        <strong className="card-title">История операций</strong>
                                    </div>
                                    <div className="empty">
                                        <div>
                                            <img src="https://api.iconify.design/lucide-history.svg" alt="История пуста" />
                                            <strong>Операций пока нет.</strong>
                                            <span className="muted">Как только появятся операции, вы увидите их в этом списке.</span>
                                        </div>
                                    </div>
                                </article>
                            </div>
                            {/* Settings Panel */}
                            <div data-panel="settings" className={`panel ${activeTab === 'settings' ? 'is-active' : ''}`}>
                                <form method="get" id="acc-settings-form" noValidate className="settings-form" onSubmit={handleSettingsSubmit}>
                                    <article className="list-card">
                                        <div className="card-head">
                                            <strong className="card-title">Профиль</strong>
                                        </div>
                                        <div className="form-grid">
                                            <div className="field">
                                                <label htmlFor="acc-name" className="label">Имя</label>
                                                <input type="text" id="acc-name" name="name" defaultValue={user.name} placeholder="Ваше имя" className="input" onInput={handleNameInput} />
                                            </div>
                                            <div className="field">
                                                <label htmlFor="acc-avatar-url" className="label">URL аватара</label>
                                                <div className="input-with-preview">
                                                    <input type="url" id="acc-avatar-url" name="avatar" defaultValue={user.avatarUrl} placeholder="https://..." className="input" onInput={handleAvatarInput} />
                                                    <img id="acc-avatar-preview" alt="Предпросмотр аватара" loading="lazy" decoding="async" src={user.avatarUrl} />
                                                </div>
                                            </div>
                                            <div className="field col-span">
                                                <label className="label">Шапка профиля</label>
                                                <div className="cover">
                                                    <figure className="cover-box">
                                                        <img id="acc-cover-preview" alt="Предпросмотр шапки" loading="lazy" decoding="async" src="https://app.grapesjs.com/api/assets/random-image?query=%22craft%20studio%20banner%20minimal%20beige%22&w=1200&h=360" />
                                                    </figure>
                                                    <div className="cover-actions">
                                                        <label className="btn-secondary">
                                                            <img src="https://api.iconify.design/lucide-upload.svg" alt="Загрузить" width="18" height="18" />
                                                            Загрузить
                                                            <input type="file" id="acc-cover-input" accept="image/*" hidden onChange={handleCoverChange} />
                                                        </label>
                                                        <span className="muted">Предпросмотр шапки</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </article>
                                    <article className="list-card">
                                        <div className="card-head">
                                            <strong className="card-title">Адрес доставки по умолчанию</strong>
                                        </div>
                                        <p className="helper">
                                            Этот город будет отображаться на ваших товарах как место отправки.
                                        </p>
                                        <div className="form-grid">
                                            <div className="field">
                                                <label htmlFor="acc-city" className="label">Город</label>
                                                <input type="text" id="acc-city" name="city" defaultValue="Київ" placeholder="Город" className="input" />
                                            </div>
                                            <div className="field">
                                                <label htmlFor="acc-branch" className="label">Отделение / Почтомат</label>
                                                <input type="text" id="acc-branch" name="branch" defaultValue="18" placeholder="Номер отделения" className="input" />
                                            </div>
                                            <div className="field">
                                                <label htmlFor="acc-fullname" className="label">ФИО получателя</label>
                                                <input type="text" id="acc-fullname" name="fullname" defaultValue="Михаил" placeholder="ФИО" className="input" />
                                            </div>
                                            <div className="field">
                                                <label htmlFor="acc-phone" className="label">Телефон</label>
                                                <input type="tel" id="acc-phone" name="phone" defaultValue="0682523365" placeholder="+380..." className="input" />
                                            </div>
                                        </div>
                                    </article>
                                    <article className="list-card">
                                        <div className="card-head">
                                            <strong className="card-title">Реквизиты для выплат</strong>
                                        </div>
                                        <p className="helper">
                                            Эти данные будут использоваться для вывода средств с вашего баланса на платформе.
                                        </p>
                                        <div className="form-grid">
                                            <div className="field">
                                                <label htmlFor="acc-card" className="label">Номер карты</label>
                                                <div className="input-with-action">
                                                    <input type="password" id="acc-card" name="card" defaultValue="5354390100152698" data-mask="true" className="input" />
                                                    <button type="button" id="acc-card-toggle" className="btn-ghost small" onClick={handleCardToggle}>
                                                        <img src="https://api.iconify.design/lucide-eye.svg" alt="Показать" width="16" height="16" />
                                                        Показать
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="field">
                                                <label htmlFor="acc-ton" className="label">TON-кошелек</label>
                                                <input type="text" id="acc-ton" name="ton" defaultValue="UQC6vpqj-kLTvsgymrfp3cfpcEwMScwiyvIz7y3eT-osh38O" placeholder="TON адрес" className="input" />
                                                <p className="helper">
                                                    Укажите ваш TON-кошелек, чтобы покупатели могли отправлять оплату напрямую вам. Этот способ не защищен "Безопасной сделкой".
                                                </p>
                                            </div>
                                        </div>
                                    </article>
                                    <div className="actions-row">
                                        <button type="submit" className="gjs-t-button">
                                            <img src="https://api.iconify.design/lucide-save.svg" alt="Сохранить" width="18" height="18" />
                                            Сохранить изменения
                                        </button>
                                    </div>
                                    <article className="list-card">
                                        <div className="card-head">
                                            <strong className="card-title">Инструменты для объявлений</strong>
                                        </div>
                                        <p className="muted">
                                            Импорт с других платформ. Перенесите свой магазин с другой площадки (например, OLX, Prom.ua) в CryptoCraft всего за несколько кликов. Наш AI-ассистент автоматически проанализирует ссылки на ваши товары и подготовит черновики для публикации.
                                        </p>
                                        <div className="tool-row">
                                            <button type="button" id="acc-import-btn" className="gjs-t-button" onClick={handleImportClick}>
                                                <img src="https://api.iconify.design/lucide-download.svg" alt="Импорт" width="18" height="18" />
                                                Перейти к импорту
                                            </button>
                                        </div>
                                    </article>
                                    <article className="list-card">
                                        <div className="card-head">
                                            <strong className="card-title">Инструменты маркетинга — Управление промокодами</strong>
                                        </div>
                                        <div className="promo-ai">
                                            <div className="promo-ai-head">
                                                <span className="spark">
                                                    <img src="https://api.iconify.design/lucide-sparkles.svg" alt="AI" width="18" height="18" />
                                                    AI-Помощник
                                                </span>
                                                <span className="muted">Опишите вашу цель, и AI сгенерирует настройки промо-акции за вас.</span>
                                            </div>
                                            <textarea id="acc-promo-ai-text" rows={3} placeholder="Например: Хочу устроить распродажу на всю керамику со скидкой 25% до конца месяца" className="textarea"></textarea>
                                            <div className="tool-row">
                                                <button type="button" id="acc-promo-ai-btn" className="btn-secondary" onClick={handleAIPromo}>
                                                    <img src="https://api.iconify.design/lucide-wand-2.svg" alt="Сгенерировать" width="18" height="18" />
                                                    Сгенерировать
                                                </button>
                                            </div>
                                        </div>
                                        <div className="form-grid">
                                            <div className="field">
                                                <label htmlFor="acc-promo-code" className="label">Код</label>
                                                <input type="text" id="acc-promo-code" defaultValue="SALE20" placeholder="Напр.: SPRING25" className="input" />
                                            </div>
                                            <div className="field">
                                                <label htmlFor="acc-promo-type" className="label">Тип скидки</label>
                                                <select id="acc-promo-type" className="select">
                                                    <option>Процент (%)</option>
                                                    <option>Фиксированная сумма</option>
                                                </select>
                                            </div>
                                            <div className="field">
                                                <label htmlFor="acc-promo-value" className="label">Значение скидки</label>
                                                <input type="number" id="acc-promo-value" defaultValue="10" min={1} step={1} className="input" />
                                            </div>
                                            <div className="field">
                                                <label htmlFor="acc-promo-scope" className="label">Область применения</label>
                                                <select id="acc-promo-scope" className="select">
                                                    <option>На весь заказ</option>
                                                    <option>На выбранные категории</option>
                                                    <option>На выбранные товары</option>
                                                </select>
                                            </div>
                                            <div className="field">
                                                <label htmlFor="acc-promo-min" className="label">Минимальная сумма заказа (USDT)</label>
                                                <input type="number" id="acc-promo-min" placeholder="Не обязательно" min={0} step={0.01} className="input" />
                                            </div>
                                        </div>
                                        <div className="actions-row">
                                            <button type="button" id="acc-promo-save-btn" className="gjs-t-button" onClick={handlePromoSave}>
                                                <img src="https://api.iconify.design/lucide-badge-plus.svg" alt="Сохранить промоакцию" width="18" height="18" />
                                                Сохранить промоакцию
                                            </button>
                                        </div>
                                        <div className="promo-list">
                                            <div className="card-head">
                                                <strong className="card-title">Активные промокоды</strong>
                                                <span className="muted">{promoCount}</span>
                                            </div>
                                            <div id="acc-promo-list" className={promoList.length === 0 ? 'empty' : ''}>
                                                {promoList.length === 0 ? (
                                                    <div>
                                                        <img src="https://api.iconify.design/lucide-ticket.svg" alt="Промокодов нет" />
                                                        <strong>У вас пока нет промокодов.</strong>
                                                        <span className="muted">Создайте первый промокод, чтобы запустить акцию.</span>
                                                    </div>
                                                ) : (
                                                    renderPromoItems()
                                                )}
                                            </div>
                                        </div>
                                    </article>
                                </form>
                            </div>
                        </section>
                    </main>
                </div>
            </div>
        </section>
    );
};

export default DashboardPage;