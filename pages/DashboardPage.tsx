import React, { useState, useEffect } from 'react';
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
import './DashboardPage.css';
import { apiService } from '../services/apiService';

export type DashboardTabType = 'summary' | 'products' | 'workshop' | 'favorites' | 'collections' | 'purchases' | 'sales' | 'analytics' | 'wallet' | 'settings';

const DashboardPage: React.FC = () => {
    const { user, logout } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();

    const [userProducts, setUserProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const activeTab = (searchParams.get('tab') as DashboardTabType) || 'summary';
    
    useEffect(() => {
        const root = document.getElementById('sb-account');
        if (!root) return;

        const sidebar = root.querySelector('.sidebar');
        const overlay = root.querySelector('.overlay');
        const openBtn = root.querySelector('#acc-open');

        function openSidebar() {
            if (overlay) {
                root.classList.add('sidebar-open');
                overlay.setAttribute('aria-hidden', 'false');
            }
        }

        function closeSidebar() {
            if (overlay) {
                root.classList.remove('sidebar-open');
                overlay.setAttribute('aria-hidden', 'true');
            }
        }
        if (openBtn) openBtn.addEventListener('click', openSidebar);
        if (overlay) overlay.addEventListener('click', closeSidebar);
        
        let hintTimer: ReturnType<typeof setTimeout> | null = null;
        function hint(text: string): void {
            let node: HTMLElement | null = document.querySelector('#acc-hint');
            if (!node) {
              node = document.createElement('div');
              node.id = 'acc-hint';
              Object.assign(node.style, {
                position: 'fixed', left: '50%', bottom: '22px', transform: 'translateX(-50%)',
                padding: '10px 14px', borderRadius: '12px', border: '1px solid rgb(254, 243, 199)',
                background: 'rgb(255, 251, 235)', color: 'rgba(120, 53, 15, 0.95)',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)', zIndex: '60'
              });
              document.body.appendChild(node);
            }
            node.textContent = text;
            node.style.opacity = '1';
            if (hintTimer) clearTimeout(hintTimer);
            hintTimer = setTimeout(() => { if (node) node.style.opacity = '0'; }, 1500);
        }

        function drawLineChart(canvas: HTMLCanvasElement | null, series: number[]): void {
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

            ctx.strokeStyle = '#E7DCCB';
            ctx.lineWidth = 1;
            ctx.beginPath();
            for (let i = 0; i <= 4; i++) {
                const y = pad + (h / 4) * i;
                ctx.moveTo(pad, y);
                ctx.lineTo(pad + w, y);
            }
            ctx.stroke();

            const max = Math.max(1, ...series);
            const stepX = w / Math.max(1, series.length - 1);
            
            ctx.beginPath();
            series.forEach((v, i) => {
                const x = pad + i * stepX;
                const y = pad + h - (v / max) * h;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            });
            ctx.strokeStyle = '#f59e0b';
            ctx.lineWidth = 2;
            ctx.stroke();
        }

        const csales = document.getElementById('chart-sales') as HTMLCanvasElement;
        const salesData = [0, 1, 0, 2, 1, 0, 0, 1, 0, 1, 0, 0, 2, 0, 0, 1, 0, 0, 0, 2, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1];
        drawLineChart(csales, salesData);

        return () => {
            if (openBtn) openBtn.removeEventListener('click', openSidebar);
            if (overlay) overlay.removeEventListener('click', closeSidebar);
        };

    }, []);

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

    if (!user) return <div className="flex justify-center py-16"><Spinner size="lg"/></div>;
    
    const renderTabContent = () => {
        if (isLoading) {
            return <div className="flex justify-center items-center h-96"><Spinner /></div>;
        }
        switch (activeTab) {
            case 'products': return (
                <article className="list-card">
                  <div className="card-head">
                    <strong className="card-title">Ваши товары</strong>
                    <button type="button" className="gjs-t-button" style={{padding: '0.5rem 0.9rem', fontWeight: 700}}>
                      <img src="https://api.iconify.design/lucide-plus.svg" alt="Добавить" width="18" height="18" style={{filter: 'invert(1)'}} />
                      Добавить товар
                    </button>
                  </div>
                  <div className="products-grid">
                    <article className="product-row">
                      <img loading="lazy" decoding="async" alt="Керамическая ваза" src="https://app.grapesjs.com/api/assets/random-image?query=%22handmade%20ceramic%20vase%20beige%20studio%22&w=320&h=240" className="thumb" />
                      <div className="meta">
                        <strong className="name">Керамическая ваза «Песчаный берег»</strong>
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
                      <div className="price">1 200 ₽</div>
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
                    <article className="product-row">
                      <img loading="lazy" decoding="async" alt="Деревянная подставка" src="https://app.grapesjs.com/api/assets/random-image?query=%22handcrafted%20wood%20stand%20product%20beige%22&w=320&h=240" className="thumb" />
                      <div className="meta">
                        <strong className="name">Деревянная подставка для приборов</strong>
                        <div className="tags">
                          <span className="tag warning">
                            <img src="https://api.iconify.design/lucide-file-clock.svg" alt="Черновик" width="16" height="16" />
                            Черновик
                          </span>
                          <span className="tag">
                            <img src="https://api.iconify.design/lucide-eye.svg" alt="Просмотры" width="16" height="16" />
                            32
                          </span>
                        </div>
                      </div>
                      <div className="price">450 ₽</div>
                      <div className="actions">
                        <button type="button" className="btn-secondary">
                          <img src="https://api.iconify.design/lucide-rocket.svg" alt="Опубликовать" width="16" height="16" />
                          Опубликовать
                        </button>
                        <button type="button" className="btn-ghost">
                          <img src="https://api.iconify.design/lucide-pencil.svg" alt="Редактировать" width="16" height="16" />
                          Редактировать
                        </button>
                      </div>
                    </article>
                  </div>
                  <div className="empty hint-muted" style={{display: 'none'}}>
                    <div>
                      <img src="https://api.iconify.design/lucide-package.svg" alt="Нет товаров" />
                      <strong>Пока нет товаров</strong>
                      <span className="muted">Добавьте первое объявление, чтобы начать продажи.</span>
                    </div>
                  </div>
                </article>
            );
            case 'workshop': return <WorkshopTab user={user} />;
            case 'favorites': return <WishlistTab />;
            case 'collections': return <CollectionsTab />;
            case 'purchases': return <PurchasesTab />;
            case 'sales': return <SalesTab />;
            case 'analytics': return <AnalyticsDashboard sellerId={user.id} />;
            case 'wallet': return <WalletTab user={user} />;
            case 'settings': return <SettingsTab user={user} />;
            default: return null; // Summary is rendered directly in JSX
        }
    };
    
    return (
        <section id="sb-account">
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
                      <button type="button" data-tab="summary" role="tab" className={`menu-btn ${activeTab === 'summary' ? 'is-active' : ''}`} onClick={() => setSearchParams({tab: 'summary'})}><img src="https://api.iconify.design/lucide-layout-dashboard.svg" alt="Сводка" /><span>Сводка</span></button>
                      <button type="button" data-tab="products" role="tab" className={`menu-btn ${activeTab === 'products' ? 'is-active' : ''}`} onClick={() => setSearchParams({tab: 'products'})}><img src="https://api.iconify.design/lucide-box.svg" alt="Товары" /><span>Товары</span></button>
                      <button type="button" data-tab="workshop" role="tab" className={`menu-btn ${activeTab === 'workshop' ? 'is-active' : ''}`} onClick={() => setSearchParams({tab: 'workshop'})}><img src="https://api.iconify.design/lucide-hammer.svg" alt="Мастерская" /><span>Мастерская</span></button>
                      <button type="button" data-tab="favorites" role="tab" className={`menu-btn ${activeTab === 'favorites' ? 'is-active' : ''}`} onClick={() => setSearchParams({tab: 'favorites'})}><img src="https://api.iconify.design/lucide-heart.svg" alt="Избранное" /><span>Избранное</span></button>
                      <button type="button" data-tab="collections" role="tab" className={`menu-btn ${activeTab === 'collections' ? 'is-active' : ''}`} onClick={() => setSearchParams({tab: 'collections'})}><img src="https://api.iconify.design/lucide-folders.svg" alt="Коллекции" /><span>Коллекции</span></button>
                      <button type="button" data-tab="purchases" role="tab" className={`menu-btn ${activeTab === 'purchases' ? 'is-active' : ''}`} onClick={() => setSearchParams({tab: 'purchases'})}><img src="https://api.iconify.design/lucide-shopping-bag.svg" alt="Мои покупки" /><span>Мои покупки</span></button>
                      <button type="button" data-tab="sales" role="tab" className={`menu-btn ${activeTab === 'sales' ? 'is-active' : ''}`} onClick={() => setSearchParams({tab: 'sales'})}><img src="https://api.iconify.design/lucide-receipt-russian-ruble.svg" alt="Мои продажи" /><span>Мои продажи</span></button>
                      <button type="button" data-tab="analytics" role="tab" className={`menu-btn ${activeTab === 'analytics' ? 'is-active' : ''}`} onClick={() => setSearchParams({tab: 'analytics'})}><img src="https://api.iconify.design/lucide-chart-line.svg" alt="Аналитика" /><span>Аналитика</span></button>
                      <button type="button" data-tab="wallet" role="tab" className={`menu-btn ${activeTab === 'wallet' ? 'is-active' : ''}`} onClick={() => setSearchParams({tab: 'wallet'})}><img src="https://api.iconify.design/lucide-wallet.svg" alt="Кошелек" /><span>Кошелек</span></button>
                      <button type="button" data-tab="settings" role="tab" className={`menu-btn ${activeTab === 'settings' ? 'is-active' : ''}`} onClick={() => setSearchParams({tab: 'settings'})}><img src="https://api.iconify.design/lucide-settings.svg" alt="Настройки" /><span>Настройки</span></button>
                      <button type="button" data-tab="platform" role="tab" className="menu-btn"><img src="https://api.iconify.design/lucide-layers.svg" alt="Платформа" /><span>Платформа</span></button>
                      <button type="button" data-tab="dao" role="tab" className="menu-btn"><img src="https://api.iconify.design/lucide-organization.svg" alt="Управление DAO" /><span>Управление DAO</span></button>
                      <button type="button" data-tab="live" role="tab" className="menu-btn"><img src="https://api.iconify.design/lucide-radio.svg" alt="Прямой эфир" /><span>Прямой эфир</span></button>
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
                    </header>
                    <div role="tablist" aria-label="Вкладки" className="tabs">
                        {['summary', 'products', 'sales', 'analytics', 'wallet', 'settings'].map(tabId => {
                            const tabInfo = {
                                summary: { label: 'Сводка', icon: 'https://api.iconify.design/lucide-activity.svg' },
                                products: { label: 'Товары', icon: 'https://api.iconify.design/lucide-box.svg' },
                                sales: { label: 'Продажи', icon: 'https://api.iconify.design/lucide-receipt-russian-ruble.svg' },
                                analytics: { label: 'Аналитика', icon: 'https://api.iconify.design/lucide-chart-line.svg' },
                                wallet: { label: 'Кошелек', icon: 'https://api.iconify.design/lucide-wallet.svg' },
                                settings: { label: 'Настройки', icon: 'https://api.iconify.design/lucide-settings.svg' }
                            };
                            return (
                                <button key={tabId} type="button" data-panel={tabId} className={`tab-btn ${activeTab === tabId ? 'is-active' : ''}`} onClick={() => setSearchParams({tab: tabId as DashboardTabType})}>
                                    <img src={tabInfo[tabId].icon} alt="" />
                                    <span>{tabInfo[tabId].label}</span>
                                </button>
                            )
                        })}
                    </div>
                    <section className="panels">
                      <div data-panel="summary" className={`panel ${activeTab === 'summary' ? 'is-active' : ''}`}>
                        <div className="summary-grid">
                          <article className="kpi-card">
                            <div className="kpi-meta">
                              <span className="kpi-label">Всего покупок</span><span className="kpi-value">0</span>
                            </div>
                            <span className="kpi-trend down"><img src="https://api.iconify.design/lucide-trending-down.svg" alt="Снижение" />-9.05%</span>
                          </article>
                          <article className="kpi-card">
                            <div className="kpi-meta">
                              <span className="kpi-label">Всего продаж</span><span className="kpi-value">0</span>
                            </div>
                            <span className="kpi-trend up"><img src="https://api.iconify.design/lucide-trending-up.svg" alt="Рост" />+11.01%</span>
                          </article>
                        </div>
                        <div className="charts-grid">
                          <article className="chart-card">
                            <div className="card-head"><strong className="card-title">Продажи за месяц</strong></div>
                            <canvas id="chart-sales" aria-label="График продаж за месяц" role="img"></canvas>
                          </article>
                          <article className="chart-card">
                            <div className="card-head"><strong className="card-title">Статистика</strong></div>
                             {/* Placeholder for the second chart */}
                          </article>
                        </div>
                        <article className="list-card">
                          <div className="card-head">
                            <strong className="card-title">Последние заказы</strong><span className="muted">0</span>
                          </div>
                          <div className="empty">
                            <div><img src="https://api.iconify.design/lucide-inbox.svg" alt="Пусто" /><strong >Недавних продаж нет.</strong><span className="muted">Как только появятся новые заказы, они отобразятся здесь.</span></div>
                          </div>
                        </article>
                      </div>
                      <div data-panel="products" className={`panel ${activeTab === 'products' ? 'is-active' : ''}`}>
                         {activeTab === 'products' && renderTabContent()}
                      </div>
                       <div data-panel="workshop" className={`panel ${activeTab === 'workshop' ? 'is-active' : ''}`}>
                         {activeTab === 'workshop' && renderTabContent()}
                      </div>
                       <div data-panel="favorites" className={`panel ${activeTab === 'favorites' ? 'is-active' : ''}`}>
                         {activeTab === 'favorites' && renderTabContent()}
                      </div>
                       <div data-panel="collections" className={`panel ${activeTab === 'collections' ? 'is-active' : ''}`}>
                         {activeTab === 'collections' && renderTabContent()}
                      </div>
                      <div data-panel="sales" className={`panel ${activeTab === 'sales' ? 'is-active' : ''}`}>
                        {activeTab === 'sales' && renderTabContent()}
                      </div>
                       <div data-panel="purchases" className={`panel ${activeTab === 'purchases' ? 'is-active' : ''}`}>
                         {activeTab === 'purchases' && renderTabContent()}
                      </div>
                      <div data-panel="analytics" className={`panel ${activeTab === 'analytics' ? 'is-active' : ''}`}>
                        {activeTab === 'analytics' && renderTabContent()}
                      </div>
                      <div data-panel="wallet" className={`panel ${activeTab === 'wallet' ? 'is-active' : ''}`}>
                        {activeTab === 'wallet' && renderTabContent()}
                      </div>
                      <div data-panel="settings" className={`panel ${activeTab === 'settings' ? 'is-active' : ''}`}>
                        {activeTab === 'settings' && renderTabContent()}
                      </div>
                    </section>
                  </main>
                </div>
              </div>
        </section>
    );
};

export default DashboardPage;