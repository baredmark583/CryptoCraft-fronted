import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { VectorMap } from "@react-jvectormap/core";
import { worldMill } from "@react-jvectormap/world";

import { useAuth } from '../hooks/useAuth';
import { apiService } from '../services/apiService';
import type { Order } from '../types';
import Spinner from '../components/Spinner';

// --- Local Components ---

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; change?: number; }> = ({ title, value, icon, change }) => (
    <div className="card bg-base-100 border border-base-300 shadow-lg">
        <div className="card-body">
            <div className="flex items-center justify-center w-12 h-12 bg-base-200 rounded-xl mb-4">
                {icon}
            </div>
            <span className="text-sm text-base-content/70">{title}</span>
            <h4 className="text-2xl font-bold text-base-content">{value}</h4>
            {change !== undefined && (
                <div className={`badge ${change >= 0 ? 'badge-success' : 'badge-error'} gap-1`}>
                    {change >= 0 ? '▲' : '▼'}
                    {change.toFixed(2)}%
                </div>
            )}
        </div>
    </div>
);

const RecentOrdersTable: React.FC<{ sales: Order[] }> = ({ sales }) => {
    if (sales.length === 0) {
        return <p className="text-base-content/70 text-center py-8">Недавних продаж нет.</p>;
    }

    return (
        <div className="overflow-x-auto">
            <table className="table">
                <thead>
                    <tr>
                        <th>Товар</th>
                        <th>Покупатель</th>
                        <th>Сумма</th>
                        <th>Статус</th>
                    </tr>
                </thead>
                <tbody>
                    {sales.slice(0, 5).map(order => {
                        const product = order.items[0].product;
                        return (
                            <tr key={order.id} className="hover">
                                <td>
                                    <div className="flex items-center gap-3">
                                        <div className="avatar">
                                            <div className="mask mask-squircle w-12 h-12">
                                                <img src={product.imageUrls[0]} alt={product.title} />
                                            </div>
                                        </div>
                                        <div>
                                            <div className="font-bold">{product.title}</div>
                                            <div className="text-sm opacity-50">{product.category}</div>
                                        </div>
                                    </div>
                                </td>
                                <td>{order.buyer.name}</td>
                                <td>{order.total.toFixed(2)} USDT</td>
                                <td><span className="badge badge-ghost badge-sm">{order.status}</span></td>
                            </tr>
                        )
                    })}
                </tbody>
            </table>
        </div>
    );
};


const DashboardPage: React.FC = () => {
    const { user } = useAuth();
    const [sales, setSales] = useState<Order[]>([]);
    const [purchases, setPurchases] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
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

    // Mock data for charts
    const salesChartData = [
        { name: "Jan", Sales: 168 }, { name: "Feb", Sales: 385 }, { name: "Mar", Sales: 201 },
        { name: "Apr", Sales: 298 }, { name: "May", Sales: 187 }, { name: "Jun", Sales: 195 },
        { name: "Jul", Sales: 291 }, { name: "Aug", Sales: 110 }, { name: "Sep", Sales: 215 },
        { name: "Oct", Sales: 390 }, { name: "Nov", Sales: 280 }, { name: "Dec", Sales: 112 },
    ];

    const revenueChartData = [
        { name: "Jan", Sales: 180, Revenue: 40 }, { name: "Feb", Sales: 190, Revenue: 30 },
        { name: "Mar", Sales: 170, Revenue: 50 }, { name: "Apr", Sales: 160, Revenue: 40 },
        { name: "May", Sales: 175, Revenue: 55 }, { name: "Jun", Sales: 165, Revenue: 40 },
        { name: "Jul", Sales: 170, Revenue: 70 }, { name: "Aug", Sales: 205, Revenue: 100 },
        { name: "Sep", Sales: 230, Revenue: 110 }, { name: "Oct", Sales: 210, Revenue: 120 },
        { name: "Nov", Sales: 240, Revenue: 150 }, { name: "Dec", Sales: 235, Revenue: 140 },
    ];
    
    if (isLoading) {
        return <div className="flex justify-center py-16"><Spinner size="lg"/></div>;
    }

    return (
        <div>
            <h1 className="text-3xl font-bold text-white mb-6">Панель управления</h1>
            <div className="grid grid-cols-12 gap-4 md:gap-6">
                <div className="col-span-12 space-y-6 xl:col-span-8">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6">
                        <StatCard title="Всего покупок" value={purchases.length} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>} change={-9.05} />
                        <StatCard title="Всего продаж" value={sales.length} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>} change={11.01} />
                    </div>
                    <div className="card bg-base-100 border border-base-300 shadow-lg p-4 sm:p-6">
                        <h3 className="card-title text-lg mb-4">Продажи за месяц</h3>
                        <div className="h-48">
                             <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={salesChartData}>
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={12} />
                                    <Tooltip cursor={{fill: 'rgba(255,255,255,0.1)'}} contentStyle={{backgroundColor: '#3d4451', border: 'none', borderRadius: '0.5rem'}} />
                                    <Bar dataKey="Sales" radius={[5, 5, 0, 0]}>
                                        <Cell fill="oklch(80% 0.114 19.571)" />
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
                <div className="col-span-12 xl:col-span-4">
                     <div className="card bg-base-100 border border-base-300 shadow-lg p-4 sm:p-6 h-full">
                        <h3 className="card-title text-lg mb-4">Демография клиентов</h3>
                        <div className="h-64 w-full">
                             <VectorMap
                                map={worldMill}
                                backgroundColor="transparent"
                                regionStyle={{
                                    initial: { fill: "oklch(84.133% 0.065 90.856)" }, // base-300
                                    hover: { fill: "oklch(80% 0.114 19.571)" }, // primary
                                }}
                                markerStyle={{ initial: { fill: "oklch(92% 0.084 155.995)" } as any }} // secondary
                                markers={[{ latLng: [48.37, 31.16], name: "Ukraine" }]}
                                zoomOnScroll={false}
                                containerClassName="h-full w-full"
                            />
                        </div>
                    </div>
                </div>
                <div className="col-span-12">
                     <div className="card bg-base-100 border border-base-300 shadow-lg p-4 sm:p-6">
                        <h3 className="card-title text-lg mb-4">Статистика</h3>
                        <div className="h-80">
                             <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={revenueChartData}>
                                    <defs>
                                        <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="oklch(80% 0.114 19.571)" stopOpacity={0.8}/>
                                            <stop offset="95%" stopColor="oklch(80% 0.114 19.571)" stopOpacity={0}/>
                                        </linearGradient>
                                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="oklch(92% 0.084 155.995)" stopOpacity={0.8}/>
                                            <stop offset="95%" stopColor="oklch(92% 0.084 155.995)" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={12} />
                                    <YAxis axisLine={false} tickLine={false} fontSize={12} />
                                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2}/>
                                    <Tooltip contentStyle={{backgroundColor: '#3d4451', border: 'none', borderRadius: '0.5rem'}} />
                                    <Area type="monotone" dataKey="Sales" stroke="oklch(80% 0.114 19.571)" fillOpacity={1} fill="url(#colorSales)" />
                                    <Area type="monotone" dataKey="Revenue" stroke="oklch(92% 0.084 155.995)" fillOpacity={1} fill="url(#colorRevenue)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
                <div className="col-span-12">
                    <div className="card bg-base-100 border border-base-300 shadow-lg p-4 sm:p-6">
                         <h3 className="card-title text-lg mb-4">Последние заказы</h3>
                         <RecentOrdersTable sales={sales} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;
