import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { apiService } from '../services/apiService';
import { useAuth } from '../hooks/useAuth';
import type { User, Product, Order, Collection, WorkshopPost, TrackingEvent } from '../types';
import Spinner from '../components/Spinner';
import ProductCard from '../components/ProductCard';
import StarRating from '../components/StarRating';
import ReviewModal from '../components/ReviewModal';
import OpenDisputeModal from '../components/OpenDisputeModal';
import PromoteListingModal from '../components/PromoteListingModal';
import ProductAnalyticsModal from '../components/ProductAnalyticsModal';
import CreateWorkshopPost from '../components/CreateWorkshopPost';
import WorkshopPostCard from '../components/WorkshopPostCard';
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

export type ProfileTab = 'dashboard' | 'listings' | 'workshop' | 'wishlist' | 'collections' | 'purchases' | 'sales' | 'analytics' | 'wallet' | 'settings';

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
    if (purchases.length === 0) return <div className="text-center py-16 bg-base-100 rounded-lg"><p className="text-base-content/70">У вас пока нет покупок.</p></div>;

    return (
        <>
            <div className="space-y-4">
                {purchases.map(order => {
                    const product = order.items[0].product;
                    const canViewNft = order.authenticationRequested && product.nftTokenId && ['SHIPPED', 'DELIVERED', 'COMPLETED', 'NFT_ISSUED'].includes(order.status);

                    return (
                        <div key={order.id} className="bg-base-100 p-4 rounded-lg">
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
                                                             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-white">
                                                                <path d="M3.5 3.75a.75.75 0 00-1.5 0v1.5c0 .414.336.75.75.75h1.5a.75.75 0 000-1.5H3.5v-1.5z" />
                                                                <path d="M6.25 7.5a.75.75 0 000 1.5h7.5a.75.75 0 000-1.5h-7.5z" />
                                                                <path d="M9 11.25a.75.75 0 000 1.5h1.5a.75.75 0 000-1.5H9z" />
                                                                <path fillRule="evenodd" d="M16 3a3 3 0 013 3v10a3 3 0 01-3 3H4a3 3 0 01-3-3V6a3 3 0 013-3h12zm-1.5 1.5H5.5a.75.75 0 01-.75.75v8.5a.75.75 0 01.75.75h9a.75.75 0 01.75-.75V8.854a.75.75 0 00-.22-.53l-2.25-2.25a.75.75 0 00-.53-.22H14.5z" clipRule="evenodd" />
                                                              </svg>
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
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.286zm0 13.036h.008v.008h-.008v-.008z" />
                                        </svg>
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
    if (sales.length === 0) return <div className="text-center py-16 bg-base-100 rounded-lg"><p className="text-base-content/70">У вас пока нет продаж.</p></div>;

    return (
        <>
            <div className="space-y-4">
                {sales.map(order => (
                     <div key={order.id} className="bg-base-100 p-4 rounded-lg">
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
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.286zm0 13.036h.008v.008h-.008v-.008z" />
                                    </svg>
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
    
    if (products.length === 0) return <div className="text-center py-16 bg-base-100 rounded-lg"><p className="text-base-content/70">У этого пользователя пока нет товаров.</p></div>
    
    return (
        <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {products.map(product => (
                    <div key={product.id}>
                        <ProductCard product={product} />
                        {isOwnProfile && (
                            <div className="mt-2 flex gap-2">
                                <Link to={`/edit/${product.id}`} className="flex-1 text-center text-sm bg-base-100 hover:bg-base-300 text-white font-semibold py-2 px-3 rounded-lg transition-colors">
                                    Редактировать
                                </Link>
                                <button onClick={() => setAnalyticsProduct(product)} className="text-sm p-2 rounded-lg bg-base-100 hover:bg-base-300" title="Аналитика"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M11 2a1 1 0 10-2 0v1a1 1 0 102 0V2zM15.657 5.657a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 14.95a1 1 0 001.414 1.414l.707-.707a1 1 0 00-1.414-1.414l-.707.707zM2 10a1 1 0 011-1h1a1 1 0 110 2H3a1 1 0 01-1-1zM10 4a6 6 0 100 12 6 6 0 000-12zM10 16a6 6 0 01-6-6 6 6 0 1112 0 6 6 0 01-6 6z" /></svg></button>
                                <button onClick={() => setPromotingProduct(product)} className="text-sm p-2 rounded-lg bg-base-100 hover:bg-base-300" title="Продвигать"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-yellow-400"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-11.25a.75.75 0 00-1.5 0v4.59L7.3 9.24a.75.75 0 00-1.1 1.02l3.25 3.5a.75.75 0 001.1 0l3.25-3.5a.75.75 0 10-1.1-1.02l-1.95 2.1V6.75z" clipRule="evenodd" /></svg></button>
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
            return <div className="text-center py-16 bg-base-100 rounded-lg"><p className="text-base-content/70">Content for Workshop coming soon.</p></div>;
        case 'wishlist':
            return <WishlistTab />;
        case 'collections':
             return <div className="text-center py-16 bg-base-100 rounded-lg"><p className="text-base-content/70">Content for Collections coming soon.</p></div>;
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
            return null;
    }
};

const ProfilePage: React.FC = () => {
    const { profileId } = useParams<{ profileId?: string }>();
    const { user: authUser } = useAuth();
    const navigate = useNavigate();
    const [profileUser, setProfileUser] = useState<User | null>(null);
    const [userProducts, setUserProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isContacting, setIsContacting] = useState(false);
    
    const isOwnProfile = !profileId || profileId === authUser.id;
    useTelegramBackButton(!isOwnProfile);

    const initialTab: ProfileTab = isOwnProfile ? 'dashboard' : 'listings';
    const [activeTab, setActiveTab] = useState<ProfileTab>(initialTab);

    useEffect(() => {
        const fetchProfileData = async () => {
            setIsLoading(true);
            const targetUserId = profileId || authUser.id;
            try {
                const user = await apiService.getUserById(targetUserId);
                if (user) {
                    setProfileUser(user);
                    const products = await apiService.getProductsBySellerId(targetUserId);
                    setUserProducts(products);
                }
                // Reset tab when profile changes
                setActiveTab(!profileId || profileId === authUser.id ? 'dashboard' : 'listings');
            } catch (error) {
                console.error("Failed to fetch profile user data:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchProfileData();
    }, [profileId, authUser.id]);

    const isElectronicsSeller = useMemo(() => {
        if (!userProducts || userProducts.length === 0) return false;
        const electronicsCount = userProducts.filter(p => p.category === 'Электроника').length;
        // Render specialized dashboard if at least 50% of products are electronics
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

    const renderTabs = () => {
        const tabs: { id: ProfileTab; label: string; visible: boolean }[] = [
            { id: 'dashboard', label: 'Сводка', visible: isOwnProfile },
            { id: 'listings', label: 'Товары', visible: true },
            { id: 'workshop', label: 'Мастерская', visible: true },
            { id: 'wishlist', label: 'Избранное', visible: true },
            { id: 'collections', label: 'Коллекции', visible: true },
            { id: 'purchases', label: 'Мои покупки', visible: isOwnProfile },
            { id: 'sales', label: 'Мои продажи', visible: isOwnProfile },
            { id: 'analytics', label: 'Аналитика', visible: isOwnProfile },
            { id: 'wallet', label: 'Кошелек', visible: isOwnProfile },
            { id: 'settings', label: 'Настройки', visible: isOwnProfile },
        ];

        return (
            <div className="border-b border-base-300 mb-6">
                <nav className="-mb-px flex space-x-6 overflow-x-auto">
                    {tabs.filter(t => t.visible).map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                                activeTab === tab.id
                                    ? 'border-primary text-primary'
                                    : 'text-base-content/70 hover:text-white hover:border-gray-300'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>
        );
    };

    if (isLoading) return <div className="flex justify-center items-center h-96"><Spinner /></div>;
    if (!profileUser) return <div className="text-center text-xl text-base-content/70">Профиль не найден.</div>;

    return (
        <div>
            <ProfileHeader 
                user={profileUser} 
                isOwnProfile={isOwnProfile} 
                onContactSeller={handleContactSeller}
                isContacting={isContacting}
            />
            {renderTabs()}
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
    );
};

interface ProfileHeaderProps {
    user: User;
    isOwnProfile: boolean;
    onContactSeller: () => void;
    isContacting: boolean;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({ user, isOwnProfile, onContactSeller, isContacting }) => {
    return (
        <div className="mb-8">
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
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                                  <path d="M3.5 2A1.5 1.5 0 002 3.5v2.75A1.5 1.5 0 003.5 8h13A1.5 1.5 0 0018 6.25V3.5A1.5 1.5 0 0016.5 2h-13z" />
                                  <path d="M3 10.5A1.5 1.5 0 014.5 9h11a1.5 1.5 0 011.5 1.5v3A1.5 1.5 0 0116.5 15h-13A1.5 1.5 0 012 13.5v-3A1.5 1.5 0 013 10.5zm1.5 1.5a1 1 0 100-2 1 1 0 000 2z" />
                                </svg>
                                Управление DAO
                            </Link>
                        )}
                        {isOwnProfile && user.verificationLevel === 'PRO' && (
                            <Link 
                                to="/live/create" 
                                className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2 rounded-lg transition-colors shadow-lg animate-pulse"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                                  <path d="M3.25 4A2.25 2.25 0 001 6.25v7.5A2.25 2.25 0 003.25 16h13.5A2.25 2.25 0 0019 13.75v-7.5A2.25 2.25 0 0016.75 4H3.25zM10 8a.75.75 0 01.75.75v2.5a.75.75 0 01-1.5 0v-2.5A.75.75 0 0110 8zM5.75 9.5a.75.75 0 00-1.5 0v1a.75.75 0 001.5 0v-1zM14.25 9.5a.75.75 0 00-1.5 0v1a.75.75 0 001.5 0v-1z" />
                                </svg>
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

export default ProfilePage;