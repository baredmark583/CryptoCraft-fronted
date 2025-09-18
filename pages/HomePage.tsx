import React, { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/apiService';
import type { Product, FeedItem } from '../types';
import ProductCard from '../components/ProductCard';
import Spinner from '../components/Spinner';
import { useAuth } from '../hooks/useAuth';
import WorkshopPostCard from '../components/WorkshopPostCard';
import PromotionalBanner from '../components/PromotionalBanner';
import CategoryGrid from '../components/CategoryGrid';

const FeaturedProducts: React.FC = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchPromoted = async () => {
            setIsLoading(true);
            try {
                const data = await apiService.getPromotedProducts();
                setProducts(data);
            } catch (error) {
                console.error("Failed to fetch promoted products:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchPromoted();
    }, []);

    if (isLoading) return <div className="flex justify-center py-8"><Spinner /></div>;
    if (products.length === 0) return null;

    return (
        <section className="mb-12">
            <div className="mb-4">
                 <h2 className="text-3xl font-bold text-white mb-1">✨ Промо-товары</h2>
                 <p className="text-brand-text-secondary">Особые предложения от наших лучших мастеров.</p>
            </div>
            <div className="flex space-x-6 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
                {products.map(product => (
                   <div key={product.id} className="flex-shrink-0 w-80">
                        <ProductCard product={product} />
                   </div>
                ))}
            </div>
        </section>
    );
};

const PersonalizedFeed: React.FC = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'forYou' | 'following'>('forYou');
    const [isLoading, setIsLoading] = useState(true);
    
    const [forYouProducts, setForYouProducts] = useState<Product[]>([]);
    const [followingFeed, setFollowingFeed] = useState<{ items: FeedItem[], isDiscovery: boolean } | null>(null);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            if (activeTab === 'forYou') {
                const data = await apiService.getForYouFeed(user.id);
                setForYouProducts(data);
            } else {
                const data = await apiService.getFeedForUser(user.id);
                setFollowingFeed(data);
            }
        } catch (error) {
            console.error(`Failed to fetch ${activeTab} feed:`, error);
        } finally {
            setIsLoading(false);
        }
    }, [activeTab, user.id]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="flex justify-center py-16 bg-brand-surface rounded-lg mt-6">
                    <Spinner />
                </div>
            );
        }

        if (activeTab === 'forYou') {
            if (forYouProducts.length === 0) {
                 return <div className="text-center py-16 bg-brand-surface rounded-lg mt-6"><p className="text-brand-text-secondary">Мы пока не можем подобрать вам рекомендации. Совершите первую покупку!</p></div>;
            }
            return (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-6">
                    {forYouProducts.map(product => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
            );
        }

        if (activeTab === 'following') {
            if (!followingFeed || followingFeed.items.length === 0) {
                 return <div className="text-center py-16 bg-brand-surface rounded-lg mt-6"><p className="text-brand-text-secondary">{followingFeed?.isDiscovery ? 'Подпишитесь на мастеров, чтобы видеть их обновления здесь.' : 'В вашей ленте пока нет постов.'}</p></div>;
            }
            return (
                <div className="flex space-x-6 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide mt-6">
                    {followingFeed.items.map(({ post, seller }) => (
                        <div key={post.id} className="flex-shrink-0 w-full sm:w-96">
                            <WorkshopPostCard post={post} seller={seller} />
                        </div>
                    ))}
                </div>
            );
        }

        return null;
    };

    return (
        <section className="mb-12">
            <div className="flex items-center border-b border-brand-border mb-4">
                <button onClick={() => setActiveTab('forYou')} className={`py-3 px-4 text-lg font-semibold transition-colors ${activeTab === 'forYou' ? 'text-brand-primary border-b-2 border-brand-primary' : 'text-brand-text-secondary hover:text-white'}`}>
                    Для вас
                </button>
                 <button onClick={() => setActiveTab('following')} className={`py-3 px-4 text-lg font-semibold transition-colors ${activeTab === 'following' ? 'text-brand-primary border-b-2 border-brand-primary' : 'text-brand-text-secondary hover:text-white'}`}>
                    Подписки
                </button>
            </div>
            {renderContent()}
        </section>
    );
};

const HomePage: React.FC = () => {
  return (
    <div className="space-y-12">
      <PromotionalBanner />
      
      <CategoryGrid />

      <FeaturedProducts />
      
      <PersonalizedFeed />
      
    </div>
  );
};

export default HomePage;
