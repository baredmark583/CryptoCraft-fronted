
import React, { useState, useEffect, useCallback, useMemo } from 'react';
// FIX: Replaced `useSearchParams` with `useLocation` for compatibility with react-router-dom v5.
import { useLocation } from 'react-router-dom';
import { apiService } from '../services/apiService';
import { geminiService } from '../services/geminiService';
import type { Product, StructuredSearchQuery } from '../types';
import ProductCard from '../components/ProductCard';
import Spinner from '../components/Spinner';
import FilterBar from '../components/FilterBar';
// FIX: Correctly import constant
import { CATEGORIES } from '../constants';
import { useTelegramBackButton } from '../hooks/useTelegram';

interface Filters {
    query?: string,
    keywords?: string[],
    category: string;
    priceMin?: number;
    priceMax?: number;
    sortBy: 'priceAsc' | 'priceDesc' | 'newest' | 'rating';
    dynamic: { [key: string]: string[] };
}

const SearchResultsPage: React.FC = () => {
  // FIX: Replaced `useSearchParams` with `useLocation` for compatibility with react-router-dom v5.
  const { search } = useLocation();
  const searchParams = useMemo(() => new URLSearchParams(search), [search]);
  const query = searchParams.get('q') || '';
  
  useTelegramBackButton(true);

  const [products, setProducts] = useState<Product[]>([]);
  const [isAiProcessing, setIsAiProcessing] = useState(true);
  const [isFetchingProducts, setIsFetchingProducts] = useState(false);
  const [aiResponse, setAiResponse] = useState<StructuredSearchQuery | null>(null);

  const [filters, setFilters] = useState<Filters>({
    query: query,
    category: 'Все',
    sortBy: 'newest',
    dynamic: {},
  });

  const runAiSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery) {
        setIsAiProcessing(false);
        return;
    }
    setIsAiProcessing(true);
    const structuredQuery = await geminiService.generateSearchQuery(searchQuery);
    setAiResponse(structuredQuery);
    setFilters(prev => ({
        ...prev,
        keywords: structuredQuery.keywords,
        category: structuredQuery.category
    }));
    setIsAiProcessing(false);
  }, []);

  const fetchProducts = useCallback(async () => {
      if (isAiProcessing) return; // Wait for AI to finish
      setIsFetchingProducts(true);
      const data = await apiService.getProducts(filters);
      setProducts(data);
      setIsFetchingProducts(false);
  }, [filters, isAiProcessing]);

  useEffect(() => {
    runAiSearch(query);
  }, [query, runAiSearch]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const isLoading = isAiProcessing || isFetchingProducts;

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col justify-center items-center h-64 bg-brand-surface rounded-lg">
          {isAiProcessing ? (
             <>
                <h2 className="text-xl font-bold text-white mb-4">🤖 Анализируем ваш запрос с помощью ИИ...</h2>
                <Spinner />
             </>
          ) : (
             <Spinner />
          )}
        </div>
      );
    }

    if (products.length === 0) {
      return (
        <div className="text-center py-16 bg-brand-surface rounded-lg">
          <h2 className="text-2xl font-bold text-white mb-2">Ничего не найдено</h2>
          <p className="text-brand-text-secondary">Попробуйте изменить ваш поисковый запрос или фильтры.</p>
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

  return (
    <div>
      <section className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
            Результаты поиска по запросу: <span className="text-brand-primary">"{query}"</span>
        </h1>
         {!isLoading && <p className="text-brand-text-secondary">Найдено товаров: {products.length}</p>}
      </section>
      
      {aiResponse && !isAiProcessing && (
        <div className="mb-6 p-4 bg-brand-surface rounded-lg">
            <h3 className="text-sm font-semibold text-brand-text-secondary mb-2">Результаты по теме:</h3>
            <div className="flex flex-wrap gap-2">
                {aiResponse.keywords.map(keyword => (
                    <span key={keyword} className="px-3 py-1 text-sm bg-brand-primary/20 text-brand-primary rounded-full">{keyword}</span>
                ))}
            </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1">
             <FilterBar filters={filters} setFilters={setFilters} products={products} categories={CATEGORIES} />
          </div>
          <div className="lg:col-span-3">
             {renderContent()}
          </div>
      </div>
    </div>
  );
};

export default SearchResultsPage;
