import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { apiService } from '../services/apiService';
import type { Order } from '../types';
import Spinner from './Spinner';
import { Link } from 'react-router-dom';

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
        <div className="space-y-4">
            {sales.map(order => (
                 <div key={order.id} className="bg-base-200/50 p-4 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                         <div>
                            <p className="text-sm text-base-content/70">Заказ #{order.id} от {new Date(order.orderDate).toLocaleDateString()}</p>
                            <p className="text-sm">Покупатель: <span className="text-white">{order.buyer.name}</span></p>
                        </div>
                        <span className="badge badge-outline">{order.status}</span>
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
                                className="btn btn-sm btn-primary text-white w-40 disabled:bg-gray-500"
                            >
                                {generatingWaybill === order.id ? <Spinner size="sm"/> : 'Сгенерировать ТТН'}
                            </button>
                        )}
                        {order.status === 'DISPUTED' && <Link to={`/dispute/${order.id}`} className="btn btn-sm btn-warning">Перейти к спору</Link>}
                    </div>
                 </div>
            ))}
        </div>
    );
};

export default SalesTab;
