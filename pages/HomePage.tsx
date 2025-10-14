import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { apiService } from '../services/apiService';
import type { Product, FeedItem } from '../types';
import Spinner from '../components/Spinner';
import { useAuth } from '../hooks/useAuth';
import WorkshopPostCard from '../components/WorkshopPostCard';
import { useCurrency } from '../hooks/useCurrency';
import { useCountdown } from '../hooks/useCountdown';

// --- NEW SUB-COMPONENTS FOR SANDBOARD THEME ---

const NarrowAdBanner: React.FC = () => (
    <section className="w-full bg-amber-50 border-b border-amber-200/80">
        <div className="mx-auto max-w-7xl px-6 py-4">
            <Link to="/products" className="block">
                <div className="relative w-full overflow-hidden rounded-2xl border border-amber-200 bg-white">
                    <img loading="lazy" decoding="async" alt="Рекламный баннер" src="https://app.grapesjs.com/api/assets/random-image?query=%22warm%20sand%20ad%20banner%20minimal%22&w=1200&h=160" className="w-full h-32 object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-r from-amber-800/10 to-transparent"></div>
                    <div className="absolute inset-0 flex items-center justify-between px-6">
                        <p className="text-amber-900/90 font-semibold tracking-tight text-lg">Теплые предложения недели — скидки до 30%</p>
                        <span className="btn btn-primary btn-sm hidden sm:inline-flex">Подробнее</span>
                    </div>
                </div>
            </Link>
        </div>
    </section>
);

const categoryIcons: Record<string, string> = {
    'Недвижимость': 'lucide-home',
    'Авто': 'lucide-car',
    'Электроника': 'lucide-monitor',
    'Дом и сад': 'lucide-sofa',
    'Услуги': 'lucide-wrench',
    'Работа': 'lucide-briefcase',
    'Хобби': 'lucide-shapes',
    'Животные': 'lucide-paw-print',
    'Детям': 'lucide-baby',
    'Мода': 'lucide-shirt',
    'Спорт': 'lucide-dumbbell',
    'Запчасти': 'lucide-cog',
};

const CategoriesSection: React.FC = () => (
    <section className="w-full">
        <div className="mx-auto max-w-7xl px-6 py-8">
            <div className="flex items-end justify-between mb-5">
                <h2 className="text-3xl font-manrope font-bold">Категории</h2>
                <Link to="/products" className="text-sm font-medium hover:underline">Смотреть все</Link>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-4">
                {Object.entries(categoryIcons).map(([name, icon]) => (
                    <Link key={name} to={`/products?category=${encodeURIComponent(name)}`} className="col-span-1 rounded-xl border border-amber-200/80 bg-white p-4 flex flex-col items-center gap-3 transition-colors hover:border-amber-300">
                        <img loading="lazy" decoding="async" alt={name} src={`https://api.iconify.design/${icon}.svg`} className="w-7 h-7 opacity-80" />
                        <span className="text-sm text-amber-900/90 text-center">{name}</span>
                    </Link>
                ))}
            </div>
        </div>
    </section>
);

const VipProductCard: React.FC<{ product: Product }> = ({ product }) => {
    const { getFormattedPrice } = useCurrency();
    const price = getFormattedPrice(product.price);
    
    return (
        <article className="rounded-2xl border border-amber-200/80 bg-white overflow-hidden shadow-sm transition-shadow hover:shadow-md">
            <Link to={`/product/${product.id}`}>
                <div className="relative">
                    <img loading="lazy" decoding="async" alt="VIP" src="https://api.iconify.design/lucide-crown.svg" className="absolute top-3 left-3 w-10 h-10" />
                    <img loading="lazy" decoding="async" alt={product.title} src={product.imageUrls[0]} className="w-full h-44 object-cover" />
                </div>
                <div className="p-4 flex flex-col gap-2">
                    <h3 className="font-manrope font-semibold text-base-content/90 truncate">{product.title}</h3>
                    <div className="flex items-center justify-between">
                        <span className="font-semibold text-base-content">{price}</span>
                        <span className="text-xs text-base-content/70 truncate">{product.dynamicAttributes['Город'] || product.seller.name}</span>
                    </div>
                </div>
            </Link>
        </article>
    )
};

const ListingCard: React.FC<{ product: Product }> = ({ product }) => {
    const { getFormattedPrice } = useCurrency();
    const price = getFormattedPrice(product.price);

    return (
         <article className="rounded-2xl border border-amber-200/80 bg-white overflow-hidden transition-shadow hover:shadow-sm">
            <Link to={`/product/${product.id}`}>
                <img loading="lazy" decoding="async" alt={product.title} src={product.imageUrls[0]} className="w-full h-44 object-cover" />
                <div className="p-4 flex flex-col gap-2">
                    <h3 className="font-manrope font-semibold text-base-content/90 truncate">{product.title}</h3>
                    <div className="flex items-center justify-between">
                        <span className="font-semibold text-base-content">{price}</span>
                        <span className="text-xs text-base-content/70 truncate">{product.dynamicAttributes['Город'] || product.seller.name}</span>
                    </div>
                </div>
            </Link>
        </article>
    );
};

