

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiService } from '../services/apiService';
import { useAuth } from '../hooks/useAuth';
import type { Product, Collection } from '../types';
import Spinner from '../components/Spinner';
import ProductCard from '../components/ProductCard';
import { useTelegramBackButton } from '../hooks/useTelegram';

const CollectionDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [collection, setCollection] = useState<Collection | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useTelegramBackButton(true);

  useEffect(() => {
    if (!id) return;
    const fetchCollectionData = async () => {
      setIsLoading(true);
      try {
        const data = await apiService.getCollectionById(id, user.id);
        if (data) {
          setCollection(data.collection);
          setProducts(data.products);
        }
      } catch (error) {
        console.error("Failed to fetch collection", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCollectionData();
  }, [id, user.id]);

  if (isLoading) {
    return <div className="flex justify-center items-center h-96"><Spinner /></div>;
  }

  if (!collection) {
    return <div className="text-center text-2xl text-base-content/70 mt-16">Коллекция не найдена</div>;
  }

  return (
    <div>
      <div className="mb-8">
        <Link to="/profile" className="text-sm text-secondary hover:text-primary mb-4 block">&larr; Вернуться в профиль</Link>
        <h1 className="text-4xl font-bold text-white mb-2">{collection.name}</h1>
        <p className="text-base-content/70">{products.length} товаров</p>
      </div>

      {products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-base-100 rounded-lg">
          <h2 className="text-2xl font-bold text-white mb-2">В этой коллекции пока пусто</h2>
          <p className="text-base-content/70">Нажмите кнопку "Сохранить" на товарах, чтобы добавить их сюда.</p>
        </div>
      )}
    </div>
  );
};

export default CollectionDetailPage;