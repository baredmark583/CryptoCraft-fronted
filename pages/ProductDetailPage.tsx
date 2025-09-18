import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import { apiService } from '../services/apiService';
import type { Product, Review, User, ProductVariant } from '../types';
import Spinner from '../components/Spinner';
import StarRating from '../components/StarRating';
import ProductCard from '../components/ProductCard';
import WalletModal from '../components/WalletModal';
import BidModal from '../components/BidModal';
import { useCountdown } from '../hooks/useCountdown';
import { useCurrency } from '../hooks/useCurrency';
import { useAuth } from '../hooks/useAuth';
import { useCart } from '../hooks/useCart';
import VerifiedBadge from '../components/VerifiedBadge';
import AuthenticatedBadge from '../components/AuthenticatedBadge';
import NFTCertificateModal from '../components/NFTCertificateModal';

const AffiliateBanner: React.FC<{affiliateId: string}> = ({ affiliateId }) => {
    const [affiliate, setAffiliate] = useState<User | null>(null);

    useEffect(() => {
        const findAffiliate = async () => {
            const users = [await apiService.getUserById('user-1'), await apiService.getUserById('user-2'), await apiService.getUserById('user-3'), await apiService.getUserById('user-4')];
            const found = users.find(u => u?.affiliateId === affiliateId);
            setAffiliate(found || null);
        };
        findAffiliate();
    }, [affiliateId]);

    if (!affiliate) return null;

    return (
        <div className="bg-green-500/10 text-green-300 text-sm text-center p-3 rounded-lg mb-6 animate-fade-in-down">
            Покупая этот товар, вы поддерживаете партнера <span className="font-bold">{affiliate.name}</span>!
        </div>
    );
};