const AuctionItemCard: React.FC<{ product: Product }> = ({ product }) => {
    const { getFormattedPrice } = useCurrency();
    const { hours, minutes, seconds, isFinished } = useCountdown(product.auctionEnds);
    const bid = getFormattedPrice(product.currentBid || product.startingBid);
    
    return (
         <article className="rounded-2xl border border-amber-200/80 bg-white overflow-hidden transition-shadow hover:shadow-sm">
            <Link to={`/product/${product.id}`}>
                <div className="relative">
                    <img loading="lazy" decoding="async" alt={product.title} src={product.imageUrls[0]} className="w-full h-44 object-cover" />
                    <span className="absolute top-3 right-3 px-2.5 py-1 text-xs rounded-full bg-amber-800/90 text-white">
                        {isFinished ? 'Завершен' : `Осталось: ${hours}:${minutes}:${seconds}`}
                    </span>
                </div>
                <div className="p-4 flex flex-col gap-2">
                    <h3 className="font-manrope font-semibold text-base-content/90 truncate">{product.title}</h3>
                    <div className="flex items-center justify-between">
                        <span className="font-semibold text-base-content">{bid}</span>
                        <span className="text-xs text-base-content/70">{product.bidders?.length || 0} ставок</span>
                    </div>
                </div>
            </Link>
        </article>
    );
};


const MainListingsSection: React.FC = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'goods' | 'auctions' | 'subs'>('goods');

    const [products, setProducts] = useState<Product[]>([]);
    const [auctions, setAuctions] = useState<Product[]>([]);
    const [feed, setFeed] = useState<FeedItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [productsData, auctionsData, feedData] = await Promise.all([
                apiService.getProducts(),
                apiService.getAuctions(),
                user ? apiService.getFeedForUser(user.id).then(res => res.items) : Promise.resolve([])
            ]);
            setProducts(productsData.filter(p => !p.isAuction));
            setAuctions(auctionsData);
            setFeed(feedData);
        } catch (error) {
            console.error("Failed to fetch main listings", error);
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);
    
    const TabButton: React.FC<{tab: typeof activeTab, label: string}> = ({tab, label}) => (
        <button 
            type="button" 
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-semibold rounded-t-lg border-b-2 transition-colors ${activeTab === tab ? 'text-amber-900 border-primary bg-amber-50' : 'text-amber-900/80 border-transparent hover:text-amber-900'}`}
        >
            {label}
        </button>
    );
    
    const renderContent = () => {
        if(isLoading) return <div className="flex justify-center p-16"><Spinner/></div>
        
        if (activeTab === 'goods') {
            return <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                {products.slice(0, 8).map(p => <ListingCard key={p.id} product={p} />)}
            </div>
        }
        if (activeTab === 'auctions') {
             return <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {auctions.slice(0, 3).map(p => <AuctionItemCard key={p.id} product={p} />)}
            </div>
        }
        if (activeTab === 'subs') {
            if (!user) return <div className="text-center p-16 text-base-content/70">Войдите, чтобы видеть ленту подписок.</div>
            if (feed.length === 0) return <div className="text-center p-16 text-base-content/70">Подпишитесь на мастеров, чтобы видеть их обновления.</div>
            
            return <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {feed.map(item => <WorkshopPostCard key={item.post.id} post={item.post} seller={item.seller} />)}
            </div>
        }
        
        return null;
    }

    return (
        <section className="w-full">
            <div className="mx-auto max-w-7xl px-6 py-8">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-3xl font-manrope font-bold">Объявления</h2>
                </div>
                <div className="flex items-center gap-2 border-b border-amber-200/80 mb-6">
                    <TabButton tab="goods" label="Товары" />
                    <TabButton tab="auctions" label="Аукционы" />
                    <TabButton tab="subs" label="Подписки" />
                </div>
                <div>{renderContent()}</div>
            </div>
        </section>
    );
};

const VipProductsSection: React.FC = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        apiService.getPromotedProducts()
            .then(data => setProducts(data))
            .finally(() => setIsLoading(false));
    }, []);

    if (isLoading) return <div className="flex justify-center py-8"><Spinner /></div>;
    if (products.length === 0) return null;

    return (
        <section className="w-full bg-white/80 border-y border-amber-200/80">
            <div className="mx-auto max-w-7xl px-6 py-10">
                <div className="flex items-end justify-between mb-6">
                    <h2 className="text-3xl font-manrope font-bold">VIP товары</h2>
                    <span className="text-sm text-base-content/70">Топ предложения</span>
                </div>
                 <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                    {products.slice(0, 12).map(product => (
                        <VipProductCard key={product.id} product={product} />
                    ))}
                </div>
            </div>
        </section>
    );
};

const HomePage: React.FC = () => {
  return (
    <div className="space-y-0">
      <NarrowAdBanner />
      <CategoriesSection />
      <VipProductsSection />
      <MainListingsSection />
    </div>
  );
};

export default HomePage;
