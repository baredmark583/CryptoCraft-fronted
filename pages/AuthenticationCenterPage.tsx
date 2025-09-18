import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { apiService } from '../services/apiService';
import type { Order, OrderStatus, AuthenticationEvent, Product } from '../types';
import Spinner from '../components/Spinner';
import NFTCertificateModal from '../components/NFTCertificateModal';

const statusMap: Record<OrderStatus, { text: string; icon: string; }> = {
    'PAID': { text: 'Заказ оплачен', icon: '💰' },
    'SHIPPED_TO_EXPERT': { text: 'Отправлен в центр аутентификации', icon: '🚚' },
    'PENDING_AUTHENTICATION': { text: 'Принят экспертом на проверку', icon: '🔬' },
    'AUTHENTICATION_PASSED': { text: 'Проверка пройдена успешно', icon: '✅' },
    'NFT_ISSUED': { text: 'Выпущен NFT-сертификат', icon: '💎' },
    'AUTHENTICATION_FAILED': { text: 'Проверка не пройдена', icon: '❌' },
    'SHIPPED': { text: 'Отправлен покупателю', icon: '📦' },
    'DELIVERED': { text: 'Доставлен', icon: '🎉' },
    // Irrelevant statuses for this view
    'PENDING': { text: 'Ожидает оплаты', icon: '⏳' },
    'DISPUTED': { text: 'Открыт спор', icon: '⚖️' },
    'COMPLETED': { text: 'Завершен', icon: '🏁' },
    'CANCELLED': { text: 'Отменен', icon: '🚫' },
};

interface AuthenticationTimelineProps {
    order: Order;
    onViewNft: (product: Product) => void;
}

