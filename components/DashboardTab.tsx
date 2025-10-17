import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { useAuth } from '../hooks/useAuth';
import { apiService } from '../services/apiService';
import type { Order } from '../types';
import Spinner from './Spinner';
import DynamicIcon from './DynamicIcon';

const KpiCard: React.FC<{ title: string, value: string | number, trend: 'up' | 'down', trendValue: string, iconUrl: string }> = ({ title, value, trend, trendValue, iconUrl }) => (
    <article className="kpi-card">
        <div className="kpi-meta">
            <span className="kpi-label">{title}</span>
            <span className="kpi-value">{value}</span>
        </div>
        <span className={`kpi-trend ${trend}`}>
            <img src={trend === 'up' ? "https://api.iconify.design/lucide-trending-up.svg" : "https://api.iconify.design/lucide-trending-down.svg"} alt={trend === 'up' ? "Рост" : "Снижение"} />
            {trendValue}
        </span>
    </article>
);


const DashboardTab: React.FC = () => {
    const { user } = useAuth();
    const [sales, setSales] = React.useState<Order[]>([]);
    const [purchases, setPurchases] = React.useState<Order[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);

    React.useEffect(() => {
        const fetchData = async () => {
            if (!user) return;
            setIsLoading(true);
            try {
                const [salesData, purchasesData] = await Promise.all([
                    apiService.getSalesBySellerId(),
                    apiService.getPurchasesByBuyerId(),
                ]);
                setSales(salesData);
                setPurchases(purchasesData);
            } catch (error) {
                console.error("Failed to fetch dashboard data:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [user]);
    
    const { totalSales, totalPurchases, salesChartData, revenueChartData } = useMemo(() => {
        const monthlySales: Record<string, number> = {};
        const monthlyRevenue: Record<string, number> = {};

        sales.forEach(order => {
            const month = new Date(order.orderDate).toLocaleString('ru-RU', { month: 'short' });
            monthlySales[month] = (monthlySales[month] || 0) + 1;
            monthlyRevenue[month] = (monthlyRevenue[month] || 0) + order.total;
        });

        const monthNames = ["янв", "фев", "мар", "апр", "май", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"];
        
        const finalSalesData = monthNames.map(month => ({
            name: month,
            Sales: monthlySales[month] || 0,
        }));

        const finalRevenueData = monthNames.map(month => ({
            name: month,
            Sales: monthlySales[month] || 0,
            Revenue: monthlyRevenue[month] || 0,
        }));
        
        return { 
            totalSales: sales.length, 
            totalPurchases: purchases.length, 
            salesChartData: finalSalesData, 
            revenueChartData: finalRevenueData 
        };
    }, [sales, purchases]);

    if (isLoading) {
        return <div className="flex justify-center py-16"><Spinner size="lg"/></div>;
    }

    return (
        <div className="space-y-2">
            <div className="summary-grid">
                <KpiCard title="Всего покупок" value={totalPurchases} trend="down" trendValue="-9.05%" iconUrl="https://api.iconify.design/lucide-shopping-bag.svg" />
                <KpiCard title="Всего продаж" value={totalSales} trend="up" trendValue="+11.01%" iconUrl="https://api.iconify.design/lucide-receipt-russian-ruble.svg" />
            </div>
            <div className="charts-grid">
                <article className="chart-card">
                    <div className="card-head">
                        <strong className="card-title">Продажи за месяц</strong>
                    </div>
                    <div className="h-56">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={salesChartData} margin={{ top: 20, right: 10, left: -20, bottom: 5 }}>
                                <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={12} />
                                <YAxis axisLine={false} tickLine={false} fontSize={12} />
                                <Tooltip cursor={{fill: 'rgba(255,251,235,0.8)'}} contentStyle={{backgroundColor: '#fff', border: '1px solid #fef3c7', borderRadius: '0.75rem'}} />
                                <Bar dataKey="Sales" radius={[5, 5, 0, 0]}>
                                    <Cell fill="oklch(var(--p))" />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </article>
                <article className="chart-card">
                    <div className="card-head">
                        <strong className="card-title">Статистика</strong>
                    </div>
                     <div className="h-56">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={revenueChartData} margin={{ top: 20, right: 10, left: -20, bottom: 5 }}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="oklch(var(--p))" stopOpacity={0.8}/>
                                        <stop offset="95%" stopColor="oklch(var(--p))" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={12} />
                                <YAxis axisLine={false} tickLine={false} fontSize={12} />
                                <Tooltip contentStyle={{backgroundColor: '#fff', border: '1px solid #fef3c7', borderRadius: '0.75rem'}} />
                                <Area type="monotone" dataKey="Revenue" stroke="oklch(var(--p))" fillOpacity={1} fill="url(#colorRevenue)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </article>
            </div>
            <article className="list-card">
                <div className="card-head">
                    <strong className="card-title">Последние заказы</strong>
                    <span className="muted">{sales.length}</span>
                </div>
                {sales.length === 0 ? (
                    <div className="empty">
                        <div>
                            <img src="https://api.iconify.design/lucide-inbox.svg" alt="Пусто" />
                            <strong>Недавних продаж нет.</strong>
                            <span className="muted">Как только появятся новые заказы, они отобразятся здесь.</span>
                        </div>
                    </div>
                ): (
                    <div className="overflow-x-auto">
                        {/* A simplified table can be rendered here if needed */}
                         <p className="text-sm text-center text-base-content/70">Подробная информация о продажах доступна на вкладке "Мои продажи".</p>
                    </div>
                )}
            </article>
        </div>
    );
};

export default DashboardTab;