import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import type { Product } from '../types';
import ProductCard from './ProductCard';
import PromoteListingModal from './PromoteListingModal';
import ProductAnalyticsModal from './ProductAnalyticsModal';
import DynamicIcon from './DynamicIcon';
import { apiService } from '../services/apiService';

interface ListingsTabProps {
    products: Product[];
    isOwnProfile: boolean;
    onProductUpdate: (product: Product) => void;
}

const ListingsTab: React.FC<ListingsTabProps> = ({ products, isOwnProfile, onProductUpdate }) => {
    const [promotingProduct, setPromotingProduct] = useState<Product | null>(null);
    const [analyticsProduct, setAnalyticsProduct] = useState<Product | null>(null);

    const handlePromote = async () => {
        if (!promotingProduct) return;
        const updatedProduct = await apiService.updateListing(promotingProduct.id, { isPromoted: true });
        onProductUpdate(updatedProduct);
        setPromotingProduct(null);
    }
    
    if (products.length === 0) {
        return (
            <div className="text-center py-16">
                <p className="text-base-content/70">{isOwnProfile ? 'У вас пока нет товаров.' : 'У этого пользователя пока нет товаров.'}</p>
                {isOwnProfile && <Link to="/create" className="btn btn-primary mt-4">Создать первое объявление</Link>}
            </div>
        );
    }
    
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
                                <button onClick={() => setAnalyticsProduct(product)} className="text-sm p-2 rounded-lg bg-base-200/50 hover:bg-base-300/50" title="Аналитика">
                                    <DynamicIcon name="analytics" className="w-5 h-5" fallback={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M11 2a1 1 0 10-2 0v1a1 1 0 102 0V2zM15.657 5.657a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 14.95a1 1 0 001.414 1.414l.707-.707a1 1 0 00-1.414-1.414l-.707.707zM2 10a1 1 0 011-1h1a1 1 0 110 2H3a1 1 0 01-1-1zM10 4a6 6 0 100 12 6 6 0 000-12zM10 16a6 6 0 01-6-6 6 6 0 1112 0 6 6 0 01-6 6z" /></svg>} />
                                </button>
                                <button onClick={() => setPromotingProduct(product)} className="text-sm p-2 rounded-lg bg-base-200/50 hover:bg-base-300/50" title="Продвигать">
                                    <DynamicIcon name="promote" className="w-5 h-5 text-yellow-400" fallback={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-11.25a.75.75 0 00-1.5 0v4.59L7.3 9.24a.75.75 0 00-1.1 1.02l3.25 3.5a.75.75 0 001.1 0l3.25-3.5a.75.75 0 10-1.1-1.02l-1.95 2.1V6.75z" clipRule="evenodd" /></svg>} />
                                </button>
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

export default ListingsTab;
