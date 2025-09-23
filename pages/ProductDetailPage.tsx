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

const ReviewCard: React.FC<{ review: Review }> = ({ review }) => (
    <div className="bg-base-200 p-6 rounded-2xl">
        <div className="flex items-center space-x-3 mb-4">
            <img className="w-10 h-10 rounded-full object-cover" src={review.author.avatarUrl} alt={review.author.name}/>
            <div>
                <h4 className="font-bold">{review.author.name}</h4>
                <StarRating rating={review.rating} />
            </div>
        </div>
        <p className="text-base-content/70 text-sm leading-relaxed">{review.text}</p>
        <div className="mt-4 text-xs text-base-content/50">{new Date(review.timestamp).toLocaleDateString()}</div>
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
        apiService.getProductById(id)
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
            })
            .finally(() => setIsLoading(false));
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
        if (!product || !user) return;
        const price = selectedVariant?.salePrice || selectedVariant?.price || product.salePrice || product.price || 0;
        addToCart(product, quantity, selectedVariant || undefined, price, 'RETAIL');
    };

    const handlePlaceBid = async (amount: number) => {
        if (!product || !user) return;
        const updatedProduct = await apiService.placeBid(product.id, amount, user.id);
        setProduct(updatedProduct);
        setIsBidModalOpen(false);
    }
    
    const handleContactSeller = async () => {
        if (!product || !user) return;
        const chat = await apiService.findOrCreateChat(user.id, product.seller.id);
        navigate(`/chat/${chat.id}?productId=${product.id}`);
    };
    
    const displayedImage = useMemo(() => {
        if (selectedVariant?.imageUrl) return selectedVariant.imageUrl;
        return product?.imageUrls[selectedImageIndex] || '';
    }, [selectedVariant, product, selectedImageIndex]);


    if (isLoading) {
        return <div className="flex justify-center items-center h-96"><Spinner /></div>;
    }

    if (!product || !user) {
        return <div className="text-center text-xl text-base-content/70">Товар не найден.</div>;
    }

    const isOwner = product.seller.id === user.id;
    const hasVariants = product.variantAttributes && product.variantAttributes.length > 0;
    
    const currentDisplayableVariant = useMemo(() => {
        if (hasVariants) {
            return selectedVariant;
        }
        return product?.variants?.[0] || null;
    }, [hasVariants, selectedVariant, product]);

    const isStockAvailable = !hasVariants || (currentDisplayableVariant?.stock ?? 0) > 0;
    const stockCount = hasVariants ? (currentDisplayableVariant?.stock ?? 0) : 0;
    
    return (
    <>
        <div className="container mx-auto px-4 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">

                {/* --- ПРАВАЯ КОЛОНКА (Сайдбар с действиями) --- */}
                {/* На мобильных этот блок будет ПЕРВЫМ (`order-1`) */}
                <div className="lg:col-span-1 order-1 lg:order-2 lg:sticky lg:top-24 self-start">
                    <div className="bg-base-200 rounded-2xl p-6 space-y-6">
                        <div>
                            <h1 className="font-bold text-3xl tracking-tight mb-2">{product.title}</h1>
                        </div>
                        
                        <div>
                            {(() => {
                                const priceSource = hasVariants ? selectedVariant : (product.variants?.[0] || product);
                                const price = priceSource?.price ?? product?.price ?? 0;
                                const salePrice = priceSource?.salePrice ?? product?.salePrice;
                                
                                if (salePrice && salePrice < price) {
                                    return (
                                        <div>
                                            <span className="text-4xl font-bold text-base-content">{getFormattedPrice(salePrice)}</span>
                                            <span className="text-xl text-base-content/60 line-through ml-3">{getFormattedPrice(price)}</span>
                                        </div>
                                    )
                                }
                                return <div><span className="text-4xl font-bold text-base-content">{getFormattedPrice(price)}</span></div>
                            })()}
                        </div>
                        
                        {hasVariants && (
                            <div className="space-y-4 border-t border-base-300 pt-6">
                                {product.variantAttributes?.map(attr => (
                                    <div key={attr.name}>
                                        <label className="block text-sm font-medium text-base-content/70 mb-2">{attr.name}</label>
                                        <div className="flex flex-wrap gap-2">
                                            {attr.options.map(option => (
                                                <button 
                                                    key={option}
                                                    onClick={() => handleAttributeSelect(attr.name, option)}
                                                    className={`px-4 py-2 text-sm rounded-lg transition-all duration-200 ${selectedAttributes[attr.name] === option ? 'bg-primary text-primary-content scale-105 shadow-md' : 'bg-base-100 hover:bg-base-300'}`}
                                                >
                                                    {option}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        
                        <div className="text-sm">
                            <span className="text-base-content/60">В наличии:</span>
                            <span className={`font-bold ml-2 ${isStockAvailable ? 'text-green-500' : 'text-red-500'}`}>
                                {isStockAvailable ? (!hasVariants ? 'В наличии' : `${stockCount} шт.`) : 'Нет в наличии'}
                            </span>
                        </div>

                        <div className="space-y-3 pt-4 border-t border-base-300">
                            <button onClick={handleAddToCart} disabled={isOwner || !isStockAvailable} className="w-full text-center bg-primary text-primary-content py-3.5 px-4 rounded-xl text-lg font-bold hover:bg-primary-focus transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed">
                                {isOwner ? "Это ваш товар" : (!isStockAvailable ? "Нет в наличии" : "Добавить в корзину")}
                            </button>
                            <button onClick={handleContactSeller} disabled={isOwner} className="w-full text-center bg-base-300 py-3.5 px-4 rounded-xl text-lg font-bold hover:bg-base-100 transition-colors disabled:opacity-50">
                                Написать продавцу
                            </button>
                        </div>
                    </div>
                </div>

                {/* --- ЛЕВАЯ КОЛОНКА (Основной контент) --- */}
                {/* На мобильных этот блок будет ВТОРЫМ (`order-2`) */}
                <div className="lg:col-span-2 order-2 lg:order-1">
                    {/* -- ГАЛЕРЕЯ -- */}
                    <div className="space-y-4 mb-8">
                        <div className="relative">
                            <img className="w-full h-auto aspect-square object-cover rounded-2xl" src={displayedImage} alt={product.title}/>
                        </div>
                        <div className="flex space-x-3 overflow-x-auto pb-2 scrollbar-hide">
                            {product.imageUrls.map((url, index) => (
                                <img key={index} onClick={() => setSelectedImageIndex(index)} className={`flex-shrink-0 w-20 h-20 object-cover rounded-lg border-2 cursor-pointer transition duration-200 ${selectedImageIndex === index && !selectedVariant?.imageUrl ? 'border-primary' : 'border-transparent hover:border-primary'}`} src={url} alt={`Thumbnail ${index + 1}`}/>
                            ))}
                        </div>
                    </div>
                    
                    {/* -- ИНФО О ПРОДАВЦЕ -- */}
                    <div className="bg-base-200 rounded-2xl p-6 mb-8">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                                <img className="w-16 h-16 rounded-full object-cover" src={product.seller.avatarUrl} alt={product.seller.name}/>
                                <div>
                                    <h3 className="font-bold text-xl">{product.seller.name}</h3>
                                    <div className="flex items-center gap-1 mt-1">
                                        <VerifiedBadge level={product.seller.verificationLevel} />
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <StarRating rating={product.seller.rating} />
                                <span className="text-sm text-base-content/60 hover:text-primary mt-1">
                                    {reviews.length} отзывов
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* -- ОПИСАНИЕ И ХАРАКТЕРИСТИКИ -- */}
                    <div className="bg-base-200 rounded-2xl p-6">
                        <h2 className="text-2xl font-bold mb-4">Описание</h2>
                        <p className="text-base-content/80 whitespace-pre-wrap leading-relaxed mb-8">{product.description}</p>
                        
                        <h3 className="text-xl font-bold mb-4 border-t border-base-300 pt-6">Характеристики</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 text-sm">
                            {Object.entries(product.dynamicAttributes).map(([key, value]) => (
                                <div key={key} className="flex justify-between border-b border-base-300/50 py-2">
                                    <span className="text-base-content/60">{key}:</span>
                                    <span className="font-medium text-right">{value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* -- ОТЗЫВЫ -- */}
            {reviews.length > 0 && (
                <div className="mt-12">
                    <h3 className="text-3xl font-bold mb-6 text-center">Отзывы о продавце</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {reviews.slice(0, 3).map((review) => (
                           <ReviewCard key={review.id} review={review} />
                        ))}
                    </div>
                    {reviews.length > 3 && (
                        <div className="text-center mt-8">
                             <span className="p-4 rounded-lg bg-base-200 hover:bg-base-300 transition-colors">
                                 Показать все отзывы ({reviews.length})
                            </span>
                        </div>
                    )}
                </div>
            )}
        </div>
        
        {product.isAuction && <BidModal isOpen={isBidModalOpen} onClose={() => setIsBidModalOpen(false)} onSubmit={handlePlaceBid} product={product} />}
        {isNftModalOpen && <NFTCertificateModal product={product} onClose={() => setIsNftModalOpen(false)} />}
    </>
    );
};

export default ProductDetailPage;
