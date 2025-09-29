import React, { useMemo, useState } from 'react';
import type { User, Product } from '../types';
import { Link } from 'react-router-dom';
import type { ProfileTab } from '../pages/ProfilePage';
import AuthenticationRequestModal from './AuthenticationRequestModal';

interface ElectronicsDashboardTabProps {
    user: User;
    products: Product[];
    onProductUpdate: (updatedProduct: Product) => void;
    setActiveTab: (tab: ProfileTab) => void;
}

const StatCard: React.FC<{ title: string; value: string; icon: React.ReactElement }> = ({ title, value, icon }) => (
    <div className="bg-brand-surface p-6 rounded-lg flex items-center gap-4">
        <div className="bg-brand-primary/20 text-brand-primary p-3 rounded-full">{icon}</div>
        <div>
            <p className="text-sm text-brand-text-secondary">{title}</p>
            <p className="text-2xl font-bold text-white">{value}</p>
        </div>
    </div>
);

const ElectronicsDashboardTab: React.FC<ElectronicsDashboardTabProps> = ({ user, products, onProductUpdate, setActiveTab }) => {
    const [authenticatingProduct, setAuthenticatingProduct] = useState<Product | null>(null);

    const electronicsStats = useMemo(() => {
        const electronicsProducts = products.filter(p => p.category === 'Электроника');
        const totalValue = electronicsProducts.reduce((sum, p) => sum + (p.price || 0), 0);
        const pendingAuthentication = electronicsProducts.filter(p => p.authenticationStatus === 'PENDING').length;
        const needsAuthentication = electronicsProducts.filter(p => p.isAuthenticationAvailable && p.authenticationStatus === 'NONE');

        return {
            totalValue,
            pendingAuthentication,
            needsAuthentication,
        };
    }, [products]);

    // This is a mock; in a real app, this would come from order history
    const recentlySold = useMemo(() => {
        return products.filter(p => p.category === 'Электроника').slice(0, 2).map(p => ({
            ...p,
            profit: ((p.price || 0) * 0.9) - (p.purchaseCost || (p.price || 0) * 0.7) // Mock profit calculation
        }));
    }, [products]);


    return (
        <>
            <div className="space-y-8 animate-fade-in-down">
                <section>
                    <h2 className="text-2xl font-bold text-white mb-4">Сводка по электронике</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <StatCard 
                            title="Общая стоимость" 
                            value={`${electronicsStats.totalValue.toFixed(2)} USDT`}
                            icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01" /></svg>}
                        />
                        <StatCard 
                            title="На проверке" 
                            value={`${electronicsStats.pendingAuthentication} шт.`}
                            icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                        />
                         <StatCard 
                            title="Продано за 30 д." 
                            value={`${recentlySold.length} шт.`}
                            icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                        />
                    </div>
                </section>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">Управление аутентификацией</h2>
                        {electronicsStats.needsAuthentication.length > 0 ? (
                             <div className="space-y-3">
                                {electronicsStats.needsAuthentication.map(product => (
                                    <div key={product.id} className="bg-brand-surface p-3 rounded-lg flex items-center gap-4">
                                        <img src={product.imageUrls[0]} alt={product.title} className="w-12 h-12 object-cover rounded-md flex-shrink-0" />
                                        <div className="flex-grow">
                                            <p className="font-semibold text-white truncate">{product.title}</p>
                                            <p className="text-xs text-brand-text-secondary">Требуется проверка</p>
                                        </div>
                                        <button onClick={() => setAuthenticatingProduct(product)} className="flex-shrink-0 bg-sky-600 hover:bg-sky-700 text-white font-bold py-2 px-3 rounded-lg text-sm">
                                            Запросить
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-brand-surface p-6 rounded-lg text-center">
                                <p className="text-brand-text-secondary">Нет товаров, ожидающих запроса на проверку.</p>
                            </div>
                        )}
                    </section>
                    <section>
                         <h2 className="text-2xl font-bold text-white mb-4">Недавние продажи</h2>
                         {recentlySold.length > 0 ? (
                            <div className="space-y-3">
                                {recentlySold.map(product => (
                                    <div key={product.id} className="bg-brand-surface p-3 rounded-lg flex items-center gap-4">
                                        <img src={product.imageUrls[0]} alt={product.title} className="w-12 h-12 object-cover rounded-md flex-shrink-0" />
                                        <div className="flex-grow">
                                            <p className="font-semibold text-white truncate">{product.title}</p>
                                            <p className="text-xs text-brand-text-secondary">Продано за {(product.price || 0).toFixed(2)} USDT</p>
                                        </div>
                                        <div className="text-right flex-shrink-0">
                                            <p className="font-bold text-green-400 text-lg">+{product.profit.toFixed(2)}</p>
                                            <p className="text-xs text-brand-text-secondary">Прибыль</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                         ) : (
                            <div className="bg-brand-surface p-6 rounded-lg text-center">
                                <p className="text-brand-text-secondary">Продаж электроники за последнее время не было.</p>
                            </div>
                         )}
                    </section>
                </div>
                 <section>
                    <h2 className="text-2xl font-bold text-white mb-4">Быстрые действия</h2>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <Link to="/create" className="flex-1 text-center bg-brand-primary hover:bg-brand-primary-hover text-white font-bold py-3 px-6 rounded-lg transition-colors">
                            + Разместить новый товар
                        </Link>
                        <button onClick={() => setActiveTab('listings')} className="flex-1 text-center bg-brand-surface hover:bg-brand-border text-white font-bold py-3 px-6 rounded-lg transition-colors">
                            Управлять товарами
                        </button>
                    </div>
                </section>
            </div>
            {authenticatingProduct && (
                 <AuthenticationRequestModal 
                    isOpen={!!authenticatingProduct} 
                    onClose={() => setAuthenticatingProduct(null)} 
                    product={authenticatingProduct} 
                    onUpdate={onProductUpdate} 
                />
            )}
        </>
    );
};

export default ElectronicsDashboardTab;