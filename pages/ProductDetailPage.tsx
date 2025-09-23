

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { apiService } from '../services/apiService';
import type { Product, ProductVariant, Review } from '../types';
import Spinner from '../components/Spinner';
import { useAuth } from '../hooks/useAuth';
import { useCurrency } from '../hooks/useCurrency';
import { useCart } from '../hooks/useCart';
import StarRating from '../components/StarRating';
import VerifiedBadge from '../components/VerifiedBadge';
import { useCountdown } from '../hooks/useCountdown';
import BidModal from '../components/BidModal';
import { useTelegramBackButton } from '../hooks/useTelegram';
import AuthenticatedBadge from '../components/AuthenticatedBadge';
import NFTCertificateModal from '../components/NFTCertificateModal';

const Countdown: React.FC<{ targetDate: number }> = ({ targetDate }) => {
    const { days, hours, minutes, seconds, isFinished } = useCountdown(targetDate);
    
    if (isFinished) {
        return <span className="text-red-500 font-bold">Аукцион завершен</span>;
    }
    
    return (
        <div className="flex gap-4 text-center">
            <div><span className="text-3xl font-bold">{days}</span><span className="block text-xs">дней</span></div>
            <div><span className="text-3xl font-bold">{hours}</span><span className="block text-xs">часов</span></div>
            <div><span className="text-3xl font-bold">{minutes}</span><span className="block text-xs">минут</span></div>
            <div><span className="text-3xl font-bold">{seconds}</span><span className="block text-xs">секунд</span></div>
        </div>
    )
}

const ReviewCard: React.FC<{ review: Review, color: string }> = ({ review, color }) => (
    <div className={`${color} rounded-2xl p-6 shadow-sm hover:shadow-md transition duration-200`}>
      <div className="flex items-center space-x-3 mb-4">
        <img className="w-10 h-10 rounded-full object-cover" src={review.author.avatarUrl} alt={review.author.name}/>
        <div>
          <h4 className="font-medium text-gray-800">{review.author.name}</h4>
          <StarRating rating={review.rating} />
        </div>
      </div>
      <p className="text-gray-700 text-sm leading-relaxed">{review.text}</p>
      <div className="mt-4 text-xs text-gray-500">{new Date(review.timestamp).toLocaleDateString()}</div>
    </div>
);

const ProductDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();
    const navigate = useNavigate();
    useTelegramBackButton(true);

    const [product, setProduct] = useState<Product | null>(null);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const [quantity, setQuantity] = useState(1);
    const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
    const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({});

    const [isBidModalOpen, setIsBidModalOpen] = useState(false);
    const [isNftModalOpen, setIsNftModalOpen] = useState(false);
    
    const { getFormattedPrice } = useCurrency();
    const { addToCart } = useCart();
    
    useEffect(() => {
        if (!id) return;
        setIsLoading(true);
        const fetchProduct = apiService.getProductById(id)
            .then(data => {
                if (data) {
                    setProduct(data);
                    if (data.variantAttributes && data.variantAttributes.length > 0) {
                        const initialAttrs: Record<string, string> = {};
                        data.variantAttributes.forEach(attr => {
                            if(attr.options.length > 0) {
                                initialAttrs[attr.name] = attr.options[0];
                            }
                        });
                        setSelectedAttributes(initialAttrs);
                    }
                    return apiService.getReviewsByUserId(data.seller.id);
                }
                return Promise.resolve([]);
            })
            .then(reviewData => {
                setReviews(reviewData);
            });
            
        Promise.all([fetchProduct]).finally(() => setIsLoading(false));

    }, [id]);

    useEffect(() => {
        if (product?.variants && Object.keys(selectedAttributes).length > 0) {
            const foundVariant = product.variants.find(variant => 
                Object.entries(selectedAttributes).every(([key, value]) => variant.attributes[key] === value)
            );
            setSelectedVariant(foundVariant || null);
        }
    }, [selectedAttributes, product]);
    
    const handleAttributeSelect = (attributeName: string, option: string) => {
        setSelectedAttributes(prev => ({ ...prev, [attributeName]: option }));
    };

    const handleAddToCart = () => {
        if (!product) return;
        const price = selectedVariant?.salePrice || selectedVariant?.price || product.salePrice || product.price || 0;
        addToCart(product, quantity, selectedVariant || undefined, price, 'RETAIL');
    };

    const handlePlaceBid = async (amount: number) => {
        if (!product) return;
        const updatedProduct = await apiService.placeBid(product.id, amount, user.id);
        setProduct(updatedProduct);
        setIsBidModalOpen(false);
    }
    
    const handleContactSeller = async () => {
        if (!product) return;
        const chat = await apiService.findOrCreateChat(user.id, product.seller.id);
        navigate(`/chat/${chat.id}?productId=${product.id}`);
    };
    
    const displayedImage = useMemo(() => {
        if (selectedVariant?.imageUrl) return selectedVariant.imageUrl;
        return product?.imageUrls[selectedImageIndex] || '';
    }, [selectedVariant, product, selectedImageIndex]);

    const displayPrice = useMemo(() => {
        const price = selectedVariant?.price ?? product?.price ?? 0;
        const salePrice = selectedVariant?.salePrice ?? product?.salePrice;
        
        if (salePrice && salePrice < price) {
            return (
                <div className="mb-6">
                    <span className="text-3xl font-bold text-neutral">{getFormattedPrice(salePrice)}</span>
                    <span className="text-lg text-neutral/60 line-through ml-3">{getFormattedPrice(price)}</span>
                </div>
            )
        }
        return <div className="mb-6"><span className="text-3xl font-bold text-neutral">{getFormattedPrice(price)}</span></div>
    }, [product, selectedVariant, getFormattedPrice]);

    if (isLoading) {
        return <div className="flex justify-center items-center h-96"><Spinner /></div>;
    }

    if (!product) {
        return <div className="text-center text-xl text-neutral/70">Товар не найден.</div>;
    }

    const isOwner = product.seller.id === user.id;
    const hasVariants = product.variantAttributes && product.variantAttributes.length > 0;
    const isVariantInStock = hasVariants ? (selectedVariant ? selectedVariant.stock > 0 : false) : true;
    const stockCount = hasVariants ? (selectedVariant?.stock ?? 0) : (Object.values(product.dynamicAttributes).find(v => String(v).toLowerCase() === 'stock') ?? 'N/A');

    const reviewBgColors = ['bg-green-100', 'bg-yellow-100', 'bg-emerald-100', 'bg-lime-100', 'bg-teal-100', 'bg-yellow-50'];

    return (
    <>
      <div className="max-w-6xl mx-auto">
        <div className="bg-base-100 rounded-3xl shadow-lg overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8">
            {/* Image Section */}
            <div className="space-y-4">
              <div className="main-image-container">
                <img className="main-product-image w-full h-96 object-cover rounded-2xl" src={displayedImage} alt={product.title}/>
              </div>
              <div className="flex space-x-3 overflow-x-auto pb-2 scrollbar-hide">
                {product.imageUrls.map((url, index) => (
                    <img key={index} onClick={() => setSelectedImageIndex(index)} className={`w-20 h-20 object-cover rounded-lg border-2 cursor-pointer transition duration-200 ${selectedImageIndex === index && !selectedVariant?.imageUrl ? 'border-neutral' : 'border-transparent hover:border-neutral'}`} src={url} alt={`Thumbnail ${index + 1}`}/>
                ))}
              </div>
            </div>
            {/* Info Section */}
            <div className="space-y-6">
              <div>
                <h1 className="font-bold text-4xl tracking-tight mb-4">{product.title}</h1>
                <p className="text-neutral/70 mb-4">{product.description}</p>
              </div>
              
              {displayPrice}

              <div className="bg-stone-50 rounded-2xl p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <img className="w-12 h-12 rounded-full object-cover" src={product.seller.avatarUrl} alt={product.seller.name}/>
                    <div>
                      <h3 className="font-medium text-lg">{product.seller.name}</h3>
                      <div className="flex items-center gap-1">
                          <VerifiedBadge level={product.seller.verificationLevel} />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <StarRating rating={product.seller.rating} />
                    <span className="text-sm text-neutral/60">({product.seller.rating.toFixed(1)})</span>
                  </div>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="space-y-4">
                <button onClick={handleContactSeller} disabled={isOwner} className="w-full text-center border border-gray-300 text-neutral py-3 px-4 rounded-full text-lg hover:bg-gray-100 transition-colors disabled:opacity-50">
                  Написать продавцу
                </button>
                <button onClick={handleAddToCart} disabled={isOwner || !isVariantInStock} className="w-full text-center bg-neutral text-white py-3 px-4 rounded-full text-lg hover:bg-opacity-90 transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed">
                  {isOwner ? "Это ваш товар" : (!isVariantInStock ? "Нет в наличии" : "Добавить в корзину")}
                </button>
              </div>
              
               {/* Additional Info / Variants */}
              <div className="border-t pt-6">
                {hasVariants && (
                     <div className="space-y-4 mb-6">
                        {product.variantAttributes?.map(attr => (
                            <div key={attr.name}>
                                <label className="block text-sm font-medium text-neutral/70 mb-2">{attr.name}</label>
                                <div className="flex flex-wrap gap-2">
                                    {attr.options.map(option => (
                                        <button 
                                            key={option}
                                            onClick={() => handleAttributeSelect(attr.name, option)}
                                            className={`px-3 py-1 text-sm rounded-md transition-colors ${selectedAttributes[attr.name] === option ? 'bg-neutral text-white' : 'border border-gray-300 hover:bg-gray-100'}`}
                                        >
                                            {option}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    {Object.entries(product.dynamicAttributes).map(([key, value]) => (
                        <div key={key}>
                            <span className="text-neutral/60">{key}:</span>
                            <span className="font-medium ml-2">{value}</span>
                        </div>
                    ))}
                    <div>
                        <span className="text-neutral/60">В наличии:</span>
                        <span className="font-medium ml-2 text-green-600">{stockCount} шт.</span>
                    </div>
                </div>
              </div>

            </div>
          </div>
          {/* Reviews Section */}
          {reviews.length > 0 && (
            <div className="p-8 border-t border-gray-200">
                <h3 className="text-2xl font-bold mb-6 text-center">Отзывы о продавце</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {reviews.slice(0, 6).map((review, index) => (
                        <ReviewCard key={review.id} review={review} color={reviewBgColors[index % reviewBgColors.length]} />
                    ))}
                </div>
                {reviews.length > 6 && (
                    <div className="text-center mt-8">
                        <button className="px-8 py-3 bg-gradient-to-r from-green-200 to-yellow-200 text-gray-800 font-medium rounded-full hover:from-green-300 hover:to-yellow-300 transition duration-200">
                            Показать больше отзывов
                        </button>
                    </div>
                )}
            </div>
          )}
        </div>
      </div>
      {product.isAuction && <BidModal isOpen={isBidModalOpen} onClose={() => setIsBidModalOpen(false)} onSubmit={handlePlaceBid} product={product} />}
      {isNftModalOpen && <NFTCertificateModal product={product} onClose={() => setIsNftModalOpen(false)} />}
    </>
    );
};

export default ProductDetailPage;