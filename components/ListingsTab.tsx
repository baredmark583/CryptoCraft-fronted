import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import type { Product } from '../types';
import PromoteListingModal from './PromoteListingModal';
import ProductAnalyticsModal from './ProductAnalyticsModal';
import { apiService } from '../services/apiService';
import { useCurrency } from '../hooks/useCurrency';

interface ListingsTabProps {
    products: Product[];
    isOwnProfile: boolean;
    onProductUpdate: (product: Product) => void;
}

const StatusBadge: React.FC<{ status: Product['status'] }> = ({ status }) => {
    let text, iconName, colorClasses;

    switch (status) {
        case 'Active':
            text = 'Опубликовано';
            iconName = 'https://api.iconify.design/lucide-check-circle-2.svg';
            colorClasses = 'border-green-300 bg-green-50 text-green-700';
            break;
        case 'Pending Moderation':
            text = 'Черновик';
            iconName = 'https://api.iconify.design/lucide-file-text.svg';
            colorClasses = 'border-amber-300 bg-amber-50 text-amber-700';
            break;
        case 'Rejected':
            text = 'Отклонено';
            iconName = 'https://api.iconify.design/lucide-x-circle.svg';
            colorClasses = 'border-red-300 bg-red-50 text-red-700';
            break;
        default:
            return null;
    }

    return (
        <span className={`inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded-full border ${colorClasses}`}>
            <img src={iconName} alt="" className="w-3.5 h-3.5" />
            {text}
        </span>
    );
};

const StatItem: React.FC<{ icon: string, value: number | string }> = ({ icon, value }) => (
    <div className="inline-flex items-center gap-1 text-xs text-amber-800/80 px-2 py-1 bg-amber-100/60 rounded-md border border-amber-200/60">
        <img src={icon} alt="" className="w-3.5 h-3.5 opacity-70" />
        <span>{value}</span>
    </div>
);


const ListingsTab: React.FC<ListingsTabProps> = ({ products, isOwnProfile, onProductUpdate }) => {
    const { getFormattedPrice } = useCurrency();
    const [promotingProduct, setPromotingProduct] = useState<Product | null>(null);
    const [analyticsProduct, setAnalyticsProduct] = useState<Product | null>(null);

    const handlePromote = async () => {
        if (!promotingProduct) return;
        const updatedProduct = await apiService.updateListing(promotingProduct.id, { isPromoted: true });
        onProductUpdate(updatedProduct);
        setPromotingProduct(null);
    }
    
    // Mock data for stats as it's not in the Product type
    const productStats: Record<string, { views?: number, likes?: number, comments?: number }> = {
        'prod-1': { views: 124, likes: 18, comments: 3 },
        'prod-2': { views: 32 },
        'prod-3': { views: 32 },
    };

    if (products.length === 0) {
        return (
            <div className="text-center py-16">
                <p className="text-base-content/70">{isOwnProfile ? 'У вас пока нет товаров.' : 'У этого пользователя пока нет товаров.'}</p>
                {isOwnProfile && 
                    <div className="mt-6">
                        <Link to="/create" className="btn btn-primary bg-amber-800 hover:bg-amber-900 text-white shadow-sm">
                            <img src="https://api.iconify.design/lucide-plus.svg" alt="" className="w-5 h-5"/>
                            Создать первое объявление
                        </Link>
                    </div>
                }
            </div>
        );
    }
    
    return (
        <>
            {isOwnProfile && (
                <div className="flex justify-between items-center mb-6 p-4 bg-amber-50/50 rounded-lg border-b border-amber-200">
                    <h2 className="text-2xl font-bold text-amber-900 font-manrope">Ваши товары</h2>
                    <Link to="/create" className="btn btn-primary bg-amber-800 hover:bg-amber-900 text-white shadow-sm">
                        <img src="https://api.iconify.design/lucide-plus.svg" alt="" className="w-5 h-5"/>
                        Добавить товар
                    </Link>
                </div>
            )}

            <div className="space-y-4">
                {products.map(product => {
                    const stats = productStats[product.id] || { views: Math.floor(Math.random() * 50) };
                    
                    return (
                        <div key={product.id} className="bg-white border border-amber-200/80 rounded-xl p-4 flex flex-col sm:flex-row gap-4 hover:shadow-md transition-shadow">
                            <Link to={`/product/${product.id}`} className="flex-shrink-0">
                                <img src={product.imageUrls[0]} alt={product.title} className="w-full h-40 sm:w-32 sm:h-32 object-cover rounded-lg"/>
                            </Link>
                            <div className="flex-grow flex flex-col">
                                <Link to={`/product/${product.id}`} className="font-bold text-lg text-amber-900 hover:underline">
                                    {product.title}
                                </Link>
                                <div className="mt-2 flex items-center flex-wrap gap-2">
                                    <StatusBadge status={product.status} />
                                    {stats.views && <StatItem icon="https://api.iconify.design/lucide-eye.svg" value={stats.views} />}
                                    {stats.likes && <StatItem icon="https://api.iconify.design/lucide-heart.svg" value={stats.likes} />}
                                    {stats.comments && <StatItem icon="https://api.iconify.design/lucide-message-square.svg" value={stats.comments} />}
                                </div>
                                <div className="flex-grow"></div> {/* Spacer */}
                            </div>
                            <div className="flex-shrink-0 flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-4">
                                {product.price != null && <span className="font-bold text-lg text-amber-900 font-manrope whitespace-nowrap">{getFormattedPrice(product.price)}</span>}
                                <div className="flex items-center gap-2 mt-auto">
                                    {product.status === 'Active' && (
                                        <>
                                            <Link to={`/edit/${product.id}`} className="btn btn-sm btn-outline">
                                                <img src="https://api.iconify.design/lucide-pencil.svg" alt="" className="w-4 h-4 mr-1"/>
                                                Редактировать
                                            </Link>
                                            <Link to={`/product/${product.id}`} className="btn btn-sm btn-outline">
                                                <img src="https://api.iconify.design/lucide-external-link.svg" alt="" className="w-4 h-4 mr-1"/>
                                                Просмотр
                                            </Link>
                                        </>
                                    )}
                                    {product.status === 'Pending Moderation' && (
                                        <>
                                            <button className="btn btn-sm btn-outline btn-success">
                                                <img src="https://api.iconify.design/lucide-upload-cloud.svg" alt="" className="w-4 h-4 mr-1"/>
                                                Опубликовать
                                            </button>
                                            <Link to={`/edit/${product.id}`} className="btn btn-sm btn-outline">
                                                <img src="https://api.iconify.design/lucide-pencil.svg" alt="" className="w-4 h-4 mr-1"/>
                                                Редактировать
                                            </Link>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {promotingProduct && <PromoteListingModal isOpen={!!promotingProduct} onClose={() => setPromotingProduct(null)} onSubmit={handlePromote} product={promotingProduct} />}
            {analyticsProduct && <ProductAnalyticsModal isOpen={!!analyticsProduct} onClose={() => setAnalyticsProduct(null)} product={analyticsProduct} onUpdate={onProductUpdate} />}
        </>
    )
};

export default ListingsTab;