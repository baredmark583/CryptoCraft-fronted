

import React, { useState, useEffect, useMemo, useCallback } from 'react';
// FIX: Replaced v6 hooks with v5 equivalents for compatibility.
import { useParams, Link, useNavigate } from 'react-router-dom';
import { apiService } from '../services/apiService';
import type { Product, ProductVariant, VariantAttribute } from '../types';
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

const ProductDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();
    // FIX: Upgraded react-router-dom to v6. Replaced useHistory with useNavigate.
    const navigate = useNavigate();
    useTelegramBackButton(true);

    const [product, setProduct] = useState<Product | null>(null);
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
                }
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
        setSelectedAttributes(prev => ({
            ...prev,
            [attributeName]: option
        }));
    };

    const handleAddToCart = () => {
        if (!product) return;
        const price = selectedVariant?.salePrice || selectedVariant?.price || product.salePrice || product.price || 0;
        addToCart(product, quantity, selectedVariant || undefined, price, 'RETAIL');
        alert(`${product.title} добавлен в корзину!`);
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
        // FIX: Use navigate instead of history.push.
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
                <>
                    <span className="text-4xl font-bold text-brand-primary">{getFormattedPrice(salePrice)}</span>
                    <span className="text-xl text-brand-text-secondary line-through ml-2">{getFormattedPrice(price)}</span>
                </>
            )
        }
        return <span className="text-4xl font-bold text-brand-primary">{getFormattedPrice(price)}</span>
    }, [product, selectedVariant, getFormattedPrice]);

    if (isLoading) {
        return <div className="flex justify-center items-center h-96"><Spinner /></div>;
    }

    if (!product) {
        return <div className="text-center text-xl text-brand-text-secondary">Товар не найден.</div>;
    }

    const isOwner = product.seller.id === user.id;
    const hasVariants = product.variantAttributes && product.variantAttributes.length > 0;
    const isVariantInStock = hasVariants ? (selectedVariant ? selectedVariant.stock > 0 : false) : true;

    return (
        <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
                {/* Image Gallery */}
                <div>
                    <div className="aspect-square bg-brand-surface rounded-lg mb-4 flex items-center justify-center overflow-hidden">
                        <img src={displayedImage} alt={`${product.title}`} className="max-w-full max-h-full object-contain"/>
                    </div>
                    <div className="flex gap-2">
                        {product.imageUrls.map((url, index) => (
                            <button key={index} onClick={() => setSelectedImageIndex(index)} className={`w-20 h-20 bg-brand-surface rounded-md overflow-hidden ${selectedImageIndex === index && !selectedVariant?.imageUrl ? 'ring-2 ring-brand-primary' : ''}`}>
                                <img src={url} alt={`Thumbnail ${index + 1}`} className="w-full h-full object-cover"/>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Product Info */}
                <div className="flex flex-col">
                    <h1 className="text-4xl font-bold text-white mb-4">{product.title}</h1>
                    
                    <div className="flex items-center gap-4 mb-6">
                        <Link to={`/profile/${product.seller.id}`} className="flex items-center gap-3">
                            <img src={product.seller.avatarUrl} alt={product.seller.name} className="w-12 h-12 rounded-full"/>
                            <div>
                                <p className="font-semibold text-white">{product.seller.name}</p>
                                <div className="flex items-center gap-1">
                                    <StarRating rating={product.seller.rating}/>
                                    <span className="text-sm text-brand-text-secondary">{product.seller.rating.toFixed(1)}</span>
                                </div>
                            </div>
                        </Link>
                         <VerifiedBadge level={product.seller.verificationLevel} />
                    </div>

                    {product.authenticationStatus === 'AUTHENTICATED' && (
                        <div className="mb-6">
                            <AuthenticatedBadge 
                                nftTokenId={product.nftTokenId} 
                                reportUrl={product.authenticationReportUrl} 
                                onClick={product.nftTokenId ? () => setIsNftModalOpen(true) : undefined} 
                            />
                        </div>
                    )}
                    
                    {/* Variant Selectors */}
                    {hasVariants && (
                        <div className="space-y-4 mb-6">
                            {product.variantAttributes?.map(attr => (
                                <div key={attr.name}>
                                    <label className="block text-sm font-medium text-brand-text-secondary mb-2">{attr.name}</label>
                                    <div className="flex flex-wrap gap-2">
                                        {attr.options.map(option => (
                                            <button 
                                                key={option}
                                                onClick={() => handleAttributeSelect(attr.name, option)}
                                                className={`px-4 py-2 text-sm rounded-md border-2 transition-colors ${selectedAttributes[attr.name] === option ? 'bg-brand-primary border-brand-primary text-white' : 'bg-brand-surface border-brand-border hover:border-brand-text-secondary text-brand-text-primary'}`}
                                            >
                                                {option}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    
                    {/* Auction / Price block */}
                    {product.isAuction ? (
                        <div className="bg-brand-surface p-6 rounded-lg mb-6">
                            <h3 className="text-lg font-semibold text-white text-center mb-4">Аукцион заканчивается через:</h3>
                            <div className="flex justify-center mb-6">
                                <Countdown targetDate={product.auctionEnds || 0} />
                            </div>
                            <div className="flex justify-between items-baseline mb-4">
                                <span className="text-brand-text-secondary">Текущая ставка:</span>
                                <span className="text-2xl font-bold text-brand-primary">{product.currentBid || product.startingBid} USDT</span>
                            </div>
                            <button onClick={() => setIsBidModalOpen(true)} className="w-full bg-brand-primary hover:bg-brand-primary-hover text-white font-bold py-3 rounded-lg">
                                Сделать ставку
                            </button>
                        </div>
                    ) : (
                        <div className="mb-6">{displayPrice}</div>
                    )}

                    {/* Action Buttons */}
                    {!product.isAuction && (
                         <div className="flex items-center gap-4 mb-6">
                            <input type="number" value={quantity} onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))} className="w-20 bg-brand-background border border-brand-border rounded-md p-3 text-center"/>
                            <button onClick={handleAddToCart} disabled={isOwner || !isVariantInStock} className="flex-1 bg-brand-primary hover:bg-brand-primary-hover text-white font-bold py-3 px-4 rounded-lg disabled:bg-gray-500 disabled:cursor-not-allowed">
                                {isOwner ? "Это ваш товар" : (!isVariantInStock ? "Нет в наличии" : "Добавить в корзину")}
                            </button>
                         </div>
                    )}

                     <button onClick={handleContactSeller} disabled={isOwner} className="w-full bg-brand-surface hover:bg-brand-border text-white font-bold py-3 px-4 rounded-lg disabled:opacity-50 mb-8">
                        Написать продавцу
                    </button>
                    
                    {/* Description and Attributes */}
                    <div className="space-y-8">
                        <div>
                             <h2 className="text-2xl font-bold text-white mb-4 border-b border-brand-border pb-2">Описание</h2>
                             <p className="text-brand-text-primary leading-relaxed whitespace-pre-wrap">{product.description}</p>
                        </div>
                        {Object.keys(product.dynamicAttributes).length > 0 && (
                            <div>
                                <h2 className="text-2xl font-bold text-white mb-4 border-b border-brand-border pb-2">Характеристики</h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-brand-text-primary">
                                    {Object.entries(product.dynamicAttributes).map(([key, value]) => (
                                        <div key={key} className="flex justify-between border-b border-brand-border/30 py-2">
                                            <span className="text-brand-text-secondary">{key}:</span>
                                            <span className="font-semibold text-right">{value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            {product.isAuction && <BidModal isOpen={isBidModalOpen} onClose={() => setIsBidModalOpen(false)} onSubmit={handlePlaceBid} product={product} />}
            {isNftModalOpen && <NFTCertificateModal product={product} onClose={() => setIsNftModalOpen(false)} />}
        </>
    );
};

export default ProductDetailPage;