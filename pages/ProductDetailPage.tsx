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
        <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-12 lg:max-w-7xl lg:px-8">
            <div className="lg:grid lg:grid-cols-2 lg:items-start lg:gap-x-8">
                {/* Image gallery */}
                <div className="flex flex-col-reverse">
                    {/* Image selector */}
                    <div className="mx-auto mt-6 hidden w-full max-w-2xl sm:block lg:max-w-none">
                        <div className="grid grid-cols-4 gap-6" role="tablist" aria-orientation="horizontal">
                            {product.imageUrls.map((url, index) => (
                                <button key={index} onClick={() => setSelectedImageIndex(index)} className="relative flex h-24 cursor-pointer items-center justify-center rounded-md bg-white text-sm font-medium uppercase text-base-content hover:bg-base-300" role="tab">
                                    <span className="absolute inset-0 overflow-hidden rounded-md">
                                        <img src={url} alt="" className="h-full w-full object-cover object-center" />
                                    </span>
                                    {selectedImageIndex === index && <span aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-md ring-2 ring-primary ring-offset-2"></span>}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="aspect-h-1 aspect-w-1 w-full">
                        <img src={displayedImage} alt={product.title} className="h-full w-full object-cover object-center sm:rounded-lg" />
                    </div>
                </div>

                {/* Product info */}
                <div className="mt-10 px-4 sm:mt-16 sm:px-0 lg:mt-0">
                    <h1 className="text-3xl font-bold tracking-tight text-neutral-900">{product.title}</h1>
                    <div className="mt-3">
                        <h2 className="sr-only">Информация о товаре</h2>
                        <p className="text-3xl tracking-tight text-emerald-900">{getFormattedPrice(finalPrice)}</p>
                        {hasDiscount && <p className="text-xl text-base-content/50 line-through ml-2">{getFormattedPrice(displayPrice)}</p>}
                    </div>

                    <div className="mt-3">
                        <h3 className="sr-only">Отзывы</h3>
                        <div className="flex items-center">
                            <StarRating rating={product.seller.rating} />
                            <p className="sr-only">{product.seller.rating} из 5 звезд</p>
                            <span className="ml-3 text-sm font-medium text-primary hover:text-primary-focus">{reviews.length} отзывов</span>
                        </div>
                    </div>

                   <div className="mt-6">


  <details className="group border-b border-neutral-200 rounded-lg">
    <summary className="flex w-full cursor-pointer items-center justify-between py-4 text-left text-neutral-900">
      <span className="text-lg font-semibold">Описание товара</span>
      <svg
        className="h-6 w-6 transform transition-transform duration-300 group-open:rotate-180"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth="2"
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
      </svg>
    </summary>

    <div className="pb-4 text-base text-base-content/80 leading-relaxed">
      <p>{product.description}</p>
    </div>
  </details>
</div>

                    
                    <form className="mt-6">
                        {hasVariants && (
                            <div className="space-y-4">
                                {product.variantAttributes?.map(attr => (
                                    <div key={attr.name}>
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-sm font-medium text-white">{attr.name}</h3>
                                        </div>
                                        <fieldset className="mt-2">
                                            <div className="flex flex-wrap gap-3">
                                                {attr.options.map(option => (
                                                    <button type="button" key={option} onClick={() => handleAttributeSelect(attr.name, option)} className={`relative flex items-center justify-center rounded-md border py-3 px-3 text-sm font-medium uppercase hover:bg-base-300 ${selectedAttributes[attr.name] === option ? 'border-primary' : 'border-base-300'}`}>
                                                        {option}
                                                        {selectedAttributes[attr.name] === option && <span aria-hidden="true" className="pointer-events-none absolute -inset-px rounded-md border-2 border-primary"></span>}
                                                    </button>
                                                ))}
                                            </div>
                                        </fieldset>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="mt-10 flex">
                            <button type="button" onClick={handleAddToCart} disabled={isOwner || !isStockAvailable} className="flex max-w-xs flex-1 items-center justify-center rounded-md border border-transparent bg-primary px-8 py-3 text-base font-medium text-white hover:bg-primary-focus focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-base-300 sm:w-full disabled:bg-gray-500 disabled:cursor-not-allowed">
                                {isOwner ? "Это ваш товар" : (isStockAvailable ? "В корзину" : "Нет в наличии")}
                            </button>
                            <button type="button" onClick={handleWishlistClick} className={`ml-4 flex items-center justify-center rounded-md px-3 py-3 text-base-content/70 hover:bg-base-300 hover:text-red-500 ${isFavorited ? 'text-red-500' : ''}`}>
                                <svg className="h-6 w-6 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"></path></svg>
                                <span className="sr-only">Add to favorites</span>
                            </button>
                        </div>
                    </form>
                    
                    <section className="mt-12">
                        <h2 className="sr-only">Детали</h2>
                        <div className="divide-y divide-base-300 border-t border-base-300">
                             <details className="group" open>
                                <summary className="flex w-full cursor-pointer items-center justify-between py-6 text-left text-neutral-900">
                                    <span className="text-base font-medium">Характеристики</span>
                                    <span className="ml-6 flex items-center"><svg className="h-6 w-6 transform transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg></span>
                                </summary>
                                <div className="pb-6 prose prose-sm">
                                    <ul role="list">
                                        {Object.entries(product.dynamicAttributes).map(([key, value]) => (
                                            <li key={key}><span className="font-semibold">{key}:</span> {value}</li>
                                        ))}
                                    </ul>
                                </div>
                            </details>
                            {/* Static details for design consistency */}
                             <details className="group">
                                <summary className="flex w-full cursor-pointer items-center justify-between py-6 text-left text-neutral-900">
                                    <span className="text-base font-medium">Доставка и Возврат</span>
                                    <span className="ml-6 flex items-center"><svg className="h-6 w-6 transform transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg></span>
                                </summary>
                                <div className="pb-6 prose prose-sm text-base-content/80">
                                    <p>Мы предлагаем быструю доставку через Нова Пошта и Укрпошта. Возврат возможен в течение 14 дней, если товар не был в использовании и сохранил товарный вид.</p>
                                </div>
                            </details>
                        </div>
                    </section>
                </div>
            </div>
        </div>
        
        {product.isAuction && <BidModal isOpen={isBidModalOpen} onClose={() => setIsBidModalOpen(false)} onSubmit={handlePlaceBid} product={product} />}
        {isNftModalOpen && <NFTCertificateModal product={product} onClose={() => setIsNftModalOpen(false)} />}
    </>
    );
};

export default ProductDetailPage;
