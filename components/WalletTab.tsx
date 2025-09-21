import React, { useState, useEffect } from 'react';
import type { Order, User } from '../types';
import { apiService } from '../services/apiService';
import Spinner from './Spinner';

interface WalletStats {
    totalEarned: number;
    pendingClearance: number;
}

const StatCard: React.FC<{ title: string; value: string; subtext?: string; colorClass?: string }> = ({ title, value, subtext, colorClass = 'text-white' }) => (
    <div className="bg-brand-background p-6 rounded-lg">
        <p className="text-sm text-brand-text-secondary">{title}</p>
        <p className={`text-3xl font-bold ${colorClass}`}>{value}</p>
        {subtext && <p className="text-xs text-brand-text-secondary mt-1">{subtext}</p>}
    </div>
);

const WalletTab: React.FC<{ user: User }> = ({ user }) => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [stats, setStats] = useState<WalletStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchSales = async () => {
            setIsLoading(true);
            try {
                // FIX: Removed user.id argument as the backend gets the user from the JWT token.
                const salesData = await apiService.getSalesBySellerId();
                setOrders(salesData.sort((a, b) => b.orderDate - a.orderDate)); // Sort by most recent

                const newStats: WalletStats = {
                    totalEarned: salesData
                        .filter(o => o.status === 'COMPLETED' || o.status === 'DELIVERED')
                        .reduce((sum, o) => sum + o.total, 0),
                    pendingClearance: salesData
                        .filter(o => o.status === 'SHIPPED')
                        .reduce((sum, o) => sum + o.total, 0),
                };
                setStats(newStats);

            } catch (error) {
                console.error("Failed to fetch sales data for wallet:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchSales();
    }, [user.id]);

    if (isLoading) {
        return <div className="flex justify-center py-16"><Spinner /></div>;
    }

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                    title="Доступно к выводу" 
                    value={`${user.balance.toFixed(2)} USDT`} 
                    colorClass="text-green-400"
                />
                <StatCard 
                    title="Ожидает поступления" 
                    value={`${(stats?.pendingClearance || 0).toFixed(2)} USDT`}
                    subtext="Отправленные, но не подтвержденные заказы"
                />
                 {user.commissionOwed > 0 && (
                     <StatCard 
                        title="Задолженность" 
                        value={`${user.commissionOwed.toFixed(2)} USDT`} 
                        subtext="Комиссия платформы"
                        colorClass="text-red-400"
                    />
                 )}
                 <StatCard 
                    title="Всего заработано" 
                    value={`${(stats?.totalEarned || 0).toFixed(2)} USDT`} 
                    subtext="Завершенные сделки"
                />
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
                <button className="flex-1 bg-brand-primary hover:bg-brand-primary-hover text-white font-bold py-3 px-6 rounded-lg transition-colors">
                    Вывести средства
                </button>
                 {user.commissionOwed > 0 && (
                    <button className="flex-1 bg-brand-secondary hover:bg-brand-primary text-white font-bold py-3 px-6 rounded-lg transition-colors">
                        Погасить задолженность
                    </button>
                 )}
            </div>

            <div>
                <h3 className="text-xl font-bold text-white mb-4">История операций</h3>
                <div className="bg-brand-surface rounded-lg">
                    {orders.length > 0 ? (
                        <ul className="divide-y divide-brand-border">
                            {orders.slice(0, 10).map(order => { // Show last 10 transactions
                                const isIncome = order.status === 'COMPLETED' || order.status === 'DELIVERED';
                                const profit = order.total - (order.items.reduce((sum, item) => sum + ((Number(item.product.purchaseCost) || 0) * item.quantity), 0)) - (order.total * 0.02);

                                return (
                                    <li key={order.id} className="p-4 flex justify-between items-center">
                                        <div>
                                            <p className="font-semibold text-white">Продажа заказа #{order.id.slice(-6)}</p>
                                            <p className="text-sm text-brand-text-secondary">{new Date(order.orderDate).toLocaleDateString()}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className={`font-bold text-lg ${isIncome ? 'text-green-400' : 'text-brand-text-secondary'}`}>
                                                {isIncome ? `+${profit.toFixed(2)}` : `${order.total.toFixed(2)}`} USDT
                                            </p>
                                             <p className="text-xs text-brand-text-secondary">{isIncome ? 'Прибыль' : order.status}</p>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    ) : (
                        <p className="p-8 text-center text-brand-text-secondary">Операций пока нет.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default WalletTab;
