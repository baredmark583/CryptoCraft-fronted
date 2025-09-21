import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { apiService } from '../services/apiService';
import type { Product, ProductVariant } from '../types';
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
    const navigate = useNavigate();
    useTelegramBackButton(true);

    const [product, setProduct] = useState<Product | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState(0);
    const [quantity, setQuantity] = useState(1);
    const [selectedVariant, setSelectedVariant] = useState<ProductVariant | undefined>(undefined);
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
                    if (data.variants && data.variants.length > 0) {
                        setSelectedVariant(data.variants[0]);
                    }
                }
            })
            .finally(() => setIsLoading(false));
    }, [id]);

    const handleAddToCart = () => {
        if (!product) return;
        const price = selectedVariant?.salePrice || selectedVariant?.price || product.salePrice || product.price || 0;
        addToCart(product, quantity, selectedVariant, price, 'RETAIL');
        // Optionally, navigate to cart or show a confirmation
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
        navigate(`/chat/${chat.id}?productId=${product.id}`);
    };

    const displayPrice = useMemo(() => {
        const price = selectedVariant?.price || product?.price || 0;
        const salePrice = selectedVariant?.salePrice || product?.salePrice;
        
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

    return (
        <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Image Gallery */}
                <div>
                    <div className="aspect-square bg-brand-surface rounded-lg mb-4 flex items-center justify-center overflow-hidden">
                        <img src={product.imageUrls[selectedImage]} alt={`${product.title} view ${selectedImage + 1}`} className="max-w-full max-h-full object-contain"/>
                    </div>
                    <div className="flex gap-2">
                        {product.imageUrls.map((url, index) => (
                            <button key={index} onClick={() => setSelectedImage(index)} className={`w-20 h-20 bg-brand-surface rounded-md overflow-hidden ${selectedImage === index ? 'ring-2 ring-brand-primary' : ''}`}>
                                <img src={url} alt={`Thumbnail ${index + 1}`} className="w-full h-full object-cover"/>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Product Info */}
                <div>
                    <h1 className="text-4xl font-bold text-white mb-4">{product.title}</h1>
                    {product.authenticationStatus === 'AUTHENTICATED' && (
                        <div className="mb-4">
                            <AuthenticatedBadge 
                                nftTokenId={product.nftTokenId} 
                                reportUrl={product.authenticationReportUrl} 
                                onClick={product.nftTokenId ? () => setIsNftModalOpen(true) : undefined} 
                            />
                        </div>
                    )}
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

                    <p className="text-brand-text-primary leading-relaxed mb-6">{product.description}</p>
                    
                    {product.isAuction ? (
                        <div className="bg-brand-surface p-6 rounded-lg">
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
                        <>
                             <div className="mb-6">{displayPrice}</div>
                             <div className="flex items-center gap-4 mb-6">
                                <input type="number" value={quantity} onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))} className="w-20 bg-brand-background border border-brand-border rounded-md p-3 text-center"/>
                                <button onClick={handleAddToCart} disabled={isOwner} className="flex-1 bg-brand-primary hover:bg-brand-primary-hover text-white font-bold py-3 px-4 rounded-lg disabled:bg-gray-500 disabled:cursor-not-allowed">
                                    {isOwner ? "Это ваш товар" : "Добавить в корзину"}
                                </button>
                             </div>
                        </>
                    )}

                     <button onClick={handleContactSeller} disabled={isOwner} className="w-full bg-brand-surface hover:bg-brand-border text-white font-bold py-3 px-4 rounded-lg disabled:opacity-50">
                        Написать продавцу
                    </button>
                </div>
            </div>
            {product.isAuction && <BidModal isOpen={isBidModalOpen} onClose={() => setIsBidModalOpen(false)} onSubmit={handlePlaceBid} product={product} />}
            {isNftModalOpen && <NFTCertificateModal product={product} onClose={() => setIsNftModalOpen(false)} />}
        </>
    );
};

export default ProductDetailPage;
