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
import ProductCard from '../components/ProductCard';


const ProductDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();
    const navigate = useNavigate();
    useTelegramBackButton(true);

    const [product, setProduct] = useState<Product | null>(null);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [similarProducts, setSimilarProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    // State for new layout
    const [selectedMedia, setSelectedMedia] = useState<{ type: 'image' | 'video', src: string }>({ type: 'image', src: '' });
    const [isMessageFormVisible, setIsMessageFormVisible] = useState(false);
    const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
    
    // Existing state
    const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
    const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({});
    const [isBidModalOpen, setIsBidModalOpen] = useState(false);
    const [isNftModalOpen, setIsNftModalOpen] = useState(false);
    const [viewingReviewMedia, setViewingReviewMedia] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    
    const { getFormattedPrice } = useCurrency();
    const { addToCart } = useCart();
    const { isWishlisted, addToWishlist, removeFromWishlist } = useWishlist();

    useEffect(() => {
        if (!id) return;
        setIsLoading(true);
        window.scrollTo(0, 0);

        Promise.all([
            apiService.getProductById(id),
            // Assuming getReviewsByProductId exists
            // apiService.getReviewsByProductId(id) 
        ]).then(async ([productData]) => {
            if (!productData) {
                // To-Do: show a "not found" page
                navigate('/');
                return;
            }
            setProduct(productData);
            
            // Set initial selected media
            if (productData.imageUrls.length > 0) {
                setSelectedMedia({ type: 'image', src: productData.imageUrls[0] });
            }

            // Fetch reviews for the product
            const productReviews = await apiService.getReviewsByProductId(productData.id);
            setReviews(productReviews);

            // Fetch similar products
            const allProducts = await apiService.getProducts({ category: productData.category });
            setSimilarProducts(allProducts.filter(p => p.id !== productData.id).slice(0, 4));

        }).catch(err => {
            console.error("Failed to load product page data:", err);
        }).finally(() => {
            setIsLoading(false);
        });
    }, [id, navigate]);
    
    const handleContactSeller = useCallback(async () => {
        if (!product || !user) {
            // Or prompt login
            return;
        };
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
        const urlToCopy = window.location.href;
        navigator.clipboard.writeText(urlToCopy).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };
    
     const handleAddToCart = useCallback(() => {
        if (!product) return;
        // Guest users can add to cart
        const price = selectedVariant?.salePrice || selectedVariant?.price || product.salePrice || product.price || 0;
        addToCart(product, 1, selectedVariant || undefined, price, 'RETAIL');
    }, [product, addToCart, selectedVariant]);
    

    if (isLoading) {
        return <div className="flex justify-center items-center h-[calc(100vh-10rem)]"><Spinner size="lg"/></div>;
    }

    if (!product) {
        return <div className="text-center py-20">Товар не найден.</div>;
    }
    
    const isOwner = user ? product.seller.id === user.id : false;
    const isFavorited = isWishlisted(product.id);

    return (
    <>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
            <article className="rounded-2xl border border-amber-200/80 bg-white overflow-hidden shadow-sm">
                <div className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[1.1fr,1fr] gap-5 lg:gap-8">
                    {/* Media Gallery */}
                    <div className="flex flex-col gap-3">
                         <div className="relative w-full rounded-xl overflow-hidden border border-amber-200/80">
                            <img 
                                src={selectedMedia.src} 
                                alt={`Фото товара: ${product.title}`} 
                                className="w-full h-72 sm:h-96 object-cover"
                            />
                            {product.videoUrl && (
                                <button type="button" onClick={() => setIsVideoModalOpen(true)} className="absolute top-3 left-3 inline-flex items-center gap-2 px-2.5 py-1.5 text-sm rounded-full bg-amber-900/90 text-white transition-transform hover:scale-105">
                                    <img src="https://api.iconify.design/lucide-play.svg" alt="Воспроизвести" width="16" height="16"/>
                                    Видеообзор
                                </button>
                            )}
                         </div>
                         <div className="w-full overflow-x-auto scrollbar-hide">
                            <div className="flex gap-3 pb-1">
                                {product.imageUrls.map((url, index) => (
                                     <button 
                                        key={index} 
                                        type="button"
                                        onClick={() => setSelectedMedia({type: 'image', src: url})}
                                        className={`w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-colors ${selectedMedia.type === 'image' && selectedMedia.src === url ? 'border-primary' : 'border-amber-200/80 hover:border-amber-300'}`}
                                    >
                                        <img src={url} alt={`Миниатюра ${index + 1}`} className="w-full h-full object-cover"/>
                                     </button>
                                ))}
                                {product.videoUrl && (
                                    <button 
                                        type="button"
                                        onClick={() => setIsVideoModalOpen(true)}
                                        className="relative w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 rounded-lg overflow-hidden border-2 border-amber-200/80 hover:border-amber-300"
                                    >
                                        <img src={product.imageUrls[0]} alt="Обложка видео" className="w-full h-full object-cover filter brightness-50" />
                                        <span className="absolute inset-0 flex items-center justify-center">
                                            <img src="https://api.iconify.design/lucide-play.svg" alt="Видео" className="w-6 h-6 text-white" />
                                        </span>
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                    {/* Details */}
                    <div className="flex flex-col gap-3">
                         <h1 className="text-2xl lg:text-3xl font-bold font-manrope text-base-content">{product.title}</h1>
                         <div className="flex items-center justify-between gap-3 flex-wrap">
                            <span className="text-2xl font-bold text-base-content">{getFormattedPrice(product.price || 0)}</span>
                            <span className="text-sm text-base-content/70">В наличии • {product.seller.defaultShippingAddress?.city}</span>
                         </div>
                         <div className="mt-2 flex flex-col sm:flex-row sm:items-center gap-4">
                            <button onClick={handleAddToCart} disabled={isOwner} className="btn btn-primary btn-block sm:btn-wide">
                                <DynamicIcon name="cart" className="w-5 h-5"/>
                                {isOwner ? 'Это ваш товар' : 'В корзину'}
                            </button>
                             <div className="flex items-center justify-center gap-2">
                                <button onClick={handleContactSeller} disabled={isOwner} className="btn btn-outline btn-secondary flex-1">
                                    <DynamicIcon name="chat" className="w-5 h-5"/>
                                    Написать
                                </button>
                                <button onClick={handleWishlistClick} aria-pressed={isFavorited} className={`btn btn-square btn-outline ${isFavorited ? 'btn-active text-red-500' : ''}`}>
                                    <DynamicIcon name="wishlist-heart" className="w-5 h-5"/>
                                </button>
                                <button onClick={handleShare} className="btn btn-square btn-outline">
                                    <DynamicIcon name="share" className="w-5 h-5"/>
                                    {copied && <span className="absolute -top-8 text-xs bg-base-300 text-white px-2 py-1 rounded">Скопировано!</span>}
                                </button>
                             </div>
                         </div>
                         <aside className="mt-4 border-t border-amber-200/80 pt-4">
                            <h3 className="font-bold text-base-content mb-3">Характеристики</h3>
                            <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                                {Object.entries(product.dynamicAttributes).slice(0, 6).map(([key, value]) => (
                                     <div key={key} className="flex justify-between border-b border-dashed border-amber-200/60 py-1">
                                        <span className="text-base-content/70">{key}</span>
                                        <span className="font-semibold text-base-content text-right">{value}</span>
                                     </div>
                                ))}
                            </div>
                         </aside>
                         {!isOwner && (
                            <div className="mt-4 border-t border-amber-200/80 pt-4">
                                <div className="flex items-center gap-4">
                                    <div className="avatar">
                                        <div className="w-12 h-12 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                                            <Link to={`/profile/${product.seller.id}`}><img src={product.seller.avatarUrl} alt={product.seller.name} /></Link>
                                        </div>
                                    </div>
                                    <div>
                                        <Link to={`/profile/${product.seller.id}`} className="font-bold text-base-content hover:underline">{product.seller.name}</Link>
                                        <div className="flex items-center gap-2">
                                            <StarRating rating={product.seller.rating} />
                                            <VerifiedBadge level={product.seller.verificationLevel} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                         )}
                    </div>
                </div>
            </article>

             {/* Description Section */}
            <div className="mt-8 bg-white p-6 rounded-2xl border border-amber-200/80">
                <h2 className="text-2xl font-bold font-manrope text-base-content mb-4">Описание товара</h2>
                <p className="text-base-content/90 whitespace-pre-wrap">{product.description}</p>
            </div>
            
             {/* Reviews Section */}
            <div id="reviews" className="mt-8 bg-white p-6 rounded-2xl border border-amber-200/80">
                <h2 className="text-2xl font-bold font-manrope text-base-content mb-4">Отзывы ({reviews.length})</h2>
                <div className="space-y-4">
                    {reviews.length > 0 ? (
                        reviews.map(review => (
                            <ReviewCard key={review.id} review={review} onPreviewMedia={(url) => setViewingReviewMedia(url)} />
                        ))
                    ) : (
                        <p className="text-base-content/70 text-center py-8">Отзывов на этот товар пока нет.</p>
                    )}
                </div>
            </div>

            {/* Similar Products Section */}
            {similarProducts.length > 0 && (
                <div className="mt-8">
                    <h2 className="text-2xl font-bold font-manrope text-base-content mb-4">Похожие товары</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {similarProducts.map(p => <ProductCard key={p.id} product={p} />)}
                    </div>
                </div>
            )}
        </div>

        {isVideoModalOpen && product.videoUrl && (
             <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setIsVideoModalOpen(false)}>
                <div className="relative w-full max-w-4xl" onClick={e => e.stopPropagation()}>
                    <video controls autoPlay src={product.videoUrl} className="w-full rounded-lg" />
                     <button onClick={() => setIsVideoModalOpen(false)} className="absolute -top-2 -right-2 bg-white rounded-full p-1 text-black">&times;</button>
                </div>
             </div>
        )}
        
        {isBidModalOpen && <BidModal isOpen={isBidModalOpen} onClose={() => setIsBidModalOpen(false)} onSubmit={async () => {}} product={product} />}
        {isNftModalOpen && <NFTCertificateModal product={product} onClose={() => setIsNftModalOpen(false)} />}
        {viewingReviewMedia && <ImageModal imageUrl={viewingReviewMedia} onClose={() => setViewingReviewMedia(null)} />}
    </>
    );
};

export default ProductDetailPage;
