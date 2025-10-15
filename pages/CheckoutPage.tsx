import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../hooks/useCart';
import { useAuth } from '../hooks/useAuth';
import { useCurrency } from '../hooks/useCurrency';
import { apiService } from '../services/apiService';
import type { ShippingAddress, User, CartItem, NovaPoshtaCity, NovaPoshtaWarehouse } from '../types';
import Spinner from '../components/Spinner';
import { useTelegramBackButton } from '../hooks/useTelegram';
import PaymentModal from '../components/PaymentModal';
// FIX: Import AUTHENTICATION_FEE constant to resolve reference error.
import { TREASURY_WALLET_ADDRESS, AUTHENTICATION_FEE } from '../constants';
import DynamicIcon from '../components/DynamicIcon';

type CheckoutStep = 'shipping' | 'payment' | 'summary';

type PaymentMethod = 'ESCROW' | 'DIRECT_TON' | 'INFO_CARD';

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
}

const CheckoutPage: React.FC = () => {
    const { user } = useAuth();
    const { cartItems, clearCart, removeItemsIfSoldOut } = useCart();
    const { getFormattedPrice } = useCurrency();
    const navigate = useNavigate();
    const cityInputRef = useRef<HTMLInputElement>(null);
    const warehouseInputRef = useRef<HTMLInputElement>(null);

    useTelegramBackButton(true);

    const [step, setStep] = useState<CheckoutStep>('shipping');
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState('');

    // Promo Code State
    const [appliedPromos, setAppliedPromos] = useState<Record<string, { code: string, value: number, type: 'PERCENTAGE' | 'FIXED_AMOUNT' }>>({});
    const [promoCodeInputs, setPromoCodeInputs] = useState<Record<string, string>>({});
    const [promoErrors, setPromoErrors] = useState<Record<string, string>>({});
    const [promoLoading, setPromoLoading] = useState<Record<string, boolean>>({});

    const [shippingMethod, setShippingMethod] = useState<'NOVA_POSHTA' | 'UKRPOSHTA'>('NOVA_POSHTA');
    const [shippingAddress, setShippingAddress] = useState<ShippingAddress>(user.defaultShippingAddress || {
        city: '',
        postOffice: '',
        recipientName: user.name,
        phoneNumber: user.phoneNumber || '',
    });
    const [shippingCosts, setShippingCosts] = useState<Record<string, number>>({});
    const [isCalculatingShipping, setIsCalculatingShipping] = useState(false);

    // Nova Poshta state
    const [citySearch, setCitySearch] = useState(shippingAddress.city);
    const [warehouseSearch, setWarehouseSearch] = useState(shippingAddress.postOffice);
    const [citySuggestions, setCitySuggestions] = useState<NovaPoshtaCity[]>([]);
    const [warehouseSuggestions, setWarehouseSuggestions] = useState<NovaPoshtaWarehouse[]>([]);
    const [isCityLoading, setIsCityLoading] = useState(false);
    const [isWarehouseLoading, setIsWarehouseLoading] = useState(false);
    const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false);
    const [isWarehouseDropdownOpen, setIsWarehouseDropdownOpen] = useState(false);

    const debouncedCitySearch = useDebounce(citySearch, 300);
    const debouncedWarehouseSearch = useDebounce(warehouseSearch, 300);


    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('ESCROW');
    const [requestAuthentication, setRequestAuthentication] = useState(false);
    
    const [paymentModalState, setPaymentModalState] = useState<{
      isOpen: boolean;
      amount: number;
      recipientAddress: string;
      onSuccess: (txHash: string) => void;
    }>({
      isOpen: false,
      amount: 0,
      recipientAddress: '',
      onSuccess: () => {},
    });

    // Fetch city suggestions
    useEffect(() => {
        if (debouncedCitySearch.length > 1 && debouncedCitySearch !== shippingAddress.city) {
            setIsCityLoading(true);
            setShippingAddress(prev => ({ ...prev, cityRef: undefined, warehouseRef: undefined, postOffice: '' }));
            setWarehouseSearch('');
            apiService.novaPoshtaGetCities(debouncedCitySearch).then(data => {
                setCitySuggestions(data);
                setIsCityLoading(false);
                setIsCityDropdownOpen(true);
            });
        } else {
            setCitySuggestions([]);
        }
    }, [debouncedCitySearch]);

    // Fetch warehouse suggestions
    useEffect(() => {
        if (shippingAddress.cityRef) {
            setIsWarehouseLoading(true);
            apiService.novaPoshtaGetWarehouses(shippingAddress.cityRef, debouncedWarehouseSearch).then(data => {
                setWarehouseSuggestions(data);
                setIsWarehouseLoading(false);
                setIsWarehouseDropdownOpen(true);
            });
        } else {
            setWarehouseSuggestions([]);
        }
    }, [shippingAddress.cityRef, debouncedWarehouseSearch]);


    const isAuthenticationAvailable = useMemo(() => {
        return cartItems.some(item => item.product.isAuthenticationAvailable);
    }, [cartItems]);

    const groupedBySeller = useMemo(() => {
        return cartItems.reduce((acc, item) => {
            const sellerId = item.product.seller.id;
            if (!acc[sellerId]) {
                const sellerData = sellerId === user.id ? user : item.product.seller;
                acc[sellerId] = {
                    seller: sellerData,
                    items: [],
                    subtotal: 0,
                };
            }
            const price = item.priceAtTimeOfAddition;
            acc[sellerId].items.push(item);
            acc[sellerId].subtotal += price * item.quantity;
            return acc;
        }, {} as Record<string, { seller: User; items: CartItem[], subtotal: number }>);
    }, [cartItems, user]);
    
    const { isDirectTonPossible, isDirectCardPossible } = useMemo(() => {
        const sellerIds = Object.keys(groupedBySeller);
        if (sellerIds.length !== 1) {
            return { isDirectTonPossible: false, isDirectCardPossible: false };
        }
        const seller = groupedBySeller[sellerIds[0]].seller;
        return {
            isDirectTonPossible: !!seller.tonWalletAddress,
            isDirectCardPossible: !!seller.paymentCard,
        };
    }, [groupedBySeller]);

    useEffect(() => {
        if (paymentMethod === 'DIRECT_TON' && !isDirectTonPossible) {
            setPaymentMethod('ESCROW');
        }
        if (paymentMethod === 'INFO_CARD' && !isDirectCardPossible) {
            setPaymentMethod('ESCROW');
        }
    }, [isDirectTonPossible, isDirectCardPossible, paymentMethod]);

    const totalShippingCost = useMemo(() => {
        return Object.values(shippingCosts).reduce((sum, cost) => sum + cost, 0);
    }, [shippingCosts]);

    const grandTotal = useMemo(() => {
        let total = 0;
        for (const sellerId in groupedBySeller) {
            const { subtotal } = groupedBySeller[sellerId];
            const promo = appliedPromos[sellerId];
            let discountAmount = 0;
            if (promo) {
                if (promo.type === 'PERCENTAGE') {
                    discountAmount = subtotal * (promo.value / 100);
                } else { // FIXED_AMOUNT
                    discountAmount = promo.value;
                }
            }
            total += subtotal - discountAmount;
        }
        return Math.max(0, total) + (requestAuthentication ? AUTHENTICATION_FEE : 0) + totalShippingCost;
    }, [groupedBySeller, appliedPromos, requestAuthentication, totalShippingCost]);

    if (cartItems.length === 0 && !isProcessing) {
        navigate('/cart');
        return null;
    }

    const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setShippingAddress({ ...shippingAddress, [e.target.name]: e.target.value });
    };

    const handleCitySelect = (city: NovaPoshtaCity) => {
        setCitySearch(city.Description);
        setShippingAddress(prev => ({
            ...prev,
            city: city.Description,
            cityRef: city.Ref,
            // Clear warehouse info when city changes
            postOffice: '', 
            warehouseRef: undefined 
        }));
        setCitySuggestions([]);
        setIsCityDropdownOpen(false);
        setWarehouseSearch('');
        warehouseInputRef.current?.focus();
    };

    const handleWarehouseSelect = (warehouse: NovaPoshtaWarehouse) => {
        setWarehouseSearch(warehouse.Description);
        setShippingAddress(prev => ({
            ...prev,
            postOffice: warehouse.Description,
            warehouseRef: warehouse.Ref
        }));
        setWarehouseSuggestions([]);
        setIsWarehouseDropdownOpen(false);
    };


    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        
        const isNpValid = shippingMethod === 'NOVA_POSHTA' ? (!!shippingAddress.cityRef && !!shippingAddress.warehouseRef) : true;
        
        if (
            !shippingAddress.recipientName?.trim() || 
            !shippingAddress.phoneNumber?.trim() ||
            !shippingAddress.city?.trim() ||
            !shippingAddress.postOffice?.trim() ||
            !isNpValid
        ) {
            setError('Пожалуйста, заполните все поля адреса, выбрав город и отделение из списка.');
            return;
        }
        
        if (step === 'shipping') {
            setIsCalculatingShipping(true);
            const costs: Record<string, number> = {};
            try {
                for (const sellerId in groupedBySeller) {
                    const { items } = groupedBySeller[sellerId];
                    const { cost } = await apiService.calculateShippingCost(items, shippingMethod);
                    costs[sellerId] = cost;
                }
                setShippingCosts(costs);
                setStep('payment');
            } catch (err) {
                setError("Не удалось рассчитать стоимость доставки.");
            } finally {
                setIsCalculatingShipping(false);
            }
        }
    };

    const handleApplyPromo = async (sellerId: string) => {
        const code = promoCodeInputs[sellerId];
        if (!code) return;
        setPromoLoading(prev => ({ ...prev, [sellerId]: true }));
        setPromoErrors(prev => ({ ...prev, [sellerId]: '' }));
        setAppliedPromos(prev => {
            const newPromos = { ...prev };
            delete newPromos[sellerId];
            return newPromos;
        });

        try {
            const sellerItems = groupedBySeller[sellerId].items;
            const { discountValue, discountType } = await apiService.validatePromoCode(code, sellerId, sellerItems);
            setAppliedPromos(prev => ({...prev, [sellerId]: { code, value: discountValue, type: discountType }}));
        } catch (err: any) {
            setPromoErrors(prev => ({...prev, [sellerId]: err.message}));
        } finally {
            setPromoLoading(prev => ({ ...prev, [sellerId]: false }));
        }
    };
    
    const handlePaymentSuccess = async (txHash: string, apiPaymentMethod: 'ESCROW' | 'DIRECT') => {
        setPaymentModalState(prev => ({...prev, isOpen: false}));
        setIsProcessing(true);
        setError('');
        try {
            await apiService.createOrdersFromCart(cartItems, user, apiPaymentMethod, shippingMethod, shippingAddress, requestAuthentication, appliedPromos, shippingCosts, txHash);
            alert("Заказ успешно оформлен!");
            clearCart();
            navigate('/profile?tab=purchases');
        } catch (err: any) {
            setError(err.message || 'Платеж прошел, но не удалось сохранить заказ. Обратитесь в поддержку.');
        }
    };

    const handleConfirmOrder = async () => {
        setIsProcessing(true);
        setError('');

        let recipientAddress = TREASURY_WALLET_ADDRESS;
        let apiPaymentMethod: 'ESCROW' | 'DIRECT' = 'ESCROW';

        if (paymentMethod === 'DIRECT_TON') {
            const sellerId = Object.keys(groupedBySeller)[0];
            recipientAddress = groupedBySeller[sellerId].seller.tonWalletAddress!;
            apiPaymentMethod = 'DIRECT';
        } else if (paymentMethod === 'ESCROW') {
            recipientAddress = TREASURY_WALLET_ADDRESS;
            apiPaymentMethod = 'ESCROW';
        } else {
            // INFO_CARD is an informational option and its button is disabled.
            setError("Этот способ оплаты является информационным и не поддерживает автоматические платежи.");
            setIsProcessing(false);
            return;
        }

        setIsProcessing(false); 
        setPaymentModalState({
            isOpen: true,
            amount: grandTotal,
            recipientAddress,
            onSuccess: (txHash) => handlePaymentSuccess(txHash, apiPaymentMethod)
        });
    }

    const renderStep = () => {
        switch (step) {
            case 'shipping':
                return (
                    <form onSubmit={handleFormSubmit}>
                        <h2 className="text-2xl font-bold mb-4">1. Доставка</h2>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-brand-text-secondary">ФИО получателя</label>
                                    <input type="text" name="recipientName" value={shippingAddress.recipientName} onChange={handleAddressChange} className="mt-1 block w-full bg-brand-background border border-brand-border rounded-md p-2" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-brand-text-secondary">Телефон</label>
                                    <input type="tel" name="phoneNumber" value={shippingAddress.phoneNumber} onChange={handleAddressChange} className="mt-1 block w-full bg-brand-background border border-brand-border rounded-md p-2" required />
                                </div>
                            </div>
                        </div>

                        <div className="my-6">
                            <label className="block text-sm font-medium text-brand-text-secondary mb-2">Способ доставки</label>
                            <div className="flex gap-2 p-1 bg-brand-background rounded-lg">
                                <label className={`flex-1 text-center cursor-pointer p-3 rounded-md transition-colors ${shippingMethod === 'NOVA_POSHTA' ? 'bg-brand-primary text-white' : 'hover:bg-brand-surface'}`}>
                                    <input type="radio" name="shippingMethod" value="NOVA_POSHTA" checked={shippingMethod === 'NOVA_POSHTA'} onChange={() => setShippingMethod('NOVA_POSHTA')} className="hidden"/>
                                    <span>Нова Пошта</span>
                                </label>
                                <label className={`flex-1 text-center cursor-pointer p-3 rounded-md transition-colors ${shippingMethod === 'UKRPOSHTA' ? 'bg-brand-primary text-white' : 'hover:bg-brand-surface'}`}>
                                    <input type="radio" name="shippingMethod" value="UKRPOSHTA" checked={shippingMethod === 'UKRPOSHTA'} onChange={() => setShippingMethod('UKRPOSHTA')} className="hidden"/>
                                    <span>Укрпошта</span>
                                </label>
                            </div>
                        </div>

                        {shippingMethod === 'NOVA_POSHTA' ? (
                            <div className="space-y-4">
                                <div className="relative">
                                    <label className="block text-sm font-medium text-brand-text-secondary">Город</label>
                                    <input ref={cityInputRef} type="text" value={citySearch} onChange={(e) => setCitySearch(e.target.value)} onFocus={() => setIsCityDropdownOpen(true)} onBlur={() => setTimeout(() => setIsCityDropdownOpen(false), 150)} className="mt-1 block w-full bg-brand-background border border-brand-border rounded-md p-2" required autoComplete="off" />
                                    {isCityLoading && <div className="absolute right-3 top-9"><Spinner size="sm" /></div>}
                                    {isCityDropdownOpen && citySuggestions.length > 0 && (
                                        <ul className="absolute z-10 w-full bg-brand-surface border border-brand-border rounded-md mt-1 max-h-60 overflow-y-auto shadow-lg">
                                            {citySuggestions.map(city => <li key={city.Ref} onMouseDown={() => handleCitySelect(city)} className="px-4 py-2 cursor-pointer hover:bg-brand-primary/20">{city.Description}</li>)}
                                        </ul>
                                    )}
                                </div>
                                <div className="relative">
                                    <label className="block text-sm font-medium text-brand-text-secondary">Отделение / Почтомат</label>
                                    <input ref={warehouseInputRef} type="text" value={warehouseSearch} onChange={(e) => setWarehouseSearch(e.target.value)} onFocus={() => setIsWarehouseDropdownOpen(true)} onBlur={() => setTimeout(() => setIsWarehouseDropdownOpen(false), 150)} disabled={!shippingAddress.cityRef} className="mt-1 block w-full bg-brand-background border border-brand-border rounded-md p-2 disabled:bg-brand-background/50 disabled:cursor-not-allowed" required autoComplete="off"/>
                                    {isWarehouseLoading && <div className="absolute right-3 top-9"><Spinner size="sm" /></div>}
                                    {isWarehouseDropdownOpen && warehouseSuggestions.length > 0 && (
                                        <ul className="absolute z-10 w-full bg-brand-surface border border-brand-border rounded-md mt-1 max-h-60 overflow-y-auto shadow-lg">
                                            {warehouseSuggestions.map(wh => <li key={wh.Ref} onMouseDown={() => handleWarehouseSelect(wh)} className="px-4 py-2 cursor-pointer hover:bg-brand-primary/20">{wh.Description}</li>)}
                                        </ul>
                                    )}
                                </div>
                            </div>
                        ) : (
                             <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-brand-text-secondary">Город</label>
                                    <input type="text" name="city" value={shippingAddress.city} onChange={handleAddressChange} className="mt-1 block w-full bg-brand-background border border-brand-border rounded-md p-2" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-brand-text-secondary">Отделение / Индекс</label>
                                    <input type="text" name="postOffice" value={shippingAddress.postOffice} onChange={handleAddressChange} className="mt-1 block w-full bg-brand-background border border-brand-border rounded-md p-2" required />
                                </div>
                            </div>
                        )}
                        
                        {error && <p className="text-red-500 text-sm mt-4 text-center">{error}</p>}
                        <button type="submit" disabled={isCalculatingShipping} className="w-full mt-6 bg-brand-primary hover:bg-brand-primary-hover text-white font-bold py-3 rounded-lg flex items-center justify-center disabled:bg-gray-500">
                            {isCalculatingShipping ? <Spinner size="sm" /> : 'Далее'}
                        </button>
                    </form>
                );
            case 'payment':
                return (
                    <div>
                        <h2 className="text-2xl font-bold mb-4">2. Оплата и Безопасность</h2>
                        <div className="space-y-4">
                            <label className={`block p-4 rounded-lg border-2 cursor-pointer ${paymentMethod === 'ESCROW' ? 'border-brand-primary bg-brand-primary/10' : 'border-brand-border bg-brand-background'}`}>
                                <input type="radio" name="paymentMethod" value="ESCROW" checked={paymentMethod === 'ESCROW'} onChange={() => setPaymentMethod('ESCROW')} className="hidden"/>
                                <div className="flex items-center gap-3">
                                    <DynamicIcon name="secure-deal" className="h-7 w-7 text-sky-400" fallback={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>} />
                                    <span className="font-bold text-white">Безопасная сделка (Эскроу)</span>
                                </div>
                                <p className="text-sm text-brand-text-secondary mt-1 pl-10">Ваши средства отправляются на кошелек платформы и хранятся там до подтверждения получения товара. Максимальная безопасность.</p>
                            </label>

                            {isAuthenticationAvailable && (
                                <div className="pl-4 border-l-4 border-brand-secondary/50">
                                    <label className={`block p-4 rounded-lg border-2 cursor-pointer ${requestAuthentication ? 'border-brand-secondary bg-brand-secondary/10' : 'border-brand-border bg-brand-background/50'}`}>
                                        <div className="flex items-start">
                                            <input type="checkbox" checked={requestAuthentication} onChange={(e) => setRequestAuthentication(e.target.checked)} className="h-5 w-5 rounded bg-brand-surface border-brand-border text-brand-secondary focus:ring-brand-secondary mt-1"/>
                                            <div className="ml-3">
                                                <span className="font-bold text-white">Заказать проверку подлинности (+{AUTHENTICATION_FEE} USDT)</span>
                                                <p className="text-sm text-brand-text-secondary mt-1">Продавец отправит товар в наш центр, где эксперт проверит его подлинность и состояние перед отправкой вам. Это добавит 2-3 дня к доставке, но гарантирует качество.</p>
                                            </div>
                                        </div>
                                    </label>
                                </div>
                            )}

                            {isDirectTonPossible && (
                                <label className={`block p-4 rounded-lg border-2 cursor-pointer ${paymentMethod === 'DIRECT_TON' ? 'border-brand-primary bg-brand-primary/10' : 'border-brand-border bg-brand-background'}`}>
                                    <input type="radio" name="paymentMethod" value="DIRECT_TON" checked={paymentMethod === 'DIRECT_TON'} onChange={() => setPaymentMethod('DIRECT_TON')} className="hidden"/>
                                    <span className="font-bold text-white">Напрямую на TON кошелек</span>
                                    <p className="text-sm text-brand-text-secondary mt-1">Средства сразу отправляются на личный кошелек продавца.</p>
                                </label>
                            )}

                            {isDirectCardPossible && (
                                <label className={`block p-4 rounded-lg border-2 cursor-pointer ${paymentMethod === 'INFO_CARD' ? 'border-brand-primary bg-brand-primary/10' : 'border-brand-border bg-brand-background'}`}>
                                    <input type="radio" name="paymentMethod" value="INFO_CARD" checked={paymentMethod === 'INFO_CARD'} onChange={() => setPaymentMethod('INFO_CARD')} className="hidden"/>
                                    <span className="font-bold text-white">На карту продавца (вручную)</span>
                                    <p className="text-sm text-brand-text-secondary mt-1">Оплата по договоренности напрямую с продавцом.</p>
                                </label>
                            )}

                        </div>
                        {paymentMethod === 'DIRECT_TON' && (
                            <div className="mt-4 p-4 bg-orange-500/10 border-2 border-orange-500/30 rounded-lg text-orange-300 text-sm flex items-start gap-3">
                                <DynamicIcon name="checkout-warning" className="h-6 w-6 flex-shrink-0" fallback={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>} />
                                <div>
                                    <strong>Внимание!</strong> Этот способ оплаты не защищен платформой. Вы переводите средства напрямую продавцу на свой страх и риск. CryptoCraft не сможет помочь в разрешении споров по таким сделкам.
                                </div>
                            </div>
                        )}
                        {paymentMethod === 'INFO_CARD' && (
                             <div className="mt-4 p-4 bg-sky-500/10 border-2 border-sky-500/30 rounded-lg text-sky-300 text-sm flex items-start gap-3">
                                <DynamicIcon name="checkout-info" className="h-6 w-6 flex-shrink-0" fallback={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
                                <div>
                                    <strong>Информационная опция:</strong> Оплата на карту производится по договоренности с продавцом. Свяжитесь с ним в чате для уточнения деталей. Эта опция не предполагает автоматическую оплату через платформу.
                                </div>
                            </div>
                        )}
                        <div className="flex gap-4 mt-6">
                            <button onClick={() => setStep('shipping')} className="w-full bg-brand-border hover:bg-brand-border/80 text-white font-bold py-3 rounded-lg">Назад</button>
                            <button onClick={() => setStep('summary')} className="w-full bg-brand-primary hover:bg-brand-primary-hover text-white font-bold py-3 rounded-lg">Далее</button>
                        </div>
                    </div>
                );
            case 'summary':
                return (
                     <div>
                        <h2 className="text-2xl font-bold mb-4">3. Подтверждение заказа</h2>
                        <div className="bg-brand-background p-4 rounded-lg space-y-4">
                            <div>
                                <h3 className="font-semibold text-white">Адрес доставки:</h3>
                                <p className="text-brand-text-secondary">{shippingAddress.recipientName}, {shippingAddress.phoneNumber}</p>
                                <p className="text-brand-text-secondary">{shippingAddress.city}, {shippingAddress.postOffice} ({shippingMethod === 'NOVA_POSHTA' ? 'Нова Пошта' : 'Укрпошта'})</p>
                            </div>
                             <div>
                                <h3 className="font-semibold text-white">Способ оплаты:</h3>
                                <p className="text-brand-text-secondary">
                                  {paymentMethod === 'ESCROW' && 'Безопасная сделка (Эскроу)'}
                                  {paymentMethod === 'DIRECT_TON' && 'Напрямую на TON кошелек'}
                                  {paymentMethod === 'INFO_CARD' && 'На карту продавца (вручную)'}
                                </p>
                                 {requestAuthentication && (
                                    <p className="text-sm text-brand-secondary font-semibold mt-1">✅ Включая проверку подлинности экспертом</p>
                                )}
                            </div>
                        </div>
                        {error && <p className="text-red-500 text-sm mt-4 text-center">{error}</p>}
                        <div className="flex gap-4 mt-6">
                            <button onClick={() => setStep('payment')} className="w-full bg-brand-border hover:bg-brand-border/80 text-white font-bold py-3 rounded-lg">Назад</button>
                            <button onClick={handleConfirmOrder} disabled={isProcessing || paymentMethod === 'INFO_CARD'} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg flex justify-center items-center disabled:bg-gray-500 disabled:cursor-not-allowed">
                                {isProcessing ? <Spinner size="sm" /> : 'Перейти к оплате'}
                            </button>
                        </div>
                    </div>
                );
        }
    };

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                <div className="md:col-span-2 bg-brand-surface p-6 rounded-lg">
                    {renderStep()}
                </div>
                <div className="md:col-span-1">
                     <div className="bg-brand-surface p-6 rounded-lg sticky top-24">
                         <h3 className="text-xl font-bold mb-4">Ваш заказ</h3>
                         <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2">
                             {Object.entries(groupedBySeller).map(([sellerId, { seller, items, subtotal }]) => {
                                 const promo = appliedPromos[sellerId];
                                 let discountAmount = 0;
                                 if (promo) {
                                     if (promo.type === 'PERCENTAGE') {
                                         discountAmount = subtotal * (promo.value / 100);
                                     } else { // FIXED_AMOUNT
                                         discountAmount = promo.value;
                                     }
                                 }
                                 const finalSubtotal = subtotal - discountAmount;
                                 const shippingCost = shippingCosts[sellerId] || 0;

                                 return (
                                    <div key={sellerId} className="border-t border-brand-border pt-4">
                                         <h4 className="font-semibold text-brand-text-primary mb-2">Продавец: <Link to={`/profile/${seller.id}`} className="text-brand-secondary hover:underline">{seller.name}</Link></h4>
                                         {items.map(item => (
                                              <div key={item.product.id + (item.variant?.id || '')} className="flex gap-3 text-sm mb-2">
                                                <img src={item.variant?.imageUrl || item.product.imageUrls[0]} alt={item.product.title} className="w-12 h-12 rounded-md object-cover"/>
                                                <div className="flex-grow">
                                                    <p className="text-white font-semibold truncate">{item.product.title}</p>
                                                    <p className="text-brand-text-secondary">{item.quantity} x {getFormattedPrice(item.priceAtTimeOfAddition)}</p>
                                                </div>
                                             </div>
                                         ))}
                                         <div className="text-sm">
                                             <div className="flex gap-2">
                                                 <input
                                                    type="text"
                                                    placeholder="Промокод"
                                                    value={promoCodeInputs[sellerId] || ''}
                                                    onChange={(e) => setPromoCodeInputs(prev => ({ ...prev, [sellerId]: e.target.value.toUpperCase() }))}
                                                    className="flex-grow bg-brand-background border border-brand-border rounded-md p-1.5"
                                                    disabled={!!promo}
                                                />
                                                <button onClick={() => handleApplyPromo(sellerId)} disabled={!promoCodeInputs[sellerId] || promoLoading[sellerId] || !!promo} className="px-3 bg-brand-secondary hover:bg-brand-primary-hover text-white font-bold rounded-lg transition-colors flex items-center justify-center disabled:bg-gray-500 disabled:cursor-not-allowed">
                                                    {promoLoading[sellerId] ? <Spinner size="sm"/> : 'OK'}
                                                </button>
                                             </div>
                                              {promoErrors[sellerId] && <p className="text-red-500 text-xs mt-1">{promoErrors[sellerId]}</p>}
                                              {promo && <p className="text-green-400 text-xs mt-1">Код "{promo.code}" ({promo.type === 'PERCENTAGE' ? `-${promo.value}%` : `-${promo.value} USDT`}) применен!</p>}
                                         </div>
                                         <div className="flex justify-between items-baseline mt-2 text-sm">
                                            <span className="text-brand-text-secondary">Подытог:</span>
                                            {promo ? (
                                                <div className="text-right">
                                                    <span className="line-through text-brand-text-secondary">{getFormattedPrice(subtotal)}</span>
                                                    <span className="font-bold text-white ml-2">{getFormattedPrice(finalSubtotal)}</span>
                                                </div>
                                            ) : (
                                                <span className="font-bold text-white">{getFormattedPrice(subtotal)}</span>
                                            )}
                                         </div>
                                          <div className="flex justify-between items-baseline text-sm">
                                             <span className="text-brand-text-secondary">Доставка:</span>
                                             <span className="font-bold text-white">{shippingCost > 0 ? getFormattedPrice(shippingCost) : '...'}</span>
                                          </div>
                                    </div>
                                 )
                             })}
                         </div>
                         <div className="border-t border-brand-border pt-4 mt-4 space-y-2">
                              {requestAuthentication && (
                                <div className="flex justify-between text-brand-text-primary"><span>Проверка подлинности</span><span>{getFormattedPrice(AUTHENTICATION_FEE)}</span></div>
                              )}
                              <div className="flex justify-between text-brand-text-primary"><span>Доставка (общая)</span><span>{getFormattedPrice(totalShippingCost)}</span></div>
                              <div className="flex justify-between text-white font-bold text-lg mt-2"><span>Итого к оплате</span><span>{getFormattedPrice(grandTotal)}</span></div>
                         </div>
                    </div>
                </div>
            </div>
            <PaymentModal
                isOpen={paymentModalState.isOpen}
                onClose={() => setPaymentModalState(prev => ({...prev, isOpen: false}))}
                amount={paymentModalState.amount}
                recipientAddress={paymentModalState.recipientAddress}
                onSuccess={paymentModalState.onSuccess}
            />
        </>
    );
};

export default CheckoutPage;