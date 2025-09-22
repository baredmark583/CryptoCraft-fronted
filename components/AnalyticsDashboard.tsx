import React, { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/apiService';
import { geminiService } from '../services/geminiService';
import type { SellerAnalytics, TimeSeriesDataPoint, AiInsight } from '../types';
import Spinner from './Spinner';
import { Link } from 'react-router-dom';

const StatCard: React.FC<{title: string, value: string | number, icon: JSX.Element}> = ({title, value, icon}) => (
    <div className="bg-brand-surface p-6 rounded-lg flex items-center gap-4">
        <div className="bg-brand-primary/20 text-brand-primary p-3 rounded-full">{icon}</div>
        <div>
            <p className="text-sm text-brand-text-secondary">{title}</p>
            <p className="text-2xl font-bold text-white">{value}</p>
        </div>
    </div>
);

const BarChart: React.FC<{ data: TimeSeriesDataPoint[], label: string, colorClass: string }> = ({ data, label, colorClass }) => {
    if (!data || data.length === 0) return <div className="flex items-center justify-center h-48 bg-brand-background/50 rounded-lg"><p className="text-brand-text-secondary">Нет данных</p></div>;
    
    const chartHeight = 150;
    const maxValue = Math.max(...data.map(d => d.value), 1);
    
    return (
        <div className="w-full h-48 flex items-end gap-1 px-2" aria-label={label}>
            {data.map((d) => {
                const barHeight = (d.value / maxValue) * 100;
                return (
                    <div key={d.date} className="flex-1 group flex flex-col items-center">
                        <div className="text-xs text-brand-text-secondary opacity-0 group-hover:opacity-100 transition-opacity">{d.value}</div>
                        <div
                            style={{ height: `${barHeight}%` }}
                            className={`${colorClass} w-full rounded-t-sm transition-all duration-300 group-hover:opacity-100 opacity-80`}
                        >
                           <div className="sr-only">{`${d.date}: ${d.value}`}</div>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

const DonutChart: React.FC<{ data: { source: string, visits: number }[] }> = ({ data }) => {
    const colors = ['#F97316', '#FB923C', '#FDBA74', '#FED7AA'];
    const total = data.reduce((sum, item) => sum + item.visits, 0);
    if (total === 0) return <div className="flex items-center justify-center h-full"><p className="text-brand-text-secondary">Нет данных о трафике</p></div>;

    let cumulativePercent = 0;
    const segments = data.map((item, index) => {
        const percent = item.visits / total;
        const dashArray = 2 * Math.PI * 20; // Circumference of circle with r=20
        const dashOffset = dashArray * (1 - cumulativePercent);
        const strokeDasharray = `${percent * dashArray} ${dashArray * (1 - percent)}`;
        
        const segment = {
            ...item,
            color: colors[index % colors.length],
            strokeDasharray,
            dashOffset
        };
        cumulativePercent += percent;
        return segment;
    });

    return (
        <div className="flex flex-col md:flex-row items-center gap-6 p-4">
             <svg viewBox="0 0 50 50" className="w-32 h-32 transform -rotate-90">
                 {segments.map((s, i) => (
                    <circle
                        key={i}
                        cx="25"
                        cy="25"
                        r="20"
                        fill="transparent"
                        stroke={s.color}
                        strokeWidth="8"
                        strokeDasharray={s.strokeDasharray}
                        strokeDashoffset={s.dashOffset}
                    >
                        <title>{`${s.source}: ${s.visits} (${((s.visits/total)*100).toFixed(1)}%)`}</title>
                    </circle>
                 ))}
            </svg>
            <ul className="text-sm w-full">
                {segments.map(s => (
                    <li key={s.source} className="flex items-center gap-2 mb-2">
                        <span className="w-3 h-3 rounded-full" style={{backgroundColor: s.color}}></span>
                        <span className="text-brand-text-primary">{s.source}</span>
                        <span className="text-brand-text-secondary ml-auto font-semibold">{s.visits}</span>
                    </li>
                ))}
            </ul>
        </div>
    )
}

const AiAssistant: React.FC<{ analyticsData: SellerAnalytics }> = ({ analyticsData }) => {
    const [insights, setInsights] = useState<AiInsight[] | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const getInsights = async () => {
        setIsLoading(true);
        setError('');
        try {
            const result = await geminiService.getAnalyticsInsights(analyticsData);
            setInsights(result);
        } catch (err: any) {
            setError(err.message || 'Не удалось получить советы.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const insightIcons: Record<AiInsight['type'], JSX.Element> = {
        OPTIMIZATION: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-sky-400"><path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-1.007 1.11-1.226l.554-.226c.46-.188.98-.188 1.44 0l.554.226c.55.219 1.02.684 1.11 1.226l.092.548c.097.572.359 1.096.776 1.486l.446.417c.414.39.999.551 1.581.43l.564-.18a1.875 1.875 0 012.164 1.62l.063.56c.053.476-.026 1.003-.32 1.442l-.298.445c-.37.552-.37 1.34 0 1.892l.298.445c.294.44.372.966.32 1.442l-.063.56a1.875 1.875 0 01-2.164 1.62l-.564-.18c-.582-.121-1.167.04-1.581.43l-.446.417c-.417.39-.679.914-.776 1.486l-.092.548c-.09.542-.56 1.007-1.11 1.226l-.554-.226c-.46.188-.98-.188-1.44 0l-.554-.226c-.55-.219-1.02-.684-1.11-1.226l-.092-.548c-.097-.572-.359-1.096-.776-1.486l-.446-.417c-.414-.39-.999-.551-1.581-.43l-.564-.18a1.875 1.875 0 01-2.164-1.62l-.063-.56c-.053-.476.026-1.003.32-1.442l.298-.445c.37-.552-.37-1.34 0-1.892l-.298-.445c-.294-.44-.372-.966-.32-1.442l.063-.56a1.875 1.875 0 012.164-1.62l.564.18c.582.121 1.167.04 1.581.43l.446.417c.417.39.679.914-.776-1.486l.092-.548z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
        OPPORTUNITY: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-green-400"><path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.311l-3.75 0m3.75-7.478c.097-.057.195-.112.292-.169m-1.478-.31c.206-.102.413-.205.625-.307m2.458-1.135a3.001 3.001 0 00-3.75 0m3.75 0a3.001 3.001 0 01-3.75 0m-3.75 0c-.097.057-.195.112-.292.169m1.478.31c-.206.102-.413.205-.625.307m-2.458 1.135a3.001 3.001 0 013.75 0m-3.75 0a3.001 3.001 0 003.75 0" /></svg>,
        WARNING: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-yellow-400"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>,
    };

    return (
        <div className="bg-brand-surface p-6 rounded-lg border-l-4 border-brand-primary">
            <h2 className="text-2xl font-bold text-white mb-2">🤖 Ваш AI-Аналитик</h2>
            <p className="text-brand-text-secondary mb-4">Получите персональные советы по увеличению продаж на основе ваших данных.</p>
            
            {!insights && !isLoading && (
                <button onClick={getInsights} className="bg-brand-primary hover:bg-brand-primary-hover text-white font-bold py-2 px-6 rounded-lg transition-colors">
                    Получить советы
                </button>
            )}

            {isLoading && <div className="flex justify-center py-4"><Spinner/></div>}
            
            {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
            
            {insights && (
                <div className="space-y-4 mt-4 animate-fade-in-down">
                    {insights.map((insight, index) => (
                        <div key={index} className="bg-brand-background/50 p-4 rounded-md flex items-start gap-4">
                            <div className="flex-shrink-0 mt-1">{insightIcons[insight.type]}</div>
                            <div>
                                <h4 className="font-bold text-white">{insight.title}</h4>
                                <p className="text-sm text-brand-text-primary">{insight.recommendation}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};


const AnalyticsDashboard: React.FC<{ sellerId: string }> = ({ sellerId }) => {
    const [analytics, setAnalytics] = useState<SellerAnalytics | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [period, setPeriod] = useState<'7d' | '30d' | 'all'>('30d');

    const fetchAnalytics = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await apiService.getSellerAnalytics(sellerId, period);
            setAnalytics(data);
        } catch (error) {
            console.error("Failed to fetch analytics:", error);
        } finally {
            setIsLoading(false);
        }
    }, [sellerId, period]);

    useEffect(() => {
        fetchAnalytics();
    }, [fetchAnalytics]);

    const PeriodButton: React.FC<{ value: '7d' | '30d' | 'all', label: string }> = ({ value, label }) => (
        <button onClick={() => setPeriod(value)} className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${period === value ? 'bg-brand-primary text-white' : 'text-brand-text-secondary hover:bg-brand-surface'}`}>
            {label}
        </button>
    );

    if (isLoading) {
        return <div className="flex justify-center py-16"><Spinner /></div>
    }

    if (!analytics) {
        return <div className="text-center py-16 bg-brand-surface rounded-lg"><p className="text-brand-text-secondary">Не удалось загрузить аналитику.</p></div>;
    }

    return (
        <div className="space-y-6">
            <AiAssistant analyticsData={analytics} />

            <div className="bg-brand-surface/50 rounded-lg p-2 flex flex-wrap justify-center gap-2">
                <PeriodButton value="7d" label="7 дней" />
                <PeriodButton value="30d" label="30 дней" />
                <PeriodButton value="all" label="Всё время" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                 <StatCard title="Визиты в профиль" value={analytics.profileVisits} icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-4.663M12 3.375c-1.621 0-3.204.64-4.498 1.688M12 3.375c1.621 0 3.204.64 4.498 1.688M12 3.375V9m-4.498 3.375l-1.5-1.5m1.5 1.5l1.5-1.5m-1.5 1.5V15m3.75-6.375l-1.5-1.5m1.5 1.5l1.5-1.5m-1.5 1.5V15" /></svg>} />
                 <StatCard title="Просмотры товаров" value={analytics.totalProductViews} icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>} />
                 <StatCard title="Всего продаж" value={analytics.totalSales} icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c.51 0 .962-.328 1.093-.828l2.842-7.094a.75.75 0 00-.143-.882zM7.5 14.25L5.106 5.165A.75.75 0 004.269 4.5H2.25" /></svg>} />
                 <StatCard title="Конверсия" value={`${analytics.conversionRate}%`} icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-3.75-.625m3.75.625V18" /></svg>} />
            </div>

             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-brand-surface p-6 rounded-lg">
                    <h3 className="text-lg font-bold text-white mb-4">Динамика продаж</h3>
                    <BarChart data={analytics.salesOverTime} label="График продаж" colorClass="bg-brand-primary" />
                </div>
                 <div className="bg-brand-surface p-6 rounded-lg">
                    <h3 className="text-lg font-bold text-white mb-4">Динамика просмотров</h3>
                     <BarChart data={analytics.viewsOverTime} label="График просмотров" colorClass="bg-sky-500" />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-3 bg-brand-surface p-6 rounded-lg">
                     <h3 className="text-lg font-bold text-white mb-4">Самые популярные товары</h3>
                     <div className="space-y-4">
                         {analytics.topProducts.map(product => (
                             <div key={product.id} className="flex items-center gap-4">
                                <img src={product.imageUrl} alt={product.title} className="w-16 h-16 rounded-md object-cover"/>
                                <div className="flex-1">
                                    <Link to={`/product/${product.id}`} className="font-semibold text-white hover:text-brand-primary truncate block">{product.title}</Link>
                                    <div className="flex gap-4 text-xs text-brand-text-secondary">
                                        <span>Просмотров: {product.views}</span>
                                        <span>Продаж: {product.sales}</span>
                                    </div>
                                </div>
                             </div>
                         ))}
                     </div>
                </div>
                <div className="lg:col-span-2 bg-brand-surface p-6 rounded-lg">
                    <h3 className="text-lg font-bold text-white mb-4">Источники трафика</h3>
                    <DonutChart data={analytics.trafficSources} />
                </div>
            </div>

        </div>
    );
};

export default AnalyticsDashboard;
