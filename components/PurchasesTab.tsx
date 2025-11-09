import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { apiService } from '../services/apiService';
import type { Order, Product, TrackingEvent, ReviewMediaAttachment } from '../types';
import Spinner from './Spinner';
import ReviewModal from './ReviewModal';
import OpenDisputeModal from './OpenDisputeModal';
import NFTCertificateModal from './NFTCertificateModal';
import DynamicIcon from './DynamicIcon';
import { useCurrency } from '../hooks/useCurrency';

const PurchasesTab: React.FC = () => {
    const { getFormattedPrice } = useCurrency();
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
            setPurchases(originalOrders);
            alert("Не удалось подтвердить доставку.");
        }
    };
    
    const handleOpenDispute = async (reason: string) => {
        if (!disputingOrder) return;
        await apiService.updateOrder(disputingOrder.id, { status: 'DISPUTED', disputeId: disputingOrder.id });
        await apiService.addMessageToDispute(disputingOrder.id, {
            senderId: user.id, senderName: user.name, senderAvatar: user.avatarUrl, text: reason,
        });
        setDisputingOrder(null);
        navigate(`/dispute/${disputingOrder.id}`);
    };
    
    const handleTrackOrder = async (orderId: string) => {
        if (expandedTrackingOrderId === orderId) {
            setExpandedTrackingOrderId(null);
            return;
        }
        setIsLoadingHistory(true);
        setExpandedTrackingOrderId(orderId);
        const history = await apiService.getTrackingHistory(orderId);
        setTrackingHistory(history || []);
        setIsLoadingHistory(false);
    };

    const handleReviewSubmit = async (
        order: Order,
        payload: { rating: number; text: string; attachments: ReviewMediaAttachment[] },
    ) => {
        const primaryProduct = order.items[0]?.product;
        if (!primaryProduct) {
            alert('Не удалось определить товар для отзыва.');
            return;
        }

        try {
            const review = await apiService.submitReview({
                productId: primaryProduct.id,
                orderId: order.id,
                rating: payload.rating,
                text: payload.text,
                attachments: payload.attachments,
            });
            if (review?.isHidden) {
                alert('Отзыв отправлен и появится после модерации.');
            } else {
                alert('Спасибо! Отзыв опубликован.');
            }
        } catch (error) {
            console.error(error);
            alert('Не удалось отправить отзыв. Попробуйте позже.');
        } finally {
            setReviewingOrder(null);
        }
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
                        <div key={order.id} className="bg-base-200/50 p-4 rounded-lg">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <p className="text-sm text-base-content/70">Заказ #{order.id} от {new Date(order.orderDate).toLocaleDateString()}</p>
                                    <p className="text-sm">Продавец: <Link to={`/profile/${order.seller.id}`} className="text-primary hover:underline">{order.seller.name}</Link></p>
                                </div>
                                <span className="badge badge-outline">{order.status}</span>
                            </div>
                            {order.items.map(item => (
                                 <div key={item.product.id} className="flex items-center gap-4 py-2 border-b border-base-300 last:border-b-0">
                                     <img src={item.product.imageUrls[0]} alt={item.product.title} className="w-16 h-16 object-cover rounded-md"/>
                                     <div className="flex-grow">
                                        <p className="font-semibold text-white">{item.product.title}</p>
                                        <p className="text-sm text-base-content/70">{item.quantity} x {getFormattedPrice(item.price)}</p>
                                     </div>
                                 </div>
                            ))}
                            <div className="flex flex-wrap gap-2 mt-3 justify-end">
                                {canViewNft && <button onClick={() => setViewingNftForProduct(product)} className="btn btn-xs bg-purple-600 hover:bg-purple-700 border-none text-white">Посмотреть NFT</button>}
                                {order.status === 'SHIPPED' && <button onClick={() => handleConfirmDelivery(order.id)} className="btn btn-xs btn-success text-white">Подтвердить получение</button>}
                                {order.status === 'DELIVERED' && <button onClick={() => setReviewingOrder(order)} className="btn btn-xs btn-secondary text-white">Оставить отзыв</button>}
                                {(order.status === 'DELIVERED' || order.status === 'SHIPPED') && <button onClick={() => setDisputingOrder(order)} className="btn btn-xs btn-error text-white">Открыть спор</button>}
                                {order.status === 'DISPUTED' && <Link to={`/dispute/${order.id}`} className="btn btn-xs btn-warning">Перейти к спору</Link>}
                                {order.trackingNumber && <button onClick={() => handleTrackOrder(order.id)} className="btn btn-xs btn-info text-white">{expandedTrackingOrderId === order.id ? 'Скрыть' : 'Отследить'}</button>}
                            </div>
                            {expandedTrackingOrderId === order.id && (
                                <div className="mt-4 p-4 bg-base-200 rounded-lg">
                                    {isLoadingHistory ? <div className="flex justify-center"><Spinner /></div> : (
                                        trackingHistory.length > 0 ? (
                                            <ol className="relative border-l-2 border-base-300 ml-2">
                                                {trackingHistory.map((event, index) => (
                                                     <li key={index} className="mb-6 ml-6">
                                                        <span className="absolute flex items-center justify-center w-6 h-6 bg-secondary rounded-full -left-3 ring-4 ring-base-200">
                                                             <DynamicIcon name="tracking-package" className="w-4 h-4 text-white" />
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
                        </div>
                    );
                })}
            </div>
            {reviewingOrder && (
                <ReviewModal
                    isOpen={!!reviewingOrder}
                    onClose={() => setReviewingOrder(null)}
                    order={reviewingOrder}
                    onSubmit={(payload) => handleReviewSubmit(reviewingOrder, payload)}
                />
            )}
            {disputingOrder && <OpenDisputeModal isOpen={!!disputingOrder} onClose={() => setDisputingOrder(null)} order={disputingOrder} onSubmit={handleOpenDispute} />}
            {viewingNftForProduct && <NFTCertificateModal product={viewingNftForProduct} onClose={() => setViewingNftForProduct(null)} />}
        </>
    )
};

export default PurchasesTab;
