import React, { useState, useMemo } from 'react';
import { useTonConnectUI, useTonWallet, useTonAddress } from '../hooks/useTonConnect';
import { apiService } from '../services/apiService';
import Spinner from './Spinner';
import { useCurrency, Currency } from '../hooks/useCurrency';
// FIX: Import Product and CartItem types to construct the payload for promo code validation.
import type { Product, CartItem } from '../types';

const TREASURY_WALLET_ADDRESS = "UQARnCdfRw0VcT86ApqHJEdMGzQU3T_MnPbNs71A6nOXcF91";

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  productPrice: number;
  sellerId: string;
  onConfirm: (options: {promoCodeId?: string, isGift?: boolean, giftWrap?: boolean, giftMessage?: string }) => Promise<void>;
  isProcessing: boolean;
  giftWrapAvailable?: boolean;
  giftWrapPrice?: number;
}

const WalletModal: React.FC<WalletModalProps> = ({ isOpen, onClose, product, productPrice, sellerId, onConfirm, isProcessing, giftWrapAvailable, giftWrapPrice }) => {
  const [promoCodeInput, setPromoCodeInput] = useState('');
  // FIX: Update appliedPromo state to handle both percentage and fixed amount discounts.
  const [appliedPromo, setAppliedPromo] = useState<{ id: string; value: number; type: 'PERCENTAGE' | 'FIXED_AMOUNT' } | null>(null);
  const [promoError, setPromoError] = useState('');
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);
  
  const [isGift, setIsGift] = useState(false);
  const [addGiftWrap, setAddGiftWrap] = useState(false);
  const [giftMessage, setGiftMessage] = useState('');
  
  const [error, setError] = useState('');
  const [isSendingTx, setIsSendingTx] = useState(false);
  
  const [tonConnectUI] = useTonConnectUI();
  const wallet = useTonWallet();
  const userFriendlyAddress = useTonAddress();

  const { currency: globalCurrency, exchangeRates } = useCurrency();
  const [paymentCurrency, setPaymentCurrency] = useState<Currency>(globalCurrency);

  const finalPriceUSDT = useMemo(() => {
    let price = productPrice;
    // FIX: Correctly calculate final price based on discount type.
    if (appliedPromo) {
      if (appliedPromo.type === 'PERCENTAGE') {
        price = price * (1 - appliedPromo.value / 100);
      } else { // FIXED_AMOUNT
        price = Math.max(0, price - appliedPromo.value);
      }
    }
    if (addGiftWrap && giftWrapPrice) {
      price += giftWrapPrice;
    }
    return price;
  }, [productPrice, appliedPromo, addGiftWrap, giftWrapPrice]);

  const paymentAmount = useMemo(() => {
      const rate = exchangeRates[paymentCurrency];
      return finalPriceUSDT / rate;
  }, [finalPriceUSDT, paymentCurrency, exchangeRates]);

  if (!isOpen) return null;

  const handleApplyPromo = async () => {
      if (!promoCodeInput.trim()) return;
      setIsApplyingPromo(true);
      setPromoError('');
      setAppliedPromo(null);
      try {
          // FIX: Create a temporary CartItem to pass to the validation function.
          const tempCartItem: CartItem = {
            product: product,
            quantity: 1,
            priceAtTimeOfAddition: productPrice,
            purchaseType: 'RETAIL'
          };
          // FIX: Pass all required arguments to validatePromoCode and use correct returned property names.
          const { discountValue, discountType, codeId } = await apiService.validatePromoCode(promoCodeInput, sellerId, [tempCartItem]);
          setAppliedPromo({ id: codeId, value: discountValue, type: discountType });
      } catch (err: any) {
          setPromoError(err.message);
      } finally {
          setIsApplyingPromo(false);
      }
  };

  const handleDeposit = async () => {
    if (!wallet) {
      setError('Кошелек не подключен.');
      return;
    }
    setError('');
    setIsSendingTx(true);

    // Note: The logic for sending different tokens would vary.
    // This mock assumes sending TON regardless of selected currency for simplicity.
    const transaction = {
      validUntil: Math.floor(Date.now() / 1000) + 600, // 10 minutes
      messages: [
        {
          address: TREASURY_WALLET_ADDRESS,
          amount: (paymentAmount * 1_000_000_000).toString(), // This is specific to TON's decimal places
          // For other tokens (Jettons), the structure would be different.
        },
      ],
    };

    try {
      await tonConnectUI.sendTransaction(transaction);
      await onConfirm({
          promoCodeId: appliedPromo?.id,
          isGift,
          giftWrap: addGiftWrap,
          giftMessage: isGift ? giftMessage : undefined
      });
    } catch (err) {
      console.error('Ошибка отправки транзакции:', err);
      setError('Транзакция была отклонена или произошла ошибка.');
    } finally {
      setIsSendingTx(false);
    }
  };

  const resetAndClose = () => {
    setError(''); setPromoError(''); setAppliedPromo(null); setPromoCodeInput('');
    setIsGift(false); setAddGiftWrap(false); setGiftMessage(''); setIsSendingTx(false);
    onClose();
  };

  const isLoading = isSendingTx || isProcessing;
  const paymentOptions: Currency[] = ['TON', 'USDT', 'USDC'];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-brand-surface rounded-2xl shadow-2xl w-full max-w-md border border-brand-border">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-white">Подтверждение оплаты</h2>
            <button onClick={resetAndClose} className="text-brand-text-secondary hover:text-white text-3xl leading-none">&times;</button>
          </div>
          
          {!wallet ? (
             <div className="text-center">
                <p className="text-brand-text-secondary mb-6">Подключите ваш кошелек TON, чтобы совершить покупку.</p>
                <p className="text-sm text-yellow-400">Вернитесь на главную и нажмите "Подключить кошелек" в шапке сайта.</p>
             </div>
          ) : (
            <div>
              <div className="bg-brand-background p-3 rounded-lg mb-4 text-center">
                  <p className="text-xs text-brand-text-secondary">Подключен кошелек:</p>
                  <p className="text-sm font-mono text-brand-primary break-all">{userFriendlyAddress}</p>
              </div>

              {/* Gifting & Promo */}
              <div className="space-y-4 mb-4 border-b border-brand-border pb-4">
                  {/* Promo */}
                  <div>
                      <label className="block text-sm font-medium text-brand-text-secondary">Промокод</label>
                      <div className="flex gap-2 mt-1">
                          <input type="text" placeholder="Например, WELCOME10" value={promoCodeInput} onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase())} disabled={isApplyingPromo || !!appliedPromo} className="flex-grow bg-brand-background border border-brand-border rounded-md shadow-sm p-2 disabled:opacity-50" />
                          <button onClick={handleApplyPromo} disabled={isApplyingPromo || !promoCodeInput.trim() || !!appliedPromo} className="px-4 py-2 bg-brand-secondary hover:bg-brand-primary text-white font-bold rounded-lg transition-colors flex items-center justify-center disabled:bg-gray-500 disabled:cursor-not-allowed">{isApplyingPromo ? <Spinner size="sm" /> : "Применить"}</button>
                      </div>
                      {promoError && <p className="text-red-500 text-sm mt-1">{promoError}</p>}
                      {/* FIX: Display correct discount value and type. */}
                      {appliedPromo && <p className="text-green-400 text-sm mt-1">Промокод "{promoCodeInput}" на -{appliedPromo.value}{appliedPromo.type === 'PERCENTAGE' ? '%' : ' USDT'} применен!</p>}
                  </div>
                  {/* Gifting */}
                  <label className="flex items-center space-x-3 cursor-pointer">
                       <input type="checkbox" checked={isGift} onChange={() => setIsGift(!isGift)} className="h-4 w-4 rounded bg-brand-background border-brand-border text-brand-primary focus:ring-brand-primary"/>
                       <span className="font-medium text-white">🎁 Это подарок</span>
                  </label>
                  {isGift && (
                      <div className="pl-4 border-l-2 border-brand-border space-y-4 animate-fade-in-down">
                          {giftWrapAvailable && <label className="flex items-center space-x-3 cursor-pointer"><input type="checkbox" checked={addGiftWrap} onChange={() => setAddGiftWrap(!addGiftWrap)} className="h-4 w-4 rounded bg-brand-background border-brand-border text-brand-primary focus:ring-brand-primary"/><span className="text-brand-text-primary">Добавить подарочную упаковку (+{giftWrapPrice} USDT)</span></label>}
                          <div>
                               <label className="block text-sm font-medium text-brand-text-secondary mb-1">Сообщение для открытки</label>
                               <textarea value={giftMessage} onChange={(e) => setGiftMessage(e.target.value)} rows={2} placeholder="Например: С Днем Рождения!" className="w-full bg-brand-background border border-brand-border rounded-md shadow-sm p-2" />
                          </div>
                      </div>
                  )}
              </div>

              {/* Payment Selection */}
              <div className="mb-4">
                  <label className="block text-sm font-medium text-brand-text-secondary mb-2">Выберите валюту платежа</label>
                  <div className="grid grid-cols-3 gap-2">
                      {paymentOptions.map(option => (
                          <button key={option} onClick={() => setPaymentCurrency(option)} className={`py-2 px-3 rounded-lg text-center font-bold border-2 transition-colors ${paymentCurrency === option ? 'bg-brand-primary border-brand-primary' : 'bg-brand-surface border-brand-border hover:border-brand-secondary'}`}>{option}</button>
                      ))}
                  </div>
              </div>

              <div className="mb-4 text-center border-t border-brand-border pt-4">
                <label className="block text-sm font-medium text-brand-text-secondary mb-2">Сумма к оплате</label>
                {/* FIX: Display correct discount info. */}
                {(appliedPromo || addGiftWrap) && <div className="text-sm text-brand-text-secondary"><span className="line-through">{productPrice.toFixed(2)} USDT</span>{appliedPromo && <span className="text-green-400 ml-2">(-{appliedPromo.value}{appliedPromo.type === 'PERCENTAGE' ? '%' : ' USDT'})</span>}{addGiftWrap && <span className="text-blue-300 ml-2">(+ уп.)</span>}</div>}
                <p className="text-3xl font-bold text-white">{paymentAmount.toFixed(paymentCurrency === 'TON' ? 4 : 2)} {paymentCurrency}</p>
                <p className="text-brand-text-secondary text-sm">~{finalPriceUSDT.toFixed(2)} USDT</p>
                {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
              </div>
              
              <div className="mb-4 flex items-center justify-center gap-2 text-green-400">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.286zm0 13.036h.008v.008h-.008v-.008z" />
                  </svg>
                  <span className="text-xs font-semibold">Средства будут переведены продавцу после подтверждения получения.</span>
              </div>

              <button onClick={handleDeposit} disabled={isLoading} className="w-full bg-brand-primary hover:bg-brand-primary-hover text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center disabled:bg-gray-500 disabled:cursor-not-allowed">
                {isLoading ? (<><svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>{isSendingTx ? 'Ожидание подтверждения...' : 'Обработка покупки...'}</>) : `Оплатить ${paymentAmount.toFixed(paymentCurrency === 'TON' ? 4 : 2)} ${paymentCurrency}`}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WalletModal;