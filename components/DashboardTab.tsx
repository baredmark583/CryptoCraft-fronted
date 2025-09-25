import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { ProfileTab } from '../pages/ProfilePage';
import OfferModal from './OfferModal';
import { apiService } from '../services/apiService';
import { geminiService } from '../services/geminiService';
import type { User, Product, SellerDashboardData, AiFocus } from '../types';
import Spinner from './Spinner';

interface OfferTarget {
    user: User;
    product: Product;
}

const StatCard: React.FC<{ title: string; value: string | number; icon: JSX.Element; colorClass?: string }> = ({ title, value, icon, colorClass = 'text-green-400' }) => (
    <div className="bg-brand-surface p-6 rounded-lg">
        <div className="flex justify-between items-center">
            <p className="text-sm font-medium text-brand-text-secondary">{title}</p>
            <span className="text-brand-text-secondary">{icon}</span>
        </div>
        <p className={`text-3xl font-bold ${colorClass}`}>{value}</p>
    </div>
);


const AiFocusCard: React.FC<{ data: AiFocus; onCtaClick: (link: AiFocus['ctaLink']) => void; }> = ({ data, onCtaClick }) => (
    <div className="bg-brand-surface p-6 rounded-lg border-l-4 border-brand-primary animate-fade-in-down">
        <div className="flex items-start gap-4">
             <div className="text-2xl mt-1">🤖</div>
             <div>
                <h3 className="text-xl font-bold text-white">{data.title}</h3>
                <p className="text-brand-text-secondary mt-1 mb-4">{data.reason}</p>
                <button 
                    onClick={() => onCtaClick(data.ctaLink)}
                    className="bg-brand-primary hover:bg-brand-primary-hover text-white font-bold py-2 px-4 rounded-lg transition-colors text-sm"
                >
                    {data.ctaText}
                </button>
            </div>
        </div>
    </div>
);

const AiFocusGenerator: React.FC<{ onGenerate: () => void; isLoading: boolean }> = ({ onGenerate, isLoading }) => (
    <div className="bg-brand-surface p-6 rounded-lg text-center">
        <div className="text-4xl mb-4">🤖✨</div>
        <h3 className="text-xl font-bold text-white">Фокус дня</h3>
        <p className="text-brand-text-secondary mt-1 mb-4">Нажмите, чтобы получить персональный совет от AI-ассистента по приоритетам на сегодня.</p>
        <button
            onClick={onGenerate}
            disabled={isLoading}
            className="bg-brand-primary hover:bg-brand-primary-hover text-white font-bold py-2 px-6 rounded-lg transition-colors text-sm flex items-center justify-center mx-auto disabled:bg-gray-500"
        >
            {isLoading ? <Spinner size="sm"/> : 'Сгенерировать совет'}
        </button>
    </div>
);


interface DashboardTabProps {
    sellerId: string;
    setActiveTab: (tab: ProfileTab) => void;
}

