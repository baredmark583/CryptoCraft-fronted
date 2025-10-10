import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { apiService } from '../services/apiService';
import type { Product, ProductVariant, Review } from '../types';
import Spinner from '../components/Spinner';
import { useAuth } from '../hooks/useAuth';
import { useCurrency } from '../hooks/useCurrency';
import { useCart } from '../hooks/useCart';
import { useWishlist } from '../hooks/useWishlist';
import StarRating from '../components/StarRating';
import VerifiedBadge from '../components/VerifiedBadge';
import { useCountdown } from '../hooks/useCountdown';
import BidModal from '../components/BidModal';
import { useTelegramBackButton } from '../hooks/useTelegram';
import AuthenticatedBadge from '../components/AuthenticatedBadge';
import NFTCertificateModal from '../components/NFTCertificateModal';
import DynamicIcon from '../components/DynamicIcon';
import ReviewCard from '../components/ReviewCard';
import ImageModal from '../components/ImageModal';

const Countdown: React.FC<{ targetDate: number }> = ({ targetDate }) => {
    const { days, hours, minutes, seconds, isFinished } = useCountdown(targetDate);
    
    if (isFinished) {
        return <span className="text-red-500 font-bold">Аукцион завершен</span>;
    }
    
    return (
        <div className="grid grid-flow-col gap-5 text-center auto-cols-max">
            <div className="flex flex-col p-2 bg-neutral rounded-box text-neutral-content">
                <span className="countdown font-mono text-3xl">
                    <span style={{"--value": days} as React.CSSProperties}></span>
                </span>
                дней
            </div>
            <div className="flex flex-col p-2 bg-neutral rounded-box text-neutral-content">
                <span className="countdown font-mono text-3xl">
                    <span style={{"--value": hours} as React.CSSProperties}></span>
                </span>
                часов
            </div>
            <div className="flex flex-col p-2 bg-neutral rounded-box text-neutral-content">
                <span className="countdown font-mono text-3xl">
                    <span style={{"--value": minutes} as React.CSSProperties}></span>
                </span>
                минут
            </div>
             <div className="flex flex-col p-2 bg-neutral rounded-box text-neutral-content">
                <span className="countdown font-mono text-3xl">
                    <span style={{"--value": seconds} as React.CSSProperties}></span>
                </span>
                секунд
            </div>
        </div>
    )
}

const ProductDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();
    const navigate = useNavigate();
    useTelegramBackButton(true);

    const [product, setProduct] = useState<Product | null>(null);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
    const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({});
    const [isBidModalOpen, setIsBidModalOpen] = useState(false);
    const [isNftModalOpen, setIsNftModalOpen] = useState(false);
    const [viewingImage, setViewingImage] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    
    const { getFormattedPrice } = useCurrency();
    const { addToCart } = useCart();
    const { isWishlisted, addToWishlist, removeFromWishlist } = useWishlist();

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
                setReviews(reviewData.filter(r => r.productId === id));
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
    
    const handleAttributeSelect = useCallback((attributeName: string, option: string) => {
        setSelectedAttributes(prev => ({ ...prev, [attributeName]: option }));
    }, []);

    const handleAddToCart = useCallback(() => {
        if (!product || !user) return;
        const price = selectedVariant?.salePrice || selectedVariant?.price || product.salePrice || product.price || 0;
        addToCart(product, 1, selectedVariant || undefined, price, 'RETAIL');
    }, [product, user, addToCart, selectedVariant]);

    const handlePlaceBid = useCallback(async (amount: number) => {
        if (!product || !user) return;
        const updatedProduct = await apiService.placeBid(product.id, amount, user.id);
        setProduct(updatedProduct);
        setIsBidModalOpen(false);
    }, [product, user]);
    
    const handleContactSeller = useCallback(async () => {
        if (!product || !user) return;
        const chat = await apiService.findOrCreateChat(user.id, product.seller.id);
        navigate(`/chat/${chat.id}?productId=${product.id}`);
    }, [product, user, navigate]);

    const handleWishlistClick = () => {
        if (!product) return;
        if (isWishlisted(product.id)) {
            removeFromWishlist(product.id);
        } else {
            addToWishlist(product.id);
        }
    };
    
     const handleShare = () => {
        if (!product) return;
        let urlToCopy = window.location.href;
        // Если текущий пользователь является продавцом этого товара, добавляем его реферальный ID
        if (user && user.id === product.seller.id && user.affiliateId) {
            const url = new URL(urlToCopy);
            url.searchParams.set('ref', user.affiliateId);
            urlToCopy = url.toString();
        }
        navigator.clipboard.writeText(urlToCopy).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000); // Сбросить состояние через 2 секунды
        });
    };
    
    const displayedImage = useMemo(() => {
        if (selectedVariant?.imageUrl) return selectedVariant.imageUrl;
        return product?.imageUrls[selectedImageIndex] || '';
    }, [selectedVariant, product, selectedImageIndex]);

    const hasVariants = useMemo(() => product?.variantAttributes && product.variantAttributes.length > 0, [product]);

    if (isLoading) {
        return <div className="flex justify-center items-center h-96"><Spinner /></div>;
    }

    if (!product || !user) {
        return <div className="text-center text-xl text-base-content/70">Товар не найден.</div>;
    }

    const isOwner = product.seller.id === user.id;
    const isFavorited = isWishlisted(product.id);
    const stock = hasVariants ? (selectedVariant?.stock ?? 0) : 1; // Assume 1 for non-variant products
    const isStockAvailable = stock > 0;

    const displayPrice = hasVariants ? (selectedVariant?.price ?? 0) : (product.price ?? 0);
    const displaySalePrice = hasVariants ? selectedVariant?.salePrice : product.salePrice;
    const hasDiscount = displaySalePrice && displaySalePrice < displayPrice;
    const finalPrice = hasDiscount ? displaySalePrice : displayPrice;

    return (
    <>
        <div className="lg:grid lg:grid-cols-2 lg:items-start lg:gap-x-8">
            {/* Image gallery */}
            <div className="flex flex-col-reverse">
                {/* Image selector */}
                <div className="mx-auto mt-6 hidden w-full max-w-2xl sm:block lg:max-w-none">
                    <div className="tabs tabs-boxed">
                        {product.imageUrls.map((url, index) => (
                            <a key={index} role="tab" className={`tab h-24 w-24 ${selectedImageIndex === index ? 'tab-active' : ''}`} onClick={() => setSelectedImageIndex(index)}>
                                <img src={url} alt="" className="h-full w-full object-cover object-center rounded-lg" />
                            </a>
                        ))}
                    </div>
                </div>

                <div className="w-full aspect-square">
                    <img src={displayedImage} alt={product.title} className="h-full w-full object-cover object-center sm:rounded-lg" />
                </div>
            </div>

            {/* Product info */}
            <div className="mt-10 px-4 sm:mt-16 sm:px-0 lg:mt-0">
                <h1 className="text-3xl font-bold tracking-tight text-base-content">{product.title}</h1>
                <div className="mt-3">
                    <h2 className="sr-only">Информация о товаре</h2>
                    <div className="flex items-baseline">
                        <p className="text-3xl tracking-tight text-primary">{getFormattedPrice(finalPrice)}</p>
                        {hasDiscount && <p className="text-xl text-base-content/50 line-through ml-2">{getFormattedPrice(displayPrice)}</p>}
                    </div>
                </div>

                <div className="mt-3">
                    <h3 className="sr-only">Отзывы</h3>
                    <div className="flex items-center">
                        <StarRating rating={product.seller.rating} />
                        <p className="sr-only">{product.seller.rating} из 5 звезд</p>
                        <a href="#reviews" className="ml-3 text-sm font-medium text-primary hover:text-primary-focus">{reviews.length} отзывов</a>
                    </div>
                </div>

                <div className="mt-6">
                    <div className="collapse collapse-plus bg-base-100">
                        <input type="radio" name="my-accordion-3" defaultChecked /> 
                        <div className="collapse-title text-xl font-medium">
                            Описание товара
                        </div>
                        <div className="collapse-content"> 
                            <p className="text-base text-base-content/80 leading-relaxed">{product.description}</p>
                        </div>
                    </div>
                </div>

                <div className="mt-6">
                    {hasVariants && (
                        <div className="space-y-4">
                            {product.variantAttributes?.map(attr => (
                                <div key={attr.name}>
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-medium text-base-content">{attr.name}</h3>
                                    </div>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {attr.options.map(option => (
                                            <button type="button" key={option} onClick={() => handleAttributeSelect(attr.name, option)} className={`btn btn-sm ${selectedAttributes[attr.name] === option ? 'btn-primary' : 'btn-outline'}`}>
                                                {option}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="mt-10 flex gap-2">
                        <button type="button" onClick={handleAddToCart} disabled={isOwner || !isStockAvailable} className="btn btn-primary flex-1">
                            {isOwner ? "Это ваш товар" : (isStockAvailable ? "В корзину" : "Нет в наличии")}
                        </button>
                        <button type="button" onClick={handleWishlistClick} className={`btn btn-ghost btn-square ${isFavorited ? 'text-red-500' : ''}`}>
                            <DynamicIcon name="wishlist-heart" className="h-6 w-6" />
                        </button>
                         <div className="tooltip" data-tip={copied ? "Скопировано!" : "Поделиться"}>
                           <button type="button" onClick={handleShare} className="btn btn-ghost btn-square">
                                <DynamicIcon name="share" className="h-6 w-6" />
                            </button>
                         </div>
                    </div>
                </div>
                
                {!isOwner && (
                <div className="mt-8 border-t border-base-300/50 pt-6">
                    <div className="flex items-center gap-4">
                        <div className="avatar">
                           <div className="w-16 rounded-full">
                                <Link to={`/profile/${product.seller.id}`}>
                                  <img src={product.seller.avatarUrl} alt={product.seller.name} />
                                </Link>
                           </div>
                        </div>
                        <div className="flex-1">
                            <p className="text-sm text-base-content/70">Продавец</p>
                            <div className="flex items-center gap-2">
                                 <Link to={`/profile/${product.seller.id}`} className="font-bold text-lg text-base-content hover:underline">{product.seller.name}</Link>
                                 <VerifiedBadge level={product.seller.verificationLevel} />
                            </div>
                             <Link to={`/profile/${product.seller.id}`} className="text-sm text-primary hover:underline">Все товары продавца &rarr;</Link>
                        </div>
                        <button onClick={handleContactSeller} className="btn btn-secondary">
                            Написать
                        </button>
                    </div>
                </div>
                )}
                
                <section className="mt-12 space-y-2">
                    <div className="collapse collapse-arrow bg-base-100">
                        <input type="radio" name="my-accordion-2" defaultChecked/> 
                        <div className="collapse-title text-lg font-medium">Характеристики</div>
                        <div className="collapse-content"> 
                           <ul className="list-disc list-inside text-base-content/80">
                                {Object.entries(product.dynamicAttributes).map(([key, value]) => (
                                    <li key={key}><span className="font-semibold">{key}:</span> {value}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                    <div id="reviews" className="collapse collapse-arrow bg-base-100">
                        <input type="radio" name="my-accordion-2" /> 
                        <div className="collapse-title text-lg font-medium">Отзывы ({reviews.length})</div>
                        <div className="collapse-content space-y-4"> 
                            {reviews.length > 0 ? (
                                reviews.map(review => (
                                    <ReviewCard key={review.id} review={review} onImageClick={setViewingImage} />
                                ))
                            ) : (
                                <p className="text-base-content/70">Отзывов пока нет.</p>
                            )}
                        </div>
                    </div>
                    <div className="collapse collapse-arrow bg-base-100">
                        <input type="radio" name="my-accordion-2" /> 
                        <div className="collapse-title text-lg font-medium">Доставка и Возврат</div>
                        <div className="collapse-content"> 
                            <p className="text-base-content/80">Мы предлагаем быструю доставку через Нова Пошта и Укрпошта. Возврат возможен в течение 14 дней, если товар не был в использовании и сохранил товарный вид.</p>
                        </div>
                    </div>
                </section>
            </div>
        </div>
        
        {product.isAuction && <BidModal isOpen={isBidModalOpen} onClose={() => setIsBidModalOpen(false)} onSubmit={handlePlaceBid} product={product} />}
        {isNftModalOpen && <NFTCertificateModal product={product} onClose={() => setIsNftModalOpen(false)} />}
        {viewingImage && <ImageModal imageUrl={viewingImage} onClose={() => setViewingImage(null)} />}
    </>
    );
};

export default ProductDetailPage;