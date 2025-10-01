
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import type { Product } from '../types';
import { useWishlist } from '../hooks/useWishlist';
import { useCollections } from '../hooks/useCollections';
import { useCurrency } from '../hooks/useCurrency';
import CollectionSelectModal from './CollectionSelectModal';
import VerifiedBadge from './VerifiedBadge';
import DynamicIcon from './DynamicIcon';

interface ProductCardProps {
  product: Product;
  isSoldView?: boolean;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, isSoldView = false }) => {
  const { isWishlisted, addToWishlist, removeFromWishlist } = useWishlist();
  const { isSavedInAnyCollection } = useCollections();
  const { getFormattedPrice } = useCurrency();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isWishlisted(product.id)) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(product.id);
    }
  };

  const handleCollectionClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsModalOpen(true);
  };

  const hasDiscount = product.salePrice && product.salePrice < (product.price ?? Infinity);
  const displayPrice = hasDiscount ? product.salePrice : product.price;

  const isFavorited = isWishlisted(product.id);
  const isSaved = isSavedInAnyCollection(product.id);

  return (
    <>
      <div className="card bg-base-100 border border-base-300 group transition-all duration-300 hover:shadow-2xl hover:shadow-primary/20 hover:-translate-y-1 flex flex-col h-full">
        <Link to={`/product/${product.id}`} className="block">
          <div className="relative">
            <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden">
              <img
                src={product.imageUrls[0]}
                alt={product.title}
                className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            {isSoldView && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <span className="text-white font-bold text-lg tracking-widest uppercase border-2 border-white px-4 py-2">ПРОДАНО</span>
              </div>
            )}
            <div className="absolute top-2 right-2 flex flex-col gap-2">
              <button
                onClick={handleWishlistClick}
                className={`w-9 h-9 flex items-center justify-center rounded-full transition-colors ${
                  isFavorited ? 'bg-red-500 text-white' : 'bg-black/40 backdrop-blur-sm text-white hover:bg-red-500/80'
                }`}
                aria-label="Добавить в избранное"
              >
                <DynamicIcon name="wishlist-heart" className="w-5 h-5" fallback={
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9.653 16.915l-.005-.003-.019-.01a20.759 20.759 0 01-1.162-.682 22.045 22.045 0 01-2.582-1.9-22.348 22.348 0 01-2.949-2.582 20.759 20.759 0 01-1.162-.682A9.96 9.96 0 012 10V6.652a2.492 2.492 0 011.666-2.311 2.493 2.493 0 012.134.12l.28.168c.002 0 .003.001.005.002l.004.002c.002 0 .003.001.005.002l.005.002a.002.002 0 00.005 0l.005-.002.004-.002a.002.002 0 00.005-.002l.004-.002.28-.168a2.493 2.493 0 012.134-.12 2.492 2.492 0 011.666 2.311V10c0 1.638-.403 3.228-1.162 4.682-.01.012-.02.023-.03.034l-.005.003z" />
                  </svg>
                }/>
              </button>
              <button
                onClick={handleCollectionClick}
                className={`w-9 h-9 flex items-center justify-center rounded-full transition-colors ${
                  isSaved ? 'bg-sky-500 text-white' : 'bg-black/40 backdrop-blur-sm text-white hover:bg-sky-500/80'
                }`}
                aria-label="Сохранить в коллекцию"
              >
                 <DynamicIcon name="collection-add" className="w-5 h-5" fallback={
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M5.5 16.5A1.5 1.5 0 014 15V5.5A1.5 1.5 0 015.5 4h9A1.5 1.5 0 0116 5.5V15a1.5 1.5 0 01-1.5 1.5h-9zM10 6a.75.75 0 00-1.5 0v1.5H7a.75.75 0 000 1.5h1.5V10a.75.75 0 001.5 0V9h1.5a.75.75 0 000-1.5H10V6z" />
                    </svg>
                 }/>
              </button>
            </div>
          </div>
        </Link>
        <div className="p-4 flex-grow flex flex-col">
          <h3 className="font-semibold text-base-content truncate flex-grow" title={product.title}>
            {product.title}
          </h3>
          <div className="mt-2">
            <div className="flex items-center gap-2 text-sm">
                <img src={product.seller.avatarUrl} alt={product.seller.name} className="w-6 h-6 rounded-full" />
                <span className="text-base-content/70 truncate">{product.seller.name}</span>
                <VerifiedBadge level={product.seller.verificationLevel}/>
            </div>
            <div className="flex items-baseline justify-between mt-2">
                {displayPrice !== undefined ? (
                    <p className="text-xl font-bold text-primary">{getFormattedPrice(displayPrice)}</p>
                ) : <div/>}
                {hasDiscount && product.price && (
                    <p className="text-base text-base-content/50 line-through">{getFormattedPrice(product.price)}</p>
                )}
            </div>
          </div>
        </div>
      </div>
      {isModalOpen && <CollectionSelectModal productId={product.id} onClose={() => setIsModalOpen(false)} />}
    </>
  );
};

export default ProductCard;