const DashboardTab: React.FC<DashboardTabProps> = ({ setActiveTab, sellerId }) => {
    const [dashboardData, setDashboardData] = useState<SellerDashboardData | null>(null);
    const [aiFocus, setAiFocus] = useState<AiFocus | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [aiFocusState, setAiFocusState] = useState<'idle' | 'loading' | 'success'>('idle');
    const [offerTarget, setOfferTarget] = useState<OfferTarget | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const data = await apiService.getSellerDashboardData(sellerId);
                setDashboardData(data);
            } catch (error) {
                console.error("Failed to fetch dashboard data:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [sellerId]);
    
    const handleGenerateFocus = async () => {
        if (!dashboardData) return;
        setAiFocusState('loading');
        try {
            const focus = await geminiService.generateDashboardFocus(dashboardData);
            setAiFocus(focus);
            setAiFocusState('success');
        } catch (error) {
            console.error("Failed to generate AI focus:", error);
            setAiFocusState('idle'); // Revert on error
        }
    };


    // FIX: The 'chat' link is for navigation, not for switching profile tabs.
    // This ensures that 'chat' is handled by `navigate` and not passed to `setActiveTab`, which would cause a type error.
    const handleActionClick = (linkTo: 'sales' | 'listings' | 'chat' | 'analytics' | 'settings', entityId?: string) => {
        if (linkTo === 'chat') {
            navigate(entityId ? `/chat/${entityId}` : '/chat');
        } else {
            setActiveTab(linkTo);
        }
    };

    const handleSendOffer = async (user: {id: string, name: string}, product: {id: string, name: string}) => {
        const fullProduct = await apiService.getProductById(product.id);
        const fullUser = await apiService.getUserById(user.id);
        if (fullProduct && fullUser) {
            setOfferTarget({ product: fullProduct, user: fullUser });
        } else {
            alert("Не удалось загрузить данные для предложения.");
        }
    };
    
    const getActionableItemStyle = (type: string) => {
        switch(type) {
            case 'new_order': return 'bg-green-500/20 text-green-300 border-green-500/30';
            case 'new_message': return 'bg-sky-500/20 text-sky-300 border-sky-500/30';
            case 'low_stock': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
            case 'dispute': return 'bg-red-500/20 text-red-300 border-red-500/30';
            default: return 'bg-brand-surface border-brand-border';
        }
    }

    if (isLoading) {
        return <div className="flex justify-center py-16"><Spinner /></div>;
    }
    
    if (!dashboardData) {
        return <div className="text-center py-16 bg-brand-surface rounded-lg"><p className="text-brand-text-secondary">Не удалось загрузить данные для сводки.</p></div>;
    }
    
    const { metrics, actionableItems, recentActivity } = dashboardData;

    return (
        <>
            <div className="space-y-8 animate-fade-in-down">
                {/* AI Focus */}
                <section>
                     {/* FIX: Correctly set isLoading prop to only be true when the AI is generating. The previous comparison was incorrect. */}
                     {aiFocusState === 'idle' && <AiFocusGenerator onGenerate={handleGenerateFocus} isLoading={aiFocusState === 'loading'} />}
                     {aiFocusState === 'loading' && (
                        <div className="bg-brand-surface p-6 rounded-lg flex flex-col items-center justify-center min-h-[190px]">
                            <Spinner />
                            <p className="mt-4 text-brand-text-secondary">Анализирую данные...</p>
                        </div>
                    )}
                     {aiFocusState === 'success' && aiFocus && (
                        <AiFocusCard data={aiFocus} onCtaClick={(link) => handleActionClick(link)} />
                    )}
                </section>

                {/* Key Metrics */}
                <section>
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <StatCard 
                            title="Доход сегодня" 
                            value={`${metrics.revenueToday.toFixed(2)} USDT`} 
                            icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01" /></svg>}
                        />
                        <StatCard 
                            title="Продажи сегодня" 
                            value={metrics.salesToday} 
                            colorClass="text-white"
                            icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
                        />
                        <StatCard 
                            title="Визиты в профиль" 
                            value={metrics.profileVisitsToday} 
                            colorClass="text-white"
                            icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>}
                        />
                     </div>
                </section>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Actionable Items */}
                    <section>
                        <h2 className="text-xl font-bold text-white mb-4">Срочные задачи</h2>
                        <div className="space-y-3">
                            {actionableItems.length > 0 ? actionableItems.map(item => (
                                <button key={item.id} onClick={() => handleActionClick(item.linkTo, item.entityId)} className={`w-full text-left p-4 rounded-lg transition-colors border hover:bg-brand-border/50 ${getActionableItemStyle(item.type)}`}>
                                    <p className="font-semibold">{item.text}</p>
                                </button>
                            )) : (
                                <div className="p-8 text-center bg-brand-surface rounded-lg">
                                    <p className="text-brand-text-secondary">Отлично, срочных задач нет!</p>
                                </div>
                            )}
                        </div>
                    </section>
                    
                    {/* Recent Activity */}
                    <section>
                        <h2 className="text-xl font-bold text-white mb-4">Последняя активность</h2>
                         <div className="space-y-3">
                            {recentActivity.length > 0 ? recentActivity.map((activity) => (
                                 <div key={activity.id} className="bg-brand-surface p-4 rounded-lg">
                                     <div className="flex items-start gap-4">
                                        <span className="text-2xl">{activity.icon}</span>
                                        <div className="flex-1">
                                            {activity.type === 'wishlist_add' && activity.user && activity.product ? (
                                                <p className="text-brand-text-primary">
                                                    Пользователь <span className="font-bold text-white">{activity.user.name}</span> добавил ваш товар <span className="font-bold text-white">"{activity.product.name}"</span> в избранное.
                                                </p>
                                            ) : (
                                                 <p className="text-brand-text-primary">{activity.text}</p>
                                            )}
                                           
                                            <p className="text-xs text-brand-text-secondary mt-1">{activity.time}</p>
                                        </div>
                                     </div>
                                      {activity.type === 'wishlist_add' && activity.user && activity.product && (
                                        <div className="mt-3 text-right">
                                            <button onClick={() => handleSendOffer(activity.user!, activity.product!)} className="bg-brand-secondary hover:bg-brand-primary-hover text-white font-semibold py-1.5 px-3 rounded-lg text-sm">
                                                Предложить скидку
                                            </button>
                                        </div>
                                    )}
                                 </div>
                            )) : (
                                 <div className="p-8 text-center bg-brand-surface rounded-lg">
                                    <p className="text-brand-text-secondary">Пока нет никакой активности.</p>
                                </div>
                            )}
                        </div>
                    </section>
                </div>
            </div>
            {offerTarget && (
                <OfferModal
                    isOpen={!!offerTarget}
                    onClose={() => setOfferTarget(null)}
                    recipient={offerTarget.user}
                    product={offerTarget.product}
                />
            )}
        </>
    );
};

export default DashboardTab;