const AuthenticationTimeline: React.FC<AuthenticationTimelineProps> = ({ order, onViewNft }) => {
    const timelineSteps: OrderStatus[] = ['PAID', 'SHIPPED_TO_EXPERT', 'PENDING_AUTHENTICATION'];
    const finalStep = order.status === 'AUTHENTICATION_FAILED' ? 'AUTHENTICATION_FAILED' : 'AUTHENTICATION_PASSED';
    timelineSteps.push(finalStep);
    
    if (finalStep === 'AUTHENTICATION_PASSED') {
        timelineSteps.push('NFT_ISSUED', 'SHIPPED', 'DELIVERED');
    }

    const eventsByStatus = order.authenticationEvents?.reduce((acc, event) => {
        acc[event.status] = event;
        return acc;
    }, {} as Record<OrderStatus, AuthenticationEvent>) || {};

    const lastEventIndex = order.authenticationEvents ? timelineSteps.indexOf(order.authenticationEvents[order.authenticationEvents.length - 1].status) : -1;

    return (
        <ol className="relative border-l-2 border-brand-border ml-4">
            {timelineSteps.map((status, index) => {
                const event = eventsByStatus[status];
                const isCompleted = !!event;
                const isCurrent = index === lastEventIndex;

                return (
                    <li key={status} className="mb-10 ml-8">
                        <span className={`absolute flex items-center justify-center w-8 h-8 rounded-full -left-4 ring-4 ring-brand-background ${isCompleted ? 'bg-brand-primary' : 'bg-brand-border'}`}>
                            <span className="text-lg">{statusMap[status].icon}</span>
                        </span>
                        <div className={`p-4 rounded-lg border ${isCurrent ? 'border-brand-primary shadow-lg shadow-brand-primary/10' : 'border-brand-border/50'} ${isCompleted ? 'bg-brand-surface' : 'bg-brand-surface/50'}`}>
                             <h3 className={`text-lg font-semibold ${isCompleted ? 'text-white' : 'text-brand-text-secondary'}`}>{statusMap[status].text}</h3>
                             {isCompleted && event ? (
                                <>
                                    <time className="block mb-2 text-sm font-normal leading-none text-brand-text-secondary">
                                        {new Date(event.timestamp).toLocaleString()}
                                    </time>
                                    {event.comment && (
                                        <p className="p-3 text-sm bg-brand-background rounded-md mt-2 italic">"{event.comment}"</p>
                                    )}
                                    {status === 'AUTHENTICATION_PASSED' && order.items[0].product.authenticationReportUrl && (
                                        <a href={order.items[0].product.authenticationReportUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-brand-secondary hover:text-brand-primary mt-2 inline-block">
                                            Скачать отчет о проверке &rarr;
                                        </a>
                                    )}
                                    {status === 'NFT_ISSUED' && (
                                         <button onClick={() => onViewNft(order.items[0].product)} className="text-sm font-semibold bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-md mt-2 inline-block">
                                            Посмотреть NFT-сертификат
                                        </button>
                                    )}
                                </>
                             ) : (
                                <p className="text-sm text-brand-text-secondary/70">Ожидание...</p>
                             )}
                        </div>
                    </li>
                );
            })}
        </ol>
    );
};


const AuthenticationCenterPage: React.FC = () => {
    const { user } = useAuth();
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [viewingNftForProduct, setViewingNftForProduct] = useState<Product | null>(null);

    useEffect(() => {
        const fetchOrders = async () => {
            setIsLoading(true);
            try {
                const data = await apiService.getAuthenticationOrders(user.id);
                setOrders(data);
            } catch (error) {
                console.error("Failed to fetch authentication orders:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchOrders();
    }, [user.id]);
    
    const activeOrders = orders.filter(o => !['AUTHENTICATION_PASSED', 'AUTHENTICATION_FAILED', 'DELIVERED', 'COMPLETED', 'SHIPPED', 'NFT_ISSUED'].includes(o.status));
    const historyOrders = orders.filter(o => ['AUTHENTICATION_PASSED', 'AUTHENTICATION_FAILED', 'DELIVERED', 'COMPLETED', 'SHIPPED', 'NFT_ISSUED'].includes(o.status));

    const renderOrders = (orderList: Order[], title: string) => (
        <section>
            <h2 className="text-2xl font-bold text-white mb-6">{title}</h2>
            {orderList.length > 0 ? (
                <div className="space-y-8">
                    {orderList.map(order => (
                        <div key={order.id} className="bg-brand-surface/50 rounded-lg p-6">
                             <div className="flex flex-col sm:flex-row gap-4 mb-6">
                                <img src={order.items[0].product.imageUrls[0]} alt={order.items[0].product.title} className="w-24 h-24 object-cover rounded-md"/>
                                <div>
                                    <p className="text-sm text-brand-text-secondary">Заказ #{order.id}</p>
                                    <h3 className="text-xl font-bold text-white">{order.items[0].product.title}</h3>
                                    <p className="text-brand-text-secondary">Продавец: <Link to={`/profile/${order.seller.id}`} className="text-brand-primary hover:underline">{order.seller.name}</Link></p>
                                </div>
                             </div>
                            <AuthenticationTimeline order={order} onViewNft={setViewingNftForProduct} />
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-12 bg-brand-surface/50 rounded-lg">
                    <p className="text-brand-text-secondary">Здесь пока пусто.</p>
                </div>
            )}
        </section>
    );


    return (
        <>
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-bold text-white">Центр Аутентификации</h1>
                    <p className="text-lg text-brand-text-secondary mt-2">Отслеживайте каждый шаг проверки ваших товаров.</p>
                </div>
                {isLoading ? (
                    <div className="flex justify-center py-16"><Spinner size="lg" /></div>
                ) : (
                    <div className="space-y-12">
                       {renderOrders(activeOrders, "Активные проверки")}
                       {renderOrders(historyOrders, "История проверок")}
                    </div>
                )}
            </div>
            {viewingNftForProduct && (
                <NFTCertificateModal 
                    product={viewingNftForProduct}
                    onClose={() => setViewingNftForProduct(null)}
                />
            )}
        </>
    );
};

export default AuthenticationCenterPage;