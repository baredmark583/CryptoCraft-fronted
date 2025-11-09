import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { apiService } from '../services/apiService';
import type { Product } from '../types';
import type { CategorySchema } from '../constants';
import ProductCard from '../components/ProductCard';
import AuctionCard from '../components/AuctionCard';
import Spinner from '../components/Spinner';
import FilterBar from '../components/FilterBar';
import { useTelegramBackButton } from '../hooks/useTelegram';
import DynamicIcon from '../components/DynamicIcon';

interface Filters {
    category: string;
    priceMin?: number;
    priceMax?: number;
    sortBy: 'priceAsc' | 'priceDesc' | 'newest' | 'rating';
    specialFilter: 'all' | 'sold' | 'verified';
    dynamic: { [key: string]: string[] };
}

const ProductListPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialCategory = searchParams.get('category') || 'Все';

  useTelegramBackButton(true);

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<CategorySchema[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'catalog' | 'auctions'>('catalog');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  const [filters, setFilters] = useState<Filters>({
    category: initialCategory,
    sortBy: 'newest',
    specialFilter: 'all',
    dynamic: {},
  });
  
  useEffect(() => {
    apiService.getCategories().then(setCategories);
  }, []);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
        let data: Product[];
        if (activeTab === 'catalog') {
            data = await apiService.getProducts(filters);
        } else {
            data = await apiService.getAuctions();
        }
        setProducts(data);
    } catch (error) {
        console.error(`Failed to fetch ${activeTab}:`, error);
    } finally {
        setIsLoading(false);
    }
  }, [filters, activeTab]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  useEffect(() => {
    const categoryFromUrl = searchParams.get('category') || 'Все';
    if (categoryFromUrl !== filters.category) {
      setFilters(prev => ({ ...prev, category: categoryFromUrl, dynamic: {} }));
    }
  }, [searchParams, filters.category]);

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilters(prev => ({ ...prev, sortBy: e.target.value as Filters['sortBy'] }));
  };

  const handleSpecialFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilters(prev => ({ ...prev, specialFilter: e.target.value as Filters['specialFilter'] }));
  };

  const soldView = useMemo(() => filters.specialFilter === 'sold', [filters.specialFilter]);
  const pageTitle = useMemo(
    () => activeTab === 'catalog' ? (filters.category === 'Все' ? 'Каталог' : filters.category) : 'Аукцион',
    [activeTab, filters.category],
  );

  const renderContent = () => {
    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-96">
                <Spinner />
            </div>
        );
    }
    if (products.length === 0) {
        return (
            <div className="text-center py-16 bg-base-100 rounded-lg">
                <h2 className="text-2xl font-bold text-white mb-2">Товары не найдены</h2>
                <p className="text-base-content/70">Попробуйте изменить фильтры или загляните позже.</p>
            </div>
        );
    }

    if (activeTab === 'catalog') {
        return (
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map(product => (
                    <ProductCard key={product.id} product={product} isSoldView={soldView} />
                ))}
            </div>
        );
    }
    
     if (activeTab === 'auctions') {
        return (
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map(auction => (
                    <AuctionCard key={auction.id} product={auction} />
                ))}
            </div>
        );
    }
    return null;
  }
  
  return (
    <div className="flex flex-col lg:flex-row gap-8">
        {isFilterOpen && (
             <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setIsFilterOpen(false)}></div>
        )}
        
        <aside className={`w-full max-w-xs lg:w-1/4 lg:flex-shrink-0 lg:sticky lg:top-24 self-start transform transition-transform duration-300 ${isFilterOpen ? 'translate-x-0' : '-translate-x-full'} fixed top-0 left-0 h-full bg-base-100 p-4 z-50 lg:z-30 lg:relative lg:translate-x-0 lg:p-0 overflow-y-auto scrollbar-hide`}>
             <div className="flex justify-between items-center lg:hidden mb-4">
                <h2 className="text-xl font-bold">Фильтры</h2>
                <button onClick={() => setIsFilterOpen(false)} className="p-2 text-white text-2xl">&times;</button>
             </div>
             <FilterBar filters={filters} setFilters={setFilters} products={products} categories={categories} />
        </aside>

        <main className="flex-grow w-full">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-2">
                <h1 className="text-3xl font-bold text-white">{pageTitle}</h1>
                 <div className="flex items-center gap-2">
                    <div className="flex items-center p-1 bg-base-100 rounded-lg">
                        <button onClick={() => setActiveTab('catalog')} className={`py-2 px-4 text-sm font-bold transition-colors rounded-md ${activeTab === 'catalog' ? 'bg-primary text-primary-content' : 'text-base-content/70 hover:text-white'}`}>
                            Каталог
                        </button>
                        <button onClick={() => setActiveTab('auctions')} className={`py-2 px-4 text-sm font-bold transition-colors rounded-md ${activeTab === 'auctions' ? 'bg-primary text-primary-content' : 'text-base-content/70 hover:text-white'}`}>
                            Аукцион
                        </button>
                    </div>
                     <button onClick={() => setIsFilterOpen(true)} className="lg:hidden p-2 bg-base-100 rounded-md">
                        <DynamicIcon name="filter-toggle" className="w-6 h-6" />
                    </button>
                </div>
            </div>

            {/* Top controls */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6 p-4 bg-base-100 rounded-lg">
                <div className="flex-1">
                     <label className="block text-sm font-medium text-base-content/70 mb-1">Показать</label>
                     <select value={filters.specialFilter} onChange={handleSpecialFilterChange} className="w-full bg-base-200 border border-base-300 rounded-md p-2">
                        <option value="all">Все доступные</option>
                        <option value="sold">Проданные</option>
                        <option value="verified">От проверенных мастеров</option>
                    </select>
                </div>
                 <div className="flex-1">
                     <label className="block text-sm font-medium text-base-content/70 mb-1">Сортировать по</label>
                    <select value={filters.sortBy} onChange={handleSortChange} className="w-full bg-base-200 border border-base-300 rounded-md p-2">
                        <option value="newest">Новизне</option>
                        <option value="priceAsc">Цене (по возрастанию)</option>
                        <option value="priceDesc">Цене (по убыванию)</option>
                        <option value="rating">Рейтингу продавца</option>
                    </select>
                </div>
            </div>
            
            {renderContent()}
        </main>
    </div>
  )
}

export default ProductListPage;
