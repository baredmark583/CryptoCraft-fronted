import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { apiService } from '../services/apiService';
import { useAuth } from '../hooks/useAuth';
import type { User, Product, Order, TrackingEvent } from '../types';
import Spinner from '../components/Spinner';
import ProductCard from '../components/ProductCard';
import StarRating from '../components/StarRating';
import ReviewModal from '../components/ReviewModal';
import OpenDisputeModal from '../components/OpenDisputeModal';
import PromoteListingModal from '../components/PromoteListingModal';
import ProductAnalyticsModal from '../components/ProductAnalyticsModal';
import AnalyticsDashboard from '../components/AnalyticsDashboard';
import WishlistTab from '../components/WishlistTab';
import SettingsTab from '../components/SettingsTab';
import WalletTab from '../components/WalletTab';
import DashboardTab from '../components/DashboardTab';
import VerifiedBadge from '../components/VerifiedBadge';
import AuthenticationRequestModal from '../components/AuthenticationRequestModal';
import ElectronicsDashboardTab from '../components/ElectronicsDashboardTab';
import NFTCertificateModal from '../components/NFTCertificateModal';
import { useTelegramBackButton } from '../hooks/useTelegram';
import DynamicIcon from '../components/DynamicIcon';

export type ProfileTab = 'dashboard' | 'listings' | 'workshop' | 'wishlist' | 'collections' | 'purchases' | 'sales' | 'analytics' | 'wallet' | 'settings';

