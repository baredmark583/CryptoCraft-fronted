import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { useAuth } from '../hooks/useAuth';
import { apiService } from '../services/apiService';
import type { Order } from '../types';
import Spinner from './Spinner';

const KpiCard: React.FC<{ title: string, value: string | number, trend: 'up' | 'down', trendValue: string }> = ({ title, value, trend, trendValue }) => (
    <article className="flex items-center justify-between gap-3 p-3 rounded-xl border border-amber-200/80 bg-white">
        <div className="flex flex-col gap-0.5">
            <span className="text-sm text-amber-800/80">{title}</span>
            <span className="font-extrabold text-amber-900 text-2xl leading-tight font-manrope">{value}</span>
        </div>
        <span className={`inline-flex items-center gap-1.5 px-2 py-1.5 rounded-full font-bold text-sm border ${trend === 'up' ? 'text-white bg-green-500 border-green-500' : 'text-white bg-red-500 border-red-500'}`}>
            <img src={trend === 'up' ? "https://api.iconify.design/lucide-trending-up.svg" : "https://api.iconify.design/lucide-trending-down.svg"} alt={trend === 'up' ? "Рост" : "Снижение"} className="w-4 h-4" />
            {trendValue}
        </span>
    </article>
);


const SummaryDashboardTab: React.FC = () => {
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                <KpiCard title="Всего покупок" value={totalPurchases} trend="down" trendValue="-9.05%" />
                <KpiCard title="Всего продаж" value={totalSales} trend="up" trendValue="+11.01%" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-3 mb-3">
                <article className="p-3 rounded-xl border border-amber-200/80 bg-white">
                    <div className="flex items-center justify-between gap-2 mb-2">
                        <strong className="font-bold text-amber-900 font-manrope">Продажи за месяц</strong>
                    </div>
                    <div className="h-56">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={salesChartData} margin={{ top: 20, right: 10, left: -20, bottom: 5 }}>
                                <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={12} />
                                <YAxis axisLine={false} tickLine={false} fontSize={12} />
                                <Tooltip cursor={{fill: 'rgba(255,251,235,0.8)'}} contentStyle={{backgroundColor: '#fff', border: '1px solid #fef3c7', borderRadius: '0.75rem'}} />
                                <Bar dataKey="Sales" radius={[5, 5, 0, 0]}>
                                    <Cell fill="#f59e0b" />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </article>
                <article className="p-3 rounded-xl border border-amber-200/80 bg-white">
                    <div className="flex items-center justify-between gap-2 mb-2">
                        <strong className="font-bold text-amber-900 font-manrope">Выручка</strong>
                    </div>
                     <div className="h-56">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={revenueChartData} margin={{ top: 20, right: 10, left: -20, bottom: 5 }}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={12} />
                                <YAxis axisLine={false} tickLine={false} fontSize={12} />
                                <Tooltip contentStyle={{backgroundColor: '#fff', border: '1px solid #fef3c7', borderRadius: '0.75rem'}} />
                                <Area type="monotone" dataKey="Revenue" stroke="#f59e0b" fillOpacity={1} fill="url(#colorRevenue)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </article>
            </div>
            <article className="p-3 rounded-xl border border-amber-200/80 bg-white">
                <div className="flex items-center justify-between gap-2 mb-2">
                    <strong className="font-bold text-amber-900 font-manrope">Последние заказы</strong>
                    <span className="text-sm text-amber-900/80">{sales.length}</span>
                </div>
                {sales.length === 0 ? (
                    <div className="grid place-items-center p-5 rounded-lg border-dashed border-amber-100 bg-amber-50 text-amber-950/90 text-center">
                        <div className="flex flex-col items-center gap-2 max-w-lg">
                            <img src="https://api.iconify.design/lucide-inbox.svg" alt="Пусто" className="w-5 h-5 opacity-90" />
                            <strong className="font-bold">Недавних продаж нет.</strong>
                            <span className="text-sm text-amber-900/80">Как только появятся новые заказы, они отобразятся здесь.</span>
                        </div>
                    </div>
                ): (
                    <div className="overflow-x-auto">
                         <p className="text-sm text-center text-base-content/70">Подробная информация о продажах доступна на вкладке "Мои продажи".</p>
                    </div>
                )}
            </article>
        </div>
    );
};

export default SummaryDashboardTab;