const AuthenticationInfo: React.FC<{product: Product}> = ({ product }) => {
    if (!product.isAuthenticationAvailable) return null;

    const statusMap = {
        'NONE': {
            icon: '🔍',
            title: 'Доступна проверка подлинности',
            description: 'Этот товар может быть проверен нашими экспертами. Продавец еще не запросил проверку.',
            color: 'bg-sky-500/10 border-sky-500/30'
        },
        'PENDING': {
            icon: '⏳',
            title: 'Проверка на подлинность',
            description: 'Товар находится на проверке у наших экспертов. Результаты скоро появятся.',
            color: 'bg-yellow-500/10 border-yellow-500/30'
        },
        'AUTHENTICATED': {
            icon: '✅',
            title: 'Гарантия подлинности CryptoCraft',
            description: 'Наши эксперты проверили этот товар и подтвердили его подлинность и соответствие описанию.',
            color: 'bg-green-500/10 border-green-500/30'
        },
        'REJECTED': {
            icon: '❌',
            title: 'Проверку не прошел',
            description: 'Товар не прошел проверку нашими экспертами.',
            color: 'bg-red-500/10 border-red-500/30'
        }
    };

    const status = product.authenticationStatus || 'NONE';
    const info = statusMap[status];

    return (
        <div className={`p-4 rounded-lg border my-6 ${info.color}`}>
            <div className="flex items-start gap-4">
                <div className="text-3xl">{info.icon}</div>
                <div>
                    <h3 className="font-bold text-white">{info.title}</h3>
                    <p className="text-sm text-brand-text-secondary mt-1">{info.description}</p>
                    {status === 'AUTHENTICATED' && product.authenticationReportUrl && (
                        <a href={product.authenticationReportUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-brand-secondary hover:text-brand-primary mt-2 inline-block">
                            Посмотреть отчет о проверке &rarr;
                        </a>
                    )}
                </div>
            </div>
        </div>
    );
};

const CarSpecifications: React.FC<{ attributes: Record<string, string | number> }> = ({ attributes }) => {
    const [vinCopied, setVinCopied] = useState(false);
    
    const specs = [
        { label: 'Год выпуска', value: attributes['Год выпуска'] },
        { label: 'Пробег', value: `${attributes['Пробег, км']} км` },
        { label: 'Двигатель', value: `${attributes['Объем двигателя, л']} л / ${attributes['Тип топлива']}` },
        { label: 'КПП', value: attributes['Коробка передач'] },
        { label: 'Кузов', value: attributes['Тип кузова'] },
        { label: 'Состояние', value: attributes['Состояние'] },
    ];

    const handleCopyVin = () => {
        navigator.clipboard.writeText(String(attributes['VIN-код']));
        setVinCopied(true);
        setTimeout(() => setVinCopied(false), 2000);
    };

    return (
        <div className="mt-6 bg-brand-surface/50 p-6 rounded-lg border border-brand-border">
            <h3 className="font-semibold text-white mb-4 text-lg">Характеристики автомобиля</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 mb-6">
                {specs.map(spec => (
                    <div key={spec.label}>
                        <p className="text-sm text-brand-text-secondary">{spec.label}</p>
                        <p className="font-bold text-white text-lg">{spec.value}</p>
                    </div>
                ))}
            </div>
            <div>
                 <label className="block text-sm text-brand-text-secondary mb-1 group relative">
                    VIN-код
                    <span className="absolute bottom-full left-0 mb-2 w-64 p-2 bg-brand-background text-xs text-brand-text-secondary rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        VIN (Vehicle Identification Number) — это уникальный код автомобиля, позволяющий проверить его историю.
                    </span>
                </label>
                 <div className="flex items-center gap-2 bg-brand-background p-2 rounded-md">
                     <span className="font-mono text-brand-primary flex-grow">{attributes['VIN-код']}</span>
                     <button onClick={handleCopyVin} className="text-sm bg-brand-secondary hover:bg-brand-primary-hover text-white font-semibold px-3 py-1 rounded-md transition-colors w-24">
                         {vinCopied ? 'Готово!' : 'Копировать'}
                     </button>
                 </div>
            </div>
        </div>
    );
};


const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getFormattedPrice } = useCurrency();
  const { addToCart } = useCart();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [isBidModalOpen, setIsBidModalOpen] = useState(false);
  const [isNftModalOpen, setIsNftModalOpen] = useState(false);
  const [isProcessingPurchase, setIsProcessingPurchase] = useState(false);
  const [isContacting, setIsContacting] = useState(false);
  
  const [showAddedToCart, setShowAddedToCart] = useState(false);
  const [showPhone, setShowPhone] = useState(false);

  // B2B and Purchase state
  const [purchaseMode, setPurchaseMode] = useState<'RETAIL' | 'WHOLESALE'>('RETAIL');
  const [quantity, setQuantity] = useState(1);

  // Media state
  const [activeMedia, setActiveMedia] = useState<'image' | 'video'>('image');
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Variant state
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});

  const affiliateId = new URLSearchParams(location.search).get('ref');

  const uniquenessMap: Record<string, string> = {
    'ONE_OF_A_KIND': 'Единственный экземпляр',
    'LIMITED_EDITION': 'Ограниченный тираж',
    'MADE_TO_ORDER': 'На заказ'
  };

  useEffect(() => {
    const fetchProductDetails = async () => {
      if (!id) return;
      setIsLoading(true);
      try {
        const productData = await apiService.getProductById(id);
        if (productData) {
          setProduct(productData);
          
          if (productData.variants && productData.variants.length > 0) {
              const initialOptions: Record<string, string> = {};
              productData.variantAttributes?.forEach(attr => {
                  initialOptions[attr.name] = attr.options[0];
              });
              setSelectedOptions(initialOptions);
          }

          const reviewsData = await apiService.getReviewsByUserId(productData.seller.id);
          setReviews(reviewsData);
          const relatedData = await apiService.getProducts({ category: productData.category });
          setRelatedProducts(relatedData.filter(p => p.id !== id).slice(0, 4));
        }
      } catch (error) {
        console.error("Failed to fetch product details:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProductDetails();
  }, [id]);
  
  useEffect(() => {
    if (product?.variants) {
      const findVariant = product.variants.find(v => 
        Object.entries(selectedOptions).every(([key, value]) => v.attributes[key] === value)
      );
      setSelectedVariant(findVariant || null);
    }
  }, [selectedOptions, product]);
  
  useEffect(() => {
      if (selectedVariant?.imageUrl) {
          const variantImageIndex = product?.imageUrls.indexOf(selectedVariant.imageUrl);
          if (variantImageIndex !== -1) {
              setSelectedImageIndex(variantImageIndex);
              setActiveMedia('image');
          }
      } else {
         setSelectedImageIndex(0);
         setActiveMedia('image');
      }
  }, [selectedVariant, product?.imageUrls]);
  
  useEffect(() => {
      if (purchaseMode === 'WHOLESALE') {
          setQuantity(product?.b2bMinQuantity || 1);
      } else {
          setQuantity(1);
      }
  }, [purchaseMode, product]);


  const handleOptionChange = (attributeName: string, optionValue: string) => {
      setSelectedOptions(prev => ({...prev, [attributeName]: optionValue}));
  };
  
  const handlePurchase = async (options: {}) => {
      setIsProcessingPurchase(true);
      console.log('Finalizing purchase with options:', options);
      await new Promise(resolve => setTimeout(resolve, 2000));
      alert("Покупка успешно совершена!");
      setIsProcessingPurchase(false);
      setIsWalletModalOpen(false);
  }

  const handleAddToCart = () => {
    if (!product) return;
    const variantToAdd = product.variants ? selectedVariant : undefined;
    if (product.variants && !variantToAdd) {
        alert("Пожалуйста, выберите вариант товара");
        return;
    }
    
    const price = purchaseMode === 'WHOLESALE' 
        ? (product.b2bPrice || 0) 
        : (variantToAdd?.salePrice || variantToAdd?.price || product.salePrice || product.price || 0);

    addToCart(product, quantity, variantToAdd, price, purchaseMode);
    setShowAddedToCart(true);
    setTimeout(() => setShowAddedToCart(false), 2000);
  };

  const handlePlaceBid = async (bidAmount: number) => {
    if (!product || !product.isAuction) return;
    const updatedProduct = await apiService.placeBid(product.id, bidAmount, user.id);
    setProduct(updatedProduct);
    setIsBidModalOpen(false);
  };

  const handleContactSeller = async () => {
    if (!product || product.seller.id === user.id) return;
    setIsContacting(true);
    try {
      const chat = await apiService.findOrCreateChat(user.id, product.seller.id);
      navigate(`/chat/${chat.id}?productId=${product.id}`);
    } catch (error) {
      console.error("Failed to create or find chat:", error);
      alert("Не удалось начать чат.");
    } finally {
      setIsContacting(false);
    }
  };
  
  const totalReviews = reviews.length;
  const averageRating = totalReviews > 0 ? (reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews).toFixed(1) : '0.0';

  const retailPrice = selectedVariant?.price ?? product?.price ?? 0;
  const retailSalePrice = selectedVariant?.salePrice ?? product?.salePrice;
  const hasRetailSale = retailSalePrice && retailSalePrice < retailPrice;
  const wholesalePrice = product?.b2bPrice;

  const displayPrice = purchaseMode === 'RETAIL' ? (hasRetailSale ? retailSalePrice : retailPrice) : wholesalePrice;
  const basePrice = purchaseMode === 'RETAIL' && hasRetailSale ? retailPrice : (purchaseMode === 'WHOLESALE' ? retailPrice : undefined);

  const isInStock = selectedVariant ? selectedVariant.stock > 0 : true;

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen"><Spinner size="lg" /></div>;
  }

  if (!product) {
    return <div className="text-center py-20 text-xl text-brand-text-secondary">Товар не найден.</div>;
  }

  const AuctionInfo: React.FC<{product: Product}> = ({ product }) => {
    const { days, hours, minutes, seconds, isFinished } = useCountdown(product.auctionEnds || 0);
    const auctionHasEnded = isFinished || !!product.winnerId;

    if(auctionHasEnded) {
        return (
            <div className="bg-brand-surface/50 border border-brand-border rounded-lg p-6 my-6 text-center">
                <h3 className="text-xl font-bold text-white mb-2">Аукцион завершен</h3>
                {product.winnerId && product.winnerId !== 'none' ? (
                     <div>
                        <p className="text-brand-text-secondary">Победитель определен!</p>
                        <p className="text-2xl font-bold text-brand-primary mt-2">{getFormattedPrice(product.finalPrice || 0)}</p>
                        {product.winnerId === user.id && (
                           <Link to="/profile" className="mt-4 inline-block w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg transition-colors">
                               🎉 Вы победили! Перейти к оплате
                           </Link>
                        )}
                     </div>
                ) : (
                    <p className="text-brand-text-secondary">Аукцион завершился без победителя.</p>
                )}
            </div>
        )
    }
    
    return (
        <div className="bg-brand-primary/10 border border-brand-primary/30 rounded-lg p-6 my-6">
            <h3 className="text-xl font-bold text-center text-white mb-4">Аукцион</h3>
            <div className="flex justify-around items-center text-center mb-4">
                <div>
                    <p className="text-2xl font-bold text-white">{getFormattedPrice(product.currentBid || 0)}</p>
                    <p className="text-sm text-brand-text-secondary">Текущая ставка</p>
                </div>
                 <div>
                    <p className="text-2xl font-bold text-white">{product.bidders?.length || 0}</p>
                    <p className="text-sm text-brand-text-secondary">Участников</p>
                </div>
            </div>
             <div className="text-center font-mono text-2xl tracking-widest bg-brand-background p-3 rounded-md mb-4">
                 {`${days}d : ${hours}h : ${minutes}m : ${seconds}s`}
            </div>
            <button onClick={() => setIsBidModalOpen(true)} className="w-full bg-brand-primary hover:bg-brand-primary-hover text-white font-bold py-3 rounded-lg transition-colors">
                Сделать ставку
            </button>
        </div>
    );
  };

  const StandardPurchaseActions = () => (
    <>
        {product.isB2BEnabled && (
            <div className="flex gap-2 p-1 bg-brand-surface rounded-lg mb-4">
                <button onClick={() => setPurchaseMode('RETAIL')} className={`flex-1 text-center cursor-pointer p-2 rounded-md transition-colors ${purchaseMode === 'RETAIL' ? 'bg-brand-primary text-white' : 'hover:bg-brand-border/50'}`}>
                    <span>В розницу</span>
                </button>
                <button onClick={() => setPurchaseMode('WHOLESALE')} className={`flex-1 text-center cursor-pointer p-2 rounded-md transition-colors ${purchaseMode === 'WHOLESALE' ? 'bg-brand-primary text-white' : 'hover:bg-brand-border/50'}`}>
                    <span>Оптом</span>
                </button>
            </div>
        )}
        <div className="mb-6">
          <div className="flex items-baseline gap-3">
               <p className="text-4xl font-bold text-brand-primary">{getFormattedPrice(displayPrice || 0)}</p>
              {basePrice && <p className="text-2xl font-normal text-brand-text-secondary line-through">{getFormattedPrice(basePrice)}</p>}
          </div>
           {purchaseMode === 'WHOLESALE' && <p className="text-sm text-brand-text-secondary mt-1">Минимальный заказ: {product.b2bMinQuantity} шт.</p>}
          {!isInStock && <p className="text-red-500 font-semibold mt-2">Нет в наличии</p>}
        </div>
        
        <div className="relative">
            <div className="flex items-center gap-4">
                <div className="w-24">
                    <label htmlFor="quantity" className="sr-only">Количество</label>
                    <input
                        type="number"
                        id="quantity"
                        value={quantity}
                        onChange={(e) => setQuantity(Math.max(purchaseMode === 'WHOLESALE' ? (product.b2bMinQuantity || 1) : 1, parseInt(e.target.value)))}
                        min={purchaseMode === 'WHOLESALE' ? product.b2bMinQuantity : 1}
                        className="w-full bg-brand-background border border-brand-border rounded-lg p-3 text-center font-bold text-lg"
                    />
                </div>
                <button
                    onClick={handleAddToCart}
                    disabled={!isInStock}
                    className="w-full bg-brand-primary hover:bg-brand-primary-hover text-white font-bold py-4 text-lg rounded-lg transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed"
                >
                   {isInStock ? 'Добавить в корзину' : 'Нет в наличии'}
                </button>
            </div>
            {showAddedToCart && (
                <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 bg-green-500/90 text-white text-sm font-semibold py-2 px-4 rounded-lg animate-fade-in-down">
                    Товар добавлен в корзину!
                </div>
            )}
             <div className="mt-3 text-center flex items-center justify-center gap-2 text-green-400">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                   <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.286zm0 13.036h.008v.008h-.008v-.008z" />
                </svg>
                <span className="text-sm font-semibold">Безопасная сделка</span>
            </div>
        </div>
        {product.seller.id !== user.id && (
            <button
                onClick={handleContactSeller}
                disabled={isContacting}
                className="w-full mt-4 bg-brand-surface hover:bg-brand-border border border-brand-border text-white font-bold py-4 text-lg rounded-lg transition-colors flex items-center justify-center gap-2"
            >
                {isContacting ? <Spinner size="sm"/> : <>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                      <path fillRule="evenodd" d="M4.5 2A1.5 1.5 0 003 3.5v9A1.5 1.5 0 004.5 14h5.25a.75.75 0 010 1.5H4.5A3 3 0 011.5 12.5v-9A3 3 0 014.5 2h11A3 3 0 0118.5 5v3.5a.75.75 0 01-1.5 0V5a1.5 1.5 0 00-1.5-1.5h-11z" clipRule="evenodd" />
                      <path fillRule="evenodd" d="M10.125 14.375a.75.75 0 01.75-.75h4.375a.75.75 0 010 1.5h-4.375a.75.75 0 01-.75-.75zM8.625 11.375a.75.75 0 01.75-.75h6.375a.75.75 0 010 1.5h-6.375a.75.75 0 01-.75-.75zM11.625 8.375a.75.75 0 01.75-.75h.375a.75.75 0 010 1.5h-.375a.75.75 0 01-.75-.75z" clipRule="evenodd" />
                    </svg>
                    Написать продавцу
                </>}
            </button>
        )}
    </>
  );

  const CarPurchaseActions = () => (
    <>
        <div className="mb-6">
            <p className="text-4xl font-bold text-brand-primary">{getFormattedPrice(displayPrice || 0)}</p>
        </div>
        <div className="space-y-4">
             <div className="bg-brand-background/50 p-4 rounded-lg text-center">
                <p className="text-sm text-brand-text-secondary">Для покупки автомобиля свяжитесь с продавцом, чтобы договориться об осмотре и обсудить детали.</p>
             </div>
            <button onClick={handleContactSeller} disabled={isContacting} className="w-full bg-brand-primary hover:bg-brand-primary-hover text-white font-bold py-4 text-lg rounded-lg transition-colors flex items-center justify-center gap-2">
                {isContacting ? <Spinner size="sm" /> : <>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                      <path fillRule="evenodd" d="M4.5 2A1.5 1.5 0 003 3.5v9A1.5 1.5 0 004.5 14h5.25a.75.75 0 010 1.5H4.5A3 3 0 011.5 12.5v-9A3 3 0 014.5 2h11A3 3 0 0118.5 5v3.5a.75.75 0 01-1.5 0V5a1.5 1.5 0 00-1.5-1.5h-11z" clipRule="evenodd" />
                      <path fillRule="evenodd" d="M10.125 14.375a.75.75 0 01.75-.75h4.375a.75.75 0 010 1.5h-4.375a.75.75 0 01-.75-.75zM8.625 11.375a.75.75 0 01.75-.75h6.375a.75.75 0 010 1.5h-6.375a.75.75 0 01-.75-.75zM11.625 8.375a.75.75 0 01.75-.75h.375a.75.75 0 010 1.5h-.375a.75.75 0 01-.75-.75z" clipRule="evenodd" />
                    </svg>
                    Написать продавцу
                </>}
            </button>
            {product.seller.phoneNumber && (
                <button onClick={() => setShowPhone(!showPhone)} className="w-full bg-brand-surface hover:bg-brand-border border border-brand-border text-white font-bold py-3 rounded-lg">
                    {showPhone ? product.seller.phoneNumber : 'Показать телефон'}
                </button>
            )}
        </div>
    </>
  );

  const ServicePurchaseActions = () => (
    <div className="bg-brand-surface/50 p-6 rounded-lg border border-brand-border">
        <div className="mb-4">
            <p className="text-sm text-brand-text-secondary">Стоимость услуги</p>
            <p className="text-4xl font-bold text-brand-primary">{getFormattedPrice(displayPrice || 0)}</p>
        </div>
        <button
            onClick={handleAddToCart}
            className="w-full bg-brand-primary hover:bg-brand-primary-hover text-white font-bold py-4 text-lg rounded-lg transition-colors"
        >
            Заказать услугу
        </button>
        {product.seller.id !== user.id && (
            <button
                onClick={handleContactSeller}
                disabled={isContacting}
                className="w-full mt-3 bg-brand-surface hover:bg-brand-border border border-brand-border text-white font-bold py-3 rounded-lg transition-colors"
            >
                {isContacting ? <Spinner size="sm"/> : 'Обсудить детали'}
            </button>
        )}
    </div>
  );

  return (
    <>
      {affiliateId && <AffiliateBanner affiliateId={affiliateId} />}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Product Media Gallery */}
        <div className="space-y-4">
            <div className="bg-brand-surface rounded-lg p-2 aspect-square flex items-center justify-center">
                {activeMedia === 'image' ? (
                     <img 
                        src={product.imageUrls[selectedImageIndex]} 
                        alt={product.title} 
                        className="w-full h-full object-contain rounded-lg" 
                    />
                ) : (
                    <video 
                        src={product.videoUrl} 
                        controls 
                        className="w-full h-full object-contain rounded-lg"
                    />
                )}
            </div>
            <div className="flex space-x-2 overflow-x-auto pb-2">
                {product.imageUrls.map((url, index) => (
                    <button 
                        key={index} 
                        onClick={() => { setActiveMedia('image'); setSelectedImageIndex(index); }}
                        className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${activeMedia === 'image' && selectedImageIndex === index ? 'border-brand-primary' : 'border-transparent hover:border-brand-secondary'}`}
                    >
                        <img src={url} alt={`Thumbnail ${index + 1}`} className="w-full h-full object-cover" />
                    </button>
                ))}
                {product.videoUrl && (
                    <button 
                        onClick={() => setActiveMedia('video')}
                        className={`relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${activeMedia === 'video' ? 'border-brand-primary' : 'border-transparent hover:border-brand-secondary'}`}
                    >
                        <img src={product.imageUrls[0]} alt="Video thumbnail" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-8 h-8 text-white">
                              <path fillRule="evenodd" d="M2 10a8 8 0 1116 0 8 8 0 01-16 0zm6.39-2.908a.75.75 0 01.766.027l3.5 2.25a.75.75 0 010 1.262l-3.5 2.25A.75.75 0 018 12.25v-4.5a.75.75 0 01.39-.658z" clipRule="evenodd" />
                            </svg>
                        </div>
                    </button>
                )}
            </div>
        </div>

        {/* Product Details */}
        <div>
          {product.authenticationStatus === 'AUTHENTICATED' && (
              <div className="mb-4">
                  <AuthenticatedBadge 
                    reportUrl={product.authenticationReportUrl} 
                    nftTokenId={product.nftTokenId}
                    onClick={product.nftTokenId ? () => setIsNftModalOpen(true) : undefined}
                  />
              </div>
          )}
          <h1 className="text-3xl lg:text-4xl font-bold text-white mb-3">{product.title}</h1>
          <div className="flex flex-wrap gap-2 mb-4">
              {product.productType !== 'SERVICE' && product.uniqueness && (
                  <span className="inline-block bg-sky-500/20 text-sky-300 text-sm font-semibold px-3 py-1 rounded-full">
                      {uniquenessMap[product.uniqueness] || product.uniqueness}
                  </span>
              )}
              {product.productType === 'DIGITAL' && (
                  <span className="inline-block bg-indigo-500/20 text-indigo-300 text-sm font-semibold px-3 py-1 rounded-full">
                      💻 Цифровой товар
                  </span>
              )}
               {product.productType === 'SERVICE' && (
                  <span className="inline-block bg-purple-500/20 text-purple-300 text-sm font-semibold px-3 py-1 rounded-full">
                      🛠️ Услуга
                  </span>
              )}
           </div>
          <div className="flex items-center mb-4">
            <StarRating rating={parseFloat(averageRating)} />
            <span className="text-brand-text-secondary ml-2">({totalReviews} отзывов)</span>
          </div>
          
          {/* Variant Selectors */}
          {product.variantAttributes && product.variantAttributes.map(attr => (
              <div key={attr.name} className="mb-4">
                  <label className="block text-sm font-medium text-brand-text-secondary mb-2">{attr.name}</label>
                  <div className="flex flex-wrap gap-2">
                      {attr.options.map(option => (
                          <button
                              key={option}
                              onClick={() => handleOptionChange(attr.name, option)}
                              className={`px-4 py-2 text-sm font-semibold rounded-lg border-2 transition-colors ${selectedOptions[attr.name] === option ? 'bg-brand-primary border-brand-primary text-white' : 'bg-brand-surface border-brand-border hover:border-brand-secondary text-brand-text-primary'}`}
                          >
                              {option}
                          </button>
                      ))}
                  </div>
              </div>
          ))}

          {product.isAuction ? (
              <AuctionInfo product={product} />
          ) : product.category === 'Автомобили' ? (
              <CarPurchaseActions />
          ) : product.productType === 'SERVICE' ? (
              <ServicePurchaseActions />
          ) : (
              <StandardPurchaseActions />
          )}

          <AuthenticationInfo product={product} />

          <div className="mt-8 border-t border-brand-border pt-6">
            <h3 className="font-semibold text-white mb-2 text-lg">Описание</h3>
            <p className="text-brand-text-secondary whitespace-pre-wrap leading-relaxed">{product.description}</p>
          </div>
          
           {product.category === 'Автомобили' ? (
                <CarSpecifications attributes={product.dynamicAttributes} />
           ) : product.productType === 'SERVICE' ? (
                <div className="mt-6">
                    <h3 className="font-semibold text-white mb-3 text-lg">Детали услуги</h3>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="bg-brand-surface p-3 rounded-md">
                            <p className="text-brand-text-secondary">Срок выполнения</p>
                            <p className="font-semibold text-white">{product.turnaroundTime || 'Не указан'}</p>
                        </div>
                        <div className="bg-brand-surface p-3 rounded-md">
                            <p className="text-brand-text-secondary">Место оказания</p>
                            <p className="font-semibold text-white">{product.serviceLocation === 'REMOTE' ? 'Удаленно' : 'На месте'}</p>
                        </div>
                    </div>
                </div>
           ) : Object.keys(product.dynamicAttributes).length > 0 && (
             <div className="mt-6">
                 <h3 className="font-semibold text-white mb-3 text-lg">Характеристики</h3>
                 <div className="grid grid-cols-2 gap-3 text-sm">
                     {Object.entries(product.dynamicAttributes).map(([key, value]) => (
                         <div key={key} className="bg-brand-surface p-3 rounded-md">
                             <p className="text-brand-text-secondary">{key}</p>
                             <p className="font-semibold text-white">{value}</p>
                         </div>
                     ))}
                 </div>
            </div>
           )}

          <div className="mt-8 border-t border-brand-border pt-6">
             <h3 className="font-semibold text-white mb-3 text-lg">Продавец</h3>
             <div className="flex items-center bg-brand-surface p-4 rounded-lg">
                <Link to={`/profile/${product.seller.id}`} className="flex items-center flex-grow">
                    <img src={product.seller.avatarUrl} alt={product.seller.name} className="w-14 h-14 rounded-full mr-4"/>
                    <div>
                        <p className="font-bold text-white text-lg flex items-center gap-2">
                            {product.seller.name}
                            {product.seller.verificationLevel && product.seller.verificationLevel !== 'NONE' && <VerifiedBadge level={product.seller.verificationLevel} />}
                        </p>
                        <div className="flex items-center text-sm">
                            <StarRating rating={product.seller.rating}/>
                            <span className="text-brand-text-secondary ml-2">{product.seller.rating.toFixed(1)}</span>
                        </div>
                    </div>
                </Link>
             </div>
          </div>
        </div>
      </div>
      
      {/* Reviews Section */}
      <div className="mt-16">
          <h2 className="text-2xl font-bold text-white mb-6">Отзывы ({totalReviews})</h2>
          <div className="space-y-6">
              {reviews.length > 0 ? reviews.map(review => (
                   <div key={review.id} className="bg-brand-surface p-5 rounded-lg">
                       <div className="flex items-start">
                           <img src={review.author.avatarUrl} alt={review.author.name} className="w-12 h-12 rounded-full mr-4"/>
                           <div className="flex-1">
                               <div className="flex justify-between items-center mb-1">
                                   <h4 className="font-bold text-white">{review.author.name}</h4>
                                   <span className="text-xs text-brand-text-secondary">{new Date(review.timestamp).toLocaleDateString()}</span>
                               </div>
                               <div className="mb-2"><StarRating rating={review.rating} /></div>
                               <p className="text-brand-text-primary leading-relaxed">{review.text}</p>
                           </div>
                       </div>
                   </div>
              )) : (
                  <p className="text-brand-text-secondary text-center py-8">На этот товар еще нет отзывов.</p>
              )}
          </div>
      </div>
      
       {/* Related Products */}
      {relatedProducts.length > 0 && (
         <div className="mt-16">
              <h2 className="text-2xl font-bold text-white mb-6">Похожие товары</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {relatedProducts.map(p => <ProductCard key={p.id} product={p}/>)}
            </div>
         </div>
      )}

      {isWalletModalOpen && !product.isAuction && (
        <WalletModal 
            isOpen={isWalletModalOpen}
            onClose={() => setIsWalletModalOpen(false)}
            // FIX: Pass the full product object to the modal for promo validation.
            product={product}
            productPrice={displayPrice || 0}
            sellerId={product.seller.id}
            onConfirm={handlePurchase}
            isProcessing={isProcessingPurchase}
            giftWrapAvailable={product.giftWrapAvailable}
            giftWrapPrice={product.giftWrapPrice}
        />
      )}
      {isBidModalOpen && product.isAuction && (
        <BidModal
            isOpen={isBidModalOpen}
            onClose={() => setIsBidModalOpen(false)}
            onSubmit={handlePlaceBid}
            product={product}
        />
      )}
      {isNftModalOpen && (
        <NFTCertificateModal 
            product={product}
            onClose={() => setIsNftModalOpen(false)}
        />
      )}
    </>
  );
};

export default ProductDetailPage;