const TABS: { id: ProfileTab; label: string; visible: (isOwnProfile: boolean) => boolean; icon: React.ReactNode; }[] = [
    { id: 'dashboard', label: 'Сводка', visible: isOwn => isOwn, icon: <DynamicIcon name="dashboard" className="h-5 w-5" fallback={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M5 3a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V5a2 2 0 00-2-2H5zM12.5 8.5a.5.5 0 01.5.5v2a.5.5 0 01-1 0v-2a.5.5 0 01.5-.5zM10 8a.5.5 0 01.5.5v4a.5.5 0 01-1 0v-4A.5.5 0 0110 8zM7.5 9.5a.5.5 0 01.5.5v1a.5.5 0 01-1 0v-1a.5.5 0 01.5-.5z" /></svg>} /> },
    { id: 'listings', label: 'Товары', visible: () => true, icon: <DynamicIcon name="listings" className="h-5 w-5" fallback={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M3.75 3A1.75 1.75 0 002 4.75v10.5c0 .966.784 1.75 1.75 1.75h12.5A1.75 1.75 0 0018 15.25V4.75A1.75 1.75 0 0016.25 3H3.75zM7 7.25a.75.75 0 011.5 0V8h.5a.75.75 0 010 1.5H8v.5a.75.75 0 01-1.5 0v-.5H6a.75.75 0 010-1.5h.5V7.25zM11 8a1 1 0 100-2 1 1 0 000 2z" /></svg>} /> },
    { id: 'workshop', label: 'Мастерская', visible: () => true, icon: <DynamicIcon name="workshop" className="h-5 w-5" fallback={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M5.433 13.917l1.262-3.155A4 4 0 017.58 9.42l6.92-6.918a2.121 2.121 0 013 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 01-.65-.65z" /></svg>} /> },
    { id: 'wishlist', label: 'Избранное', visible: () => true, icon: <DynamicIcon name="wishlist-heart" className="h-5 w-5" fallback={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M9.653 16.915l-.005-.003-.019-.01a20.759 20.759 0 01-1.162-.682 22.045 22.045 0 01-2.582-1.9-22.348 22.348 0 01-2.949-2.582 20.759 20.759 0 01-1.162-.682A9.96 9.96 0 012 10V6.652a2.492 2.492 0 011.666-2.311 2.493 2.493 0 012.134.12l.28.168c.002 0 .003.001.005.002l.004.002c.002 0 .003.001.005.002l.005.002a.002.002 0 00.005 0l.005-.002.004-.002a.002.002 0 00.005-.002l.004-.002.28-.168a2.493 2.493 0 012.134-.12 2.492 2.492 0 011.666 2.311V10c0 1.638-.403 3.228-1.162 4.682-.01.012-.02.023-.03.034l-.005.003z" /></svg>} /> },
    { id: 'collections', label: 'Коллекции', visible: () => true, icon: <DynamicIcon name="collection-add" className="h-5 w-5" fallback={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M5.5 16.5A1.5 1.5 0 014 15V5.5A1.5 1.5 0 015.5 4h9A1.5 1.5 0 0116 5.5V15a1.5 1.5 0 01-1.5 1.5h-9zM10 6a.75.75 0 00-1.5 0v1.5H7a.75.75 0 000 1.5h1.5V10a.75.75 0 001.5 0V9h1.5a.75.75 0 000-1.5H10V6z" /></svg>} /> },
    { id: 'purchases', label: 'Мои покупки', visible: isOwn => isOwn, icon: <DynamicIcon name="purchases" className="h-5 w-5" fallback={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M5.5 3.5A1.5 1.5 0 017 2h6.5a1.5 1.5 0 011.06.44l3.5 3.5a1.5 1.5 0 01.44 1.06V16.5A1.5 1.5 0 0117 18H7a1.5 1.5 0 01-1.5-1.5v-13z" /></svg>} /> },
    { id: 'sales', label: 'Мои продажи', visible: isOwn => isOwn, icon: <DynamicIcon name="sales" className="h-5 w-5" fallback={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 005 18h10a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4z" clipRule="evenodd" /></svg>} /> },
    { id: 'analytics', label: 'Аналитика', visible: isOwn => isOwn, icon: <DynamicIcon name="analytics" className="h-5 w-5" fallback={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M11 2a1 1 0 10-2 0v1a1 1 0 102 0V2zM15.657 5.657a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 14.95a1 1 0 001.414 1.414l.707-.707a1 1 0 00-1.414-1.414l-.707.707zM2 10a1 1 0 011-1h1a1 1 0 110 2H3a1 1 0 01-1-1zM10 4a6 6 0 100 12 6 6 0 000-12zM10 16a6 6 0 01-6-6 6 6 0 1112 0 6 6 0 01-6 6z" /></svg>} /> },
    { id: 'wallet', label: 'Кошелек', visible: isOwn => isOwn, icon: <DynamicIcon name="wallet" className="h-5 w-5" fallback={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M2.5 4A1.5 1.5 0 014 2.5h12A1.5 1.5 0 0117.5 4v1.543a.75.75 0 001.5 0V4A3 3 0 0016 1H4a3 3 0 00-3 3v10a3 3 0 003 3h12a3 3 0 003-3v-1.543a.75.75 0 00-1.5 0V16a1.5 1.5 0 01-1.5 1.5H4A1.5 1.5 0 012.5 16V4z" /><path d="M12.25 8.25a.75.75 0 000 1.5h1.5a.75.75 0 000-1.5h-1.5z" /></svg>} /> },
    { id: 'settings', label: 'Настройки', visible: isOwn => isOwn, icon: <DynamicIcon name="settings" className="h-5 w-5" fallback={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M11.078 2.25c-.217-.065-.437-.1-.668-.124a1.86 1.86 0 00-.74-.037 3.39 3.39 0 00-1.01.242 1.86 1.86 0 01-.668.379 1.86 1.86 0 00-.668.668 3.39 3.39 0 00-.242 1.01c-.012.245-.03.49-.037.74a1.86 1.86 0 00.124.668 1.86 1.86 0 01.379.668 1.86 1.86 0 00.668.668 3.39 3.39 0 001.01.242c.245.013.49.03.74.037a1.86 1.86 0 00.668-.124 1.86 1.86 0 01.668-.379 1.86 1.86 0 00.668-.668 3.39 3.39 0 00.242-1.01c.013-.245.03-.49.037-.74a1.86 1.86 0 00-.124-.668 1.86 1.86 0 01-.379-.668 1.86 1.86 0 00-.668-.668 3.39 3.39 0 00-1.01-.242zM10 8a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /><path d="M10 18a8 8 0 100-16 8 8 0 000 16zM15.432 4.568a.75.75 0 011.06 1.06l-1.06-1.06zM4.568 15.432a.75.75 0 101.06-1.06l-1.06 1.06z" /><path fillRule="evenodd" d="M10 3a7 7 0 100 14 7 7 0 000-14zM4.568 4.568a7 7 0 019.9 9.9l-1.06-1.06a5.5 5.5 0 00-7.78-7.78l-1.06-1.06z" clipRule="evenodd" /></svg>} /> },
];

const PurchasesTab: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [purchases, setPurchases] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [reviewingOrder, setReviewingOrder] = useState<Order | null>(null);
    const [disputingOrder, setDisputingOrder] = useState<Order | null>(null);
    const [viewingNftForProduct, setViewingNftForProduct] = useState<Product | null>(null);
    const [expandedTrackingOrderId, setExpandedTrackingOrderId] = useState<string | null>(null);
    const [trackingHistory, setTrackingHistory] = useState<TrackingEvent[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);

    useEffect(() => {
        apiService.getPurchasesByBuyerId()
            .then(data => setPurchases(data.sort((a,b) => b.orderDate - a.orderDate)))
            .finally(() => setIsLoading(false));
    }, [user.id]);

    const handleConfirmDelivery = async (orderId: string) => {
        const originalOrders = [...purchases];
        setPurchases(prev => prev.map(o => o.id === orderId ? {...o, status: 'DELIVERED'} : o));
        try {
            await apiService.updateOrder(orderId, { status: 'DELIVERED' });
        } catch (error) {
            console.error(error);
            setPurchases(originalOrders); // Revert on error
            alert("Не удалось подтвердить доставку.");
        }
    };
    
    const handleOpenDispute = async (reason: string) => {
        if (!disputingOrder) return;
        await apiService.updateOrder(disputingOrder.id, { status: 'DISPUTED', disputeId: disputingOrder.id });
        // Create the initial dispute message
        await apiService.addMessageToDispute(disputingOrder.id, {
            senderId: user.id,
            senderName: user.name,
            senderAvatar: user.avatarUrl,
            text: reason,
        });
        setDisputingOrder(null);
        navigate(`/dispute/${disputingOrder.id}`);
    };
    
    const handleTrackOrder = async (orderId: string) => {
        if (expandedTrackingOrderId === orderId) {
            setExpandedTrackingOrderId(null); // Collapse if already open
            return;
        }
        setIsLoadingHistory(true);
        setExpandedTrackingOrderId(orderId);
        const history = await apiService.getTrackingHistory(orderId);
        setTrackingHistory(history || []);
        setIsLoadingHistory(false);
    };

    if (isLoading) return <div className="flex justify-center py-8"><Spinner /></div>;
    if (purchases.length === 0) return <div className="text-center py-16"><p className="text-base-content/70">У вас пока нет покупок.</p></div>;

    return (
        <>
            <div className="space-y-4">
                {purchases.map(order => {
                    const product = order.items[0].product;
                    const canViewNft = order.authenticationRequested && product.nftTokenId && ['SHIPPED', 'DELIVERED', 'COMPLETED', 'NFT_ISSUED'].includes(order.status);

                    return (
                        <div key={order.id} className="card bg-base-200/50 p-4">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <p className="text-sm text-base-content/70">Заказ #{order.id} от {new Date(order.orderDate).toLocaleDateString()}</p>
                                    <p className="text-sm">Продавец: <Link to={`/profile/${order.seller.id}`} className="text-primary hover:underline">{order.seller.name}</Link></p>
                                </div>
                                <span className="text-sm font-semibold">{order.status}</span>
                            </div>
                            {order.items.map(item => (
                                 <div key={item.product.id} className="flex items-center gap-4 py-2 border-b border-base-300 last:border-b-0">
                                     <img src={item.product.imageUrls[0]} alt={item.product.title} className="w-16 h-16 object-cover rounded-md"/>
                                     <div className="flex-grow">
                                        <p className="font-semibold text-white">{item.product.title}</p>
                                        <p className="text-sm text-base-content/70">{item.quantity} x {item.price.toFixed(2)} USDT</p>
                                     </div>
                                 </div>
                            ))}
                            <div className="flex flex-wrap gap-2 mt-3 justify-end">
                                {canViewNft && <button onClick={() => setViewingNftForProduct(product)} className="text-sm bg-purple-600 hover:bg-purple-700 text-white font-semibold py-1 px-3 rounded-md">Посмотреть NFT</button>}
                                {order.status === 'SHIPPED' && <button onClick={() => handleConfirmDelivery(order.id)} className="text-sm bg-green-600 hover:bg-green-700 text-white font-semibold py-1 px-3 rounded-md">Подтвердить получение</button>}
                                {order.status === 'DELIVERED' && <button onClick={() => setReviewingOrder(order)} className="text-sm bg-secondary hover:bg-primary-focus text-white font-semibold py-1 px-3 rounded-md">Оставить отзыв</button>}
                                {(order.status === 'DELIVERED' || order.status === 'SHIPPED') && <button onClick={() => setDisputingOrder(order)} className="text-sm bg-red-600 hover:bg-red-700 text-white font-semibold py-1 px-3 rounded-md">Открыть спор</button>}
                                {order.status === 'DISPUTED' && <Link to={`/dispute/${order.id}`} className="text-sm bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-1 px-3 rounded-md">Перейти к спору</Link>}
                                 {order.trackingNumber && (
                                    <button onClick={() => handleTrackOrder(order.id)} className="text-sm bg-sky-600 hover:bg-sky-700 text-white font-semibold py-1 px-3 rounded-md">
                                        {expandedTrackingOrderId === order.id ? 'Скрыть' : 'Отследить'}
                                    </button>
                                )}
                            </div>
                            {expandedTrackingOrderId === order.id && (
                                <div className="mt-4 p-4 bg-base-200 rounded-lg">
                                    {isLoadingHistory ? <div className="flex justify-center"><Spinner /></div> : (
                                        trackingHistory.length > 0 ? (
                                            <ol className="relative border-l-2 border-base-300 ml-2">
                                                {trackingHistory.map((event, index) => (
                                                     <li key={index} className="mb-6 ml-6">
                                                        <span className="absolute flex items-center justify-center w-6 h-6 bg-secondary rounded-full -left-3 ring-4 ring-base-200">
                                                             <DynamicIcon name="tracking-package" className="w-4 h-4 text-white" fallback={
                                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                                    <path d="M3.5 3.75a.75.75 0 00-1.5 0v1.5c0 .414.336.75.75.75h1.5a.75.75 0 000-1.5H3.5v-1.5z" />
                                                                    <path d="M6.25 7.5a.75.75 0 000 1.5h7.5a.75.75 0 000-1.5h-7.5z" />
                                                                    <path d="M9 11.25a.75.75 0 000 1.5h1.5a.75.75 0 000-1.5H9z" />
                                                                    <path fillRule="evenodd" d="M16 3a3 3 0 013 3v10a3 3 0 01-3 3H4a3 3 0 01-3-3V6a3 3 0 013-3h12zm-1.5 1.5H5.5a.75.75 0 01-.75.75v8.5a.75.75 0 01.75.75h9a.75.75 0 01.75-.75V8.854a.75.75 0 00-.22-.53l-2.25-2.25a.75.75 0 00-.53-.22H14.5z" clipRule="evenodd" />
                                                                </svg>
                                                             }/>
                                                        </span>
                                                        <h3 className="font-semibold text-white">{event.status}</h3>
                                                        <p className="text-sm text-base-content/70">{event.location}</p>
                                                        <time className="block text-xs font-normal text-base-content/70">{new Date(event.timestamp).toLocaleString()}</time>
                                                    </li>
                                                ))}
                                            </ol>
                                        ) : <p className="text-base-content/70">Нет данных для отслеживания.</p>
                                    )}
                                </div>
                            )}
                            {order.smartContractAddress && (
                                <div className="mt-3 pt-3 border-t border-base-300/50 flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-sm text-sky-400">
                                        <DynamicIcon name="secure-deal" className="w-5 h-5" fallback={
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.286zm0 13.036h.008v.008h-.008v-.008z" />
                                            </svg>
                                        }/>
                                        <span>Сделка защищена смарт-контрактом</span>
                                    </div>
                                    <button
                                        onClick={() => alert(`Адрес контракта: ${order.smartContractAddress}\nХэш транзакции: ${order.transactionHash}`)}
                                        className="text-xs bg-base-100 hover:bg-base-300 border border-base-300 text-white font-semibold py-1 px-2 rounded-md"
                                    >
                                        Посмотреть транзакцию
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
            {reviewingOrder && <ReviewModal isOpen={!!reviewingOrder} onClose={() => setReviewingOrder(null)} order={reviewingOrder} onSubmit={async () => alert("Отзыв отправлен!")}/>}
            {disputingOrder && <OpenDisputeModal isOpen={!!disputingOrder} onClose={() => setDisputingOrder(null)} order={disputingOrder} onSubmit={handleOpenDispute} />}
            {viewingNftForProduct && <NFTCertificateModal product={viewingNftForProduct} onClose={() => setViewingNftForProduct(null)} />}
        </>
    )
};

const SalesTab: React.FC = () => {
    const { user } = useAuth();
    const [sales, setSales] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [generatingWaybill, setGeneratingWaybill] = useState<string | null>(null);

    useEffect(() => {
        apiService.getSalesBySellerId()
            .then(data => setSales(data.sort((a, b) => b.orderDate - a.orderDate)))
            .finally(() => setIsLoading(false));
    }, [user.id]);
    
    const handleGenerateWaybill = async (orderId: string) => {
        setGeneratingWaybill(orderId);
        try {
            const updatedOrder = await apiService.generateWaybill(orderId);
            setSales(prev => prev.map(o => o.id === orderId ? updatedOrder : o));
        } catch (error) {
            console.error(error);
            alert("Не удалось сгенерировать ТТН.");
        } finally {
            setGeneratingWaybill(null);
        }
    };

    if (isLoading) return <div className="flex justify-center py-8"><Spinner /></div>;
    if (sales.length === 0) return <div className="text-center py-16"><p className="text-base-content/70">У вас пока нет продаж.</p></div>;

    return (
        <>
            <div className="space-y-4">
                {sales.map(order => (
                     <div key={order.id} className="card bg-base-200/50 p-4">
                        <div className="flex justify-between items-start mb-2">
                             <div>
                                <p className="text-sm text-base-content/70">Заказ #{order.id} от {new Date(order.orderDate).toLocaleDateString()}</p>
                                <p className="text-sm">Покупатель: <span className="text-white">{order.buyer.name}</span></p>
                            </div>
                            <span className="text-sm font-semibold">{order.status}</span>
                        </div>
                        {order.items.map(item => (
                            <div key={item.product.id} className="flex items-center gap-4 py-2 border-b border-base-300 last:border-b-0">
                                <img src={item.product.imageUrls[0]} alt={item.product.title} className="w-16 h-16 object-cover rounded-md"/>
                                 <div className="flex-grow">
                                    <p className="font-semibold text-white">{item.product.title}</p>
                                    <p className="text-sm text-base-content/70">{item.quantity} x {item.price.toFixed(2)} USDT</p>
                                 </div>
                                 <p className="font-bold text-lg text-white">{order.total.toFixed(2)} USDT</p>
                             </div>
                        ))}
                         <div className="flex flex-wrap gap-2 mt-3 justify-end">
                            {order.status === 'PAID' && (
                                <button 
                                    onClick={() => handleGenerateWaybill(order.id)}
                                    disabled={generatingWaybill === order.id}
                                    className="text-sm bg-primary hover:bg-primary-focus text-white font-semibold py-1 px-3 rounded-md flex items-center justify-center w-40 disabled:bg-gray-500"
                                >
                                    {generatingWaybill === order.id ? <Spinner size="sm"/> : 'Сгенерировать ТТН'}
                                </button>
                            )}
                            {order.status === 'DISPUTED' && <Link to={`/dispute/${order.id}`} className="text-sm bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-1 px-3 rounded-md">Перейти к спору</Link>}
                        </div>
                        {order.smartContractAddress && (
                            <div className="mt-3 pt-3 border-t border-base-300/50 flex items-center justify-between">
                                <div className="flex items-center gap-2 text-sm text-sky-400">
                                     <DynamicIcon name="secure-deal" className="w-5 h-5" fallback={
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.286zm0 13.036h.008v.008h-.008v-.008z" />
                                        </svg>
                                     }/>
                                    <span>Сделка защищена смарт-контрактом</span>
                                </div>
                                <button
                                    onClick={() => alert(`Адрес контракта: ${order.smartContractAddress}\nХэш транзакции: ${order.transactionHash}`)}
                                    className="text-xs bg-base-100 hover:bg-base-300 border border-base-300 text-white font-semibold py-1 px-2 rounded-md"
                                >
                                    Посмотреть транзакцию
                                </button>
                            </div>
                        )}
                     </div>
                ))}
            </div>
        </>
    );
};


const ListingsTab: React.FC<{ products: Product[], isOwnProfile: boolean, onProductUpdate: (product: Product) => void; setActiveTab: (tab: ProfileTab) => void; }> = ({ products, isOwnProfile, onProductUpdate, setActiveTab }) => {
    const [promotingProduct, setPromotingProduct] = useState<Product | null>(null);
    const [analyticsProduct, setAnalyticsProduct] = useState<Product | null>(null);

    const handlePromote = async () => {
        if (!promotingProduct) return;
        const updatedProduct = await apiService.updateListing(promotingProduct.id, { isPromoted: true });
        onProductUpdate(updatedProduct);
        setPromotingProduct(null);
    }
    
    if (products.length === 0) return <div className="text-center py-16"><p className="text-base-content/70">У этого пользователя пока нет товаров.</p></div>
    
    return (
        <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map(product => (
                    <div key={product.id}>
                        <ProductCard product={product} />
                        {isOwnProfile && (
                            <div className="mt-2 flex gap-2">
                                <Link to={`/edit/${product.id}`} className="flex-1 text-center text-sm bg-base-200/50 hover:bg-base-300/50 text-white font-semibold py-2 px-3 rounded-lg transition-colors">
                                    Редактировать
                                </Link>
                                <button onClick={() => setAnalyticsProduct(product)} className="text-sm p-2 rounded-lg bg-base-200/50 hover:bg-base-300/50" title="Аналитика"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M11 2a1 1 0 10-2 0v1a1 1 0 102 0V2zM15.657 5.657a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 14.95a1 1 0 001.414 1.414l.707-.707a1 1 0 00-1.414-1.414l-.707.707zM2 10a1 1 0 011-1h1a1 1 0 110 2H3a1 1 0 01-1-1zM10 4a6 6 0 100 12 6 6 0 000-12zM10 16a6 6 0 01-6-6 6 6 0 1112 0 6 6 0 01-6 6z" /></svg></button>
                                <button onClick={() => setPromotingProduct(product)} className="text-sm p-2 rounded-lg bg-base-200/50 hover:bg-base-300/50" title="Продвигать"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-yellow-400"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-11.25a.75.75 0 00-1.5 0v4.59L7.3 9.24a.75.75 0 00-1.1 1.02l3.25 3.5a.75.75 0 001.1 0l3.25-3.5a.75.75 0 10-1.1-1.02l-1.95 2.1V6.75z" clipRule="evenodd" /></svg></button>
                            </div>
                        )}
                    </div>
                ))}
            </div>
            {promotingProduct && <PromoteListingModal isOpen={!!promotingProduct} onClose={() => setPromotingProduct(null)} onSubmit={handlePromote} product={promotingProduct} />}
            {analyticsProduct && <ProductAnalyticsModal isOpen={!!analyticsProduct} onClose={() => setAnalyticsProduct(null)} product={analyticsProduct} onUpdate={onProductUpdate} />}
        </>
    )
};

interface TabContentProps {
  activeTab: ProfileTab;
  user: User;
  isOwnProfile: boolean;
  products: Product[];
  onProductUpdate: (updatedProduct: Product) => void;
  setActiveTab: (tab: ProfileTab) => void;
  isElectronicsSeller: boolean;
}
const TabContent: React.FC<TabContentProps> = ({ activeTab, user, isOwnProfile, products, onProductUpdate, setActiveTab, isElectronicsSeller }) => {
    switch (activeTab) {
        case 'dashboard':
            if (!isOwnProfile) return null;
            return isElectronicsSeller ? 
                <ElectronicsDashboardTab user={user} products={products} onProductUpdate={onProductUpdate} setActiveTab={setActiveTab} /> : 
                <DashboardTab sellerId={user.id} setActiveTab={setActiveTab} />;
        case 'listings':
            return <ListingsTab products={products} isOwnProfile={isOwnProfile} onProductUpdate={onProductUpdate} setActiveTab={setActiveTab} />;
        case 'workshop':
            return <div className="text-center py-16"><p className="text-base-content/70">Раздел "Мастерская" в разработке.</p></div>;
        case 'wishlist':
            return <WishlistTab />;
        case 'collections':
             return <div className="text-center py-16"><p className="text-base-content/70">Раздел "Коллекции" в разработке.</p></div>;
        case 'purchases':
            return isOwnProfile ? <PurchasesTab /> : null;
        case 'sales':
            return isOwnProfile ? <SalesTab /> : null;
        case 'analytics':
            return isOwnProfile ? <AnalyticsDashboard sellerId={user.id} /> : null;
        case 'wallet':
            return isOwnProfile ? <WalletTab user={user} /> : null;
        case 'settings':
            return isOwnProfile ? <SettingsTab user={user} /> : null;
        default:
            return <ListingsTab products={products} isOwnProfile={isOwnProfile} onProductUpdate={onProductUpdate} setActiveTab={setActiveTab} />;
    }
};

interface ProfileHeaderProps {
    user: User;
    isOwnProfile: boolean;
    onContactSeller: () => void;
    isContacting: boolean;
}
const ProfileHeader: React.FC<ProfileHeaderProps> = ({ user, isOwnProfile, onContactSeller, isContacting }) => {
    return (
        <div>
            <div className="h-48 bg-base-100 rounded-lg overflow-hidden mb-[-4rem] sm:mb-[-5rem]">
                {user.headerImageUrl ? (
                    <img src={user.headerImageUrl} alt={`${user.name}'s header`} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full bg-gradient-to-r from-base-100 via-base-300 to-base-100"></div>
                )}
            </div>
            <div className="relative flex flex-col sm:flex-row items-center gap-6 px-6">
                <img src={user.avatarUrl} alt={user.name} className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-base-200 bg-base-200 ring-2 ring-primary"/>
                
                <div className="flex-1 flex flex-col sm:flex-row items-center justify-center sm:justify-between w-full pt-4 sm:pt-12">
                    <div className="text-center sm:text-left">
                        <h1 className="text-3xl font-bold text-white flex items-center justify-center sm:justify-start gap-2">
                            {user.name} 
                            {user.verificationLevel && user.verificationLevel !== 'NONE' && <VerifiedBadge level={user.verificationLevel} />}
                        </h1>
                        <div className="flex items-center justify-center sm:justify-start gap-2 mt-1">
                            <StarRating rating={user.rating} />
                            <span className="text-base-content/70">{user.rating.toFixed(1)}</span>
                        </div>
                         {isOwnProfile && (
                            <div className="mt-2 text-sm flex gap-4 justify-center sm:justify-start">
                               <span className="text-green-400 font-mono">
                                   Баланс: {user.balance.toFixed(2)} USDT
                               </span>
                               {user.commissionOwed > 0 && (
                                   <span className="text-red-400 font-mono">
                                       Долг: {user.commissionOwed.toFixed(2)} USDT
                                   </span>
                               )}
                            </div>
                        )}
                    </div>

                     <div className="flex flex-col sm:flex-row items-center gap-4 mt-4 sm:mt-0">
                        {isOwnProfile && user.verificationLevel === 'PRO' && (
                            <Link 
                                to="/governance" 
                                className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-lg transition-colors shadow-lg"
                            >
                                <DynamicIcon name="dao-governance" className="w-5 h-5" fallback={
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                      <path d="M3.5 2A1.5 1.5 0 002 3.5v2.75A1.5 1.5 0 003.5 8h13A1.5 1.5 0 0018 6.25V3.5A1.5 1.5 0 0016.5 2h-13z" />
                                      <path d="M3 10.5A1.5 1.5 0 014.5 9h11a1.5 1.5 0 011.5 1.5v3A1.5 1.5 0 0116.5 15h-13A1.5 1.5 0 012 13.5v-3A1.5 1.5 0 013 10.5zm1.5 1.5a1 1 0 100-2 1 1 0 000 2z" />
                                    </svg>
                                }/>
                                Управление DAO
                            </Link>
                        )}
                        {isOwnProfile && user.verificationLevel === 'PRO' && (
                            <Link 
                                to="/live/create" 
                                className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2 rounded-lg transition-colors shadow-lg animate-pulse"
                            >
                                <DynamicIcon name="start-livestream" className="w-5 h-5" fallback={
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                      <path d="M3.25 4A2.25 2.25 0 001 6.25v7.5A2.25 2.25 0 003.25 16h13.5A2.25 2.25 0 0019 13.75v-7.5A2.25 2.25 0 0016.75 4H3.25zM10 8a.75.75 0 01.75.75v2.5a.75.75 0 01-1.5 0v-2.5A.75.75 0 0110 8zM5.75 9.5a.75.75 0 00-1.5 0v1a.75.75 0 001.5 0v-1zM14.25 9.5a.75.75 0 00-1.5 0v1a.75.75 0 001.5 0v-1z" />
                                    </svg>
                                }/>
                                Начать эфир
                            </Link>
                        )}
                        {!isOwnProfile && (
                            <button onClick={onContactSeller} disabled={isContacting} className="bg-primary hover:bg-primary-focus text-white font-bold py-2 px-4 rounded-lg">
                                {isContacting ? <Spinner size="sm" /> : 'Написать'}
                            </button>
                        )}
                        {isOwnProfile && user.verificationLevel === 'NONE' && (
                             <Link to="/verify" className="bg-amber-500 hover:bg-amber-600 text-white font-bold py-2 px-4 rounded-lg">
                                Стать Pro-продавцом
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

interface ProfileNavProps {
    isOwnProfile: boolean;
    activeTab: ProfileTab;
    setActiveTab: (tab: ProfileTab) => void;
}
const ProfileNav: React.FC<ProfileNavProps> = ({ isOwnProfile, activeTab, setActiveTab }) => {
    return (
        <nav className="p-4">
            <ul className="space-y-1">
                {TABS.filter(t => t.visible(isOwnProfile)).map(tab => (
                    <li key={tab.id}>
                        <button
                            onClick={() => setActiveTab(tab.id)}
                            className={`w-full flex items-center gap-3 p-3 text-left rounded-md transition-colors ${
                                activeTab === tab.id
                                    ? 'bg-primary text-primary-content font-bold'
                                    : 'text-base-content/80 hover:bg-base-300'
                            }`}
                        >
                            {tab.icon}
                            <span>{tab.label}</span>
                        </button>
                    </li>
                ))}
            </ul>
        </nav>
    );
};

const ProfilePage: React.FC = () => {
    const { profileId } = useParams<{ profileId?: string }>();
    const { user: authUser } = useAuth();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    
    const [profileUser, setProfileUser] = useState<User | null>(null);
    const [userProducts, setUserProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isContacting, setIsContacting] = useState(false);
    const [isNavOpen, setIsNavOpen] = useState(false);
    
    const isOwnProfile = !profileId || profileId === authUser.id;
    useTelegramBackButton(!isOwnProfile);

    const initialTab: ProfileTab = isOwnProfile ? 'dashboard' : 'listings';
    const activeTab = (searchParams.get('tab') as ProfileTab) || initialTab;
    
    const setActiveTab = (tab: ProfileTab) => {
        setSearchParams({ tab });
    };
    
    const setActiveTabAndCloseNav = (tab: ProfileTab) => {
        setSearchParams({ tab });
        setIsNavOpen(false); // Close nav on mobile after selection
    };

    useEffect(() => {
        const fetchProfileData = async () => {
            setIsLoading(true);
            try {
                const targetUserId = profileId || authUser.id;
                let userToSet: User | null;

                if (isOwnProfile) {
                    userToSet = authUser;
                } else {
                    userToSet = await apiService.getUserById(targetUserId) || null;
                }

                if (userToSet) {
                    setProfileUser(userToSet);
                    const products = await apiService.getProductsBySellerId(targetUserId);
                    setUserProducts(products);
                } else {
                    setProfileUser(null);
                    setUserProducts([]);
                }
                
                if (!searchParams.get('tab')) {
                     setActiveTab(isOwnProfile ? 'dashboard' : 'listings');
                }

            } catch (error) {
                console.error("Failed to fetch profile user data:", error);
                setProfileUser(null);
            } finally {
                setIsLoading(false);
            }
        };
        fetchProfileData();
    }, [profileId, authUser.id]);

    const isElectronicsSeller = useMemo(() => {
        if (!userProducts || userProducts.length === 0) return false;
        const electronicsCount = userProducts.filter(p => p.category === 'Электроника').length;
        return (electronicsCount / userProducts.length) >= 0.5;
    }, [userProducts]);
    
    const handleProductUpdate = (updatedProduct: Product) => {
        setUserProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
    };

    const handleContactSeller = async () => {
        if (!profileUser || profileUser.id === authUser.id) return;
        setIsContacting(true);
        try {
            const chat = await apiService.findOrCreateChat(authUser.id, profileUser.id);
            navigate(`/chat/${chat.id}`);
        } catch (error) {
            console.error("Failed to create or find chat:", error);
            alert("Не удалось начать чат.");
        } finally {
            setIsContacting(false);
        }
    };

    if (isLoading) return <div className="flex justify-center items-center h-96"><Spinner /></div>;
    if (!profileUser) return <div className="text-center text-xl text-base-content/70">Профиль не найден.</div>;

    return (
        <>
            {/* Sidebar Navigation */}
            <aside className={`fixed top-0 left-0 z-40 w-64 h-screen bg-base-200 border-r border-base-300 transition-transform md:translate-x-0 ${isNavOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="flex items-center justify-between p-4 border-b border-base-300 h-16">
                     <Link to="/profile" className="text-xl font-bold text-white">
                        Мой Профиль
                     </Link>
                     <button className="md:hidden p-1 text-2xl" onClick={() => setIsNavOpen(false)}>&times;</button>
                </div>
                <ProfileNav 
                    isOwnProfile={isOwnProfile}
                    activeTab={activeTab}
                    setActiveTab={setActiveTabAndCloseNav}
                />
            </aside>
            
            {/* Overlay for mobile */}
            {isNavOpen && <div className="fixed inset-0 bg-black/60 z-30 md:hidden" onClick={() => setIsNavOpen(false)}></div>}

            <div className="md:ml-64">
                {/* Mobile Header with Hamburger */}
                <div className="md:hidden flex items-center justify-between p-4 bg-base-100/80 backdrop-blur-lg sticky top-0 z-20 shadow-sm h-16">
                    <button onClick={() => setIsNavOpen(true)}>
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                    </button>
                    <h1 className="text-lg font-bold text-white">
                        {TABS.find(t => t.id === activeTab)?.label || 'Профиль'}
                    </h1>
                    <div className="w-6"></div> {/* Placeholder for alignment */}
                </div>

                <div className="p-4 md:p-6">
                    <ProfileHeader 
                        user={profileUser} 
                        isOwnProfile={isOwnProfile} 
                        onContactSeller={handleContactSeller}
                        isContacting={isContacting}
                    />
            
                    <main className="mt-8">
                         <div className="bg-base-100 p-4 sm:p-6 rounded-lg shadow-lg min-h-[400px]">
                            <TabContent 
                                activeTab={activeTab} 
                                user={profileUser} 
                                isOwnProfile={isOwnProfile}
                                products={userProducts}
                                onProductUpdate={handleProductUpdate}
                                setActiveTab={setActiveTab} 
                                isElectronicsSeller={isElectronicsSeller}
                            />
                        </div>
                    </main>
                </div>
            </div>
        </>
    );
};

export default ProfilePage;