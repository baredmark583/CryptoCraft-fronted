import React, { useState, useEffect } from 'react';
import { useWishlist } from '../hooks/useWishlist';
import { apiService } from '../services/apiService';
import type { Product } from '../types';
import Spinner from './Spinner';
import ProductCard from './ProductCard';

const WishlistTab: React.FC = () => {
    const { wishlist } = useWishlist();
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchWishlistProducts = async () => {
            if (wishlist.length === 0) {
                setProducts([]);
                setIsLoading(false);
                return;
            }
            setIsLoading(true);
            try {
                const data = await apiService.getProductsByIds(wishlist);
                setProducts(data);
            } catch (error) {
                console.error("Failed to fetch wishlist products:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchWishlistProducts();
    }, [wishlist]);

    if (isLoading) {
        return <div className="flex justify-center py-8"><Spinner /></div>;
    }

    if (products.length === 0) {
        return (
            <div className="text-center py-16 bg-brand-surface rounded-lg">
                <p className="text-brand-text-secondary">Ваш список избранного пуст.</p>
                <p className="text-brand-text-secondary text-sm mt-2">Нажимайте на сердечко на товарах, чтобы добавить их сюда.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map(product => (
                <ProductCard key={product.id} product={product} />
            ))}
        </div>
    );
};

export default WishlistTab;
