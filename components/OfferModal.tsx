import React, { useState, useEffect } from 'react';
import type { User, Product, PromoCode } from '../types';
import { apiService } from '../services/apiService';
import Spinner from './Spinner';

interface OfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipient: User;
  product: Product;
}

const OfferModal: React.FC<OfferModalProps> = ({ isOpen, onClose, recipient, product }) => {
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [sentId, setSentId] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      apiService.getPromoCodesBySellerId(product.seller.id)
        .then(setPromoCodes)
        .finally(() => setIsLoading(false));
    }
  }, [isOpen, product.seller.id]);

  const handleSendOffer = async (promoCode: PromoCode) => {
    setSubmittingId(promoCode.id);
    setError('');
    try {
      await apiService.sendPersonalOffer(product.seller.id, recipient.id, product.id, promoCode.id);
      setSentId(promoCode.id);
      setTimeout(() => {
        onClose();
        // Reset state for next time modal opens
        setSentId(null);
        setSubmittingId(null);
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Не удалось отправить предложение.');
      setSubmittingId(null);
    }
  };

  // FIX: Update profit calculation to handle both percentage and fixed amount discounts.
  const calculateProfit = (price: number, promo: PromoCode, purchaseCost: number, commissionRate: number) => {
      const discountedPrice = promo.discountType === 'PERCENTAGE'
          ? price * (1 - promo.discountValue / 100)
          : Math.max(0, price - promo.discountValue);
      const commission = discountedPrice * commissionRate;
      const profit = discountedPrice - purchaseCost - commission;
      return {
          discountedPrice: discountedPrice.toFixed(2),
          profit: profit.toFixed(2),
      }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-brand-surface rounded-2xl shadow-2xl w-full max-w-lg border border-brand-border" onClick={e => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
             <div>
                <h2 className="text-2xl font-bold text-white">Персональное предложение</h2>
                <p className="text-brand-text-secondary text-sm">для {recipient.name}</p>
             </div>
            <button type="button" onClick={onClose} className="text-brand-text-secondary hover:text-white text-3xl leading-none">&times;</button>
          </div>
          
          <div className="flex items-center bg-brand-background p-3 rounded-lg mb-6">
            <img src={product.imageUrls[0]} alt={product.title} className="w-16 h-16 object-cover rounded-md mr-4"/>
            <div>
              <p className="text-brand-text-secondary text-sm">на товар:</p>
              <p className="font-semibold text-white">{product.title}</p>
            </div>
          </div>
          
          <h3 className="font-semibold text-white mb-3">Выберите скидку для отправки:</h3>

          {isLoading ? (
            <div className="flex justify-center py-8"><Spinner /></div>
          ) : promoCodes.length > 0 ? (
            <div className="space-y-3 max-h-72 overflow-y-auto pr-2">
                {promoCodes.map(promo => {
                    // FIX: Pass the whole promo object to the calculation function.
                    const { discountedPrice, profit } = calculateProfit((product.price || 0), promo, product.purchaseCost || 0, 0.02);
                    const isSubmitting = submittingId === promo.id;
                    const isSent = sentId === promo.id;

                    return (
                        <div key={promo.id} className={`p-3 rounded-lg flex items-center gap-4 transition-colors ${isSent ? 'bg-green-500/20' : 'bg-brand-background/50'}`}>
                            <div className="flex-1">
                                {/* FIX: Use discountValue and check discountType to display the offer correctly. */}
                                <p className="font-bold text-lg text-brand-primary">{promo.discountValue}{promo.discountType === 'PERCENTAGE' ? '%' : ' USDT'} скидка</p>
                                <p className="text-sm text-brand-text-secondary">
                                    Цена: <span className="line-through">{(product.price || 0).toFixed(2)}</span> <span className="font-semibold text-white">{discountedPrice} USDT</span>
                                </p>
                                 <p className="text-sm text-green-400">
                                    Ваша прибыль: <span className="font-bold">{profit} USDT</span>
                                </p>
                            </div>
                            <button 
                                onClick={() => handleSendOffer(promo)} 
                                disabled={isSubmitting || !!sentId}
                                className="w-28 text-center bg-brand-secondary hover:bg-brand-primary-hover text-white font-bold py-2 px-3 rounded-lg text-sm transition-all flex justify-center items-center disabled:bg-gray-500 disabled:cursor-not-allowed"
                            >
                               {isSubmitting ? <Spinner size="sm"/> : (isSent ? 'Отправлено!' : 'Отправить')}
                            </button>
                        </div>
                    )
                })}
            </div>
          ) : (
            <div className="text-center py-8 bg-brand-background rounded-lg">
                <p className="text-brand-text-secondary">У вас нет активных промокодов.</p>
                <p className="text-sm text-brand-text-secondary mt-2">Создайте их на вкладке "Настройки".</p>
            </div>
          )}
          {error && <p className="text-red-500 text-sm mt-4 text-center">{error}</p>}
        </div>
      </div>
    </div>
  );
};

export default OfferModal;