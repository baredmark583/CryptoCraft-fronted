
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import type { Product } from '../types';
import { useCurrency } from '../hooks/useCurrency';
import { useWishlist } from '../hooks/useWishlist';
import { useCollections } from '../hooks/useCollections';
import CollectionSelectModal from './CollectionSelectModal';
import VerifiedBadge from './VerifiedBadge';

interface ProductCardProps {
  product: Product;
  isSoldView?: boolean;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, isSoldView }) => {
  const { getFormattedPrice } = useCurrency();
  const { isWishlisted, addToWishlist, removeFromWishlist } = useWishlist();
  const { isSavedInAnyCollection } = useCollections();
  
  const [isCollectionModalOpen, setIsCollectionModalOpen] = useState(false);

  const hasSale = product.salePrice && product.price && product.salePrice < product.price;
  const inWishlist = isWishlisted(product.id);
  const inCollection = isSavedInAnyCollection(product.id);

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    inWishlist ? removeFromWishlist(product.id) : addToWishlist(product.id);
  };
  
  const handleCollectionToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsCollectionModalOpen(true);
  };

  return (
    <>
      <div className="bg-brand-surface rounded-lg overflow-hidden group transition-all duration-300 hover:shadow-2xl hover:shadow-brand-primary/20 hover:-translate-y-1">
        <Link to={isSoldView ? '#' : `/product/${product.id}`} className={`block ${isSoldView ? 'pointer-events-none cursor-default' : ''}`}>
          <div className="relative">
            <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden">
              <img
                src={product.imageUrls[0]}
                alt={product.title}
                className={`w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300 ${isSoldView ? 'grayscale' : ''}`}
              />
            </div>
            {isSoldView && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <span className="text-white text-3xl font-bold tracking-widest border-4 border-white px-6 py-3 rotate-[-10deg] opacity-90 select-none">ПРОДАНО</span>
              </div>
            )}
            {product.productType === 'SERVICE' && !isSoldView && (
              <div className="absolute top-2 left-2 bg-indigo-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                Услуга
              </div>
            )}
            {hasSale && !isSoldView && product.productType !== 'SERVICE' && (
              <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                SALE
              </div>
            )}
            {!isSoldView && (
                <div className="absolute top-2 right-2 flex flex-col gap-2">
                   <button onClick={handleWishlistToggle} className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${inWishlist ? 'bg-red-500/80 text-white' : 'bg-black/50 hover:bg-red-500/80 text-white/80 hover:text-white'}`} title={inWishlist ? "Удалить из избранного" : "Добавить в избранное"}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                          <path d="M9.653 16.915l-.005-.003-.019-.01a20.759 20.759 0 01-1.162-.682 22.045 22.045 0 01-2.582-1.9-22.348 22.348 0 01-2.949-2.582 20.759 20.759 0 01-1.162-.682 1.348 1.348 0 00-.03-.028 1.348 1.348 0 00-.03-.028 1.348 1.348 0 00-.03-.028l-.005-.003A9.96 9.96 0 012 10V6.652a2.492 2.492 0 011.666-2.311 2.493 2.493 0 012.134.12l.28.168.026.016.026.016.025.015.025.015.025.015.025.015.025.015.025.015.025.015.025.015.025.015.025.015.025.015.025.015.025.015.025.015c.002 0 .003.001.005.002l.004.002c.002 0 .003.001.005.002l.005.002c.002 0 .003.001.004.002l.005.002.009.004.01.004.01.004.01.003.01.003.01.003.01.002.01.002.01.002.004.001.004.001.004.001.004.001c.002 0 .003 0 .005 0a.002.002 0 00.005 0c.002 0 .003 0 .005 0l.004-.001.004-.001.004-.001.004-.001.01-.002.01-.002.01-.002.01-.003.01-.003.01-.003.01-.004.01-.004.009-.004.005-.002.004-.002c.002-.001.003-.002.005-.002l.004-.002.005-.003.025-.015.025-.015.025-.015.025-.015.025-.015.025-.015.025-.015.025-.015.025-.015.025-.015.026-.016.026-.016.28-.168a2.493 2.493 0 012.134-.12 2.492 2.492 0 011.666 2.311V10c0 1.638-.403 3.228-1.162 4.682-.01.012-.02.023-.03.034l-.005.003z" />
                        </svg>
                    </button>
                     <button onClick={handleCollectionToggle} className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${inCollection ? 'bg-sky-500/80 text-white' : 'bg-black/50 hover:bg-sky-500/80 text-white/80 hover:text-white'}`} title="Сохранить в коллекцию">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                          <path d="M5.433 13.917l1.262-3.155A4 4 0 017.58 9.42l6.92-6.918a2.121 2.121 0 013 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 01-.65-.65z" />
                          <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0010 3H4.75A2.75 2.75 0 002 5.75v9.5A2.75 2.75 0 004.75 18h9.5A2.75 2.75 0 0017 15.25V10a.75.75 0 00-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5z" />
                        </svg>
                    </button>
                </div>
            )}
          </div>

          <div className="p-4">
            <h3 className="font-semibold text-brand-text-primary truncate" title={product.title}>
              {product.title}
            </h3>
            <div className="flex items-center mt-1">
              <img src={product.seller.avatarUrl} alt={product.seller.name} className="w-5 h-5 rounded-full mr-2" />
              <p className="text-sm text-brand-text-secondary truncate flex-shrink min-w-0">{product.seller.name}</p>
              {product.seller.verificationLevel && product.seller.verificationLevel !== 'NONE' && (
                <div className="ml-1.5 flex-shrink-0">
                  <VerifiedBadge level={product.seller.verificationLevel} />
                </div>
              )}
            </div>
            <div className="flex items-baseline justify-between mt-2">
              <div className="flex items-baseline gap-2">
                 {isSoldView ? (
                    <p className="text-xl font-bold text-brand-primary">{getFormattedPrice(product.salePrice || product.price || 0)}</p>
                 ) : (
                    <>
                        <p className="text-xl font-bold text-brand-primary">{getFormattedPrice(hasSale ? product.salePrice! : (product.price || 0))}</p>
                        {hasSale && <p className="text-sm text-brand-text-secondary line-through">{getFormattedPrice(product.price || 0)}</p>}
                    </>
                 )}
              </div>
            </div>
          </div>
        </Link>
      </div>
      {isCollectionModalOpen && (
          <CollectionSelectModal productId={product.id} onClose={() => setIsCollectionModalOpen(false)} />
      )}
    </>
  );
};

export default ProductCard;
