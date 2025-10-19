import React, { useState, useMemo } from 'react';
import type { Product } from '../types';
import { apiService } from '../services/apiService';
import Spinner from './Spinner';
import { useCurrency } from '../hooks/useCurrency';

interface ProductAnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  onUpdate: (updatedProduct: Product) => void;
}

const ProductAnalyticsModal: React.FC<ProductAnalyticsModalProps> = ({ isOpen, onClose, product, onUpdate }) => {
  const [changeType, setChangeType] = useState<'percent' | 'fixed'>('percent');
  const [changeValue, setChangeValue] = useState('');
  const [newPrice, setNewPrice] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [simulatedDiscount, setSimulatedDiscount] = useState('');
  const { getFormattedPrice } = useCurrency();

  const {
      currentPrice,
      purchaseCost,
      commission,
      profit,
      discountedPrice,
      isDiscountApplied
  } = useMemo(() => {
    const commissionRate = 0.02; // 2%
    const currentPrice = product.price || 0;
    const purchaseCost = Number(product.purchaseCost) || 0;
    const discountPercent = parseFloat(simulatedDiscount);
    const isDiscountApplied = !isNaN(discountPercent) && discountPercent > 0 && discountPercent <= 100;

    const finalPrice = isDiscountApplied ? currentPrice * (1 - discountPercent / 100) : currentPrice;
    
    const commission = finalPrice * commissionRate;
    const profit = finalPrice - purchaseCost - commission;
    
    return {
        currentPrice,
        purchaseCost,
        commission,
        profit,
        discountedPrice: finalPrice,
        isDiscountApplied
    };
  }, [product, simulatedDiscount]);

  if (!isOpen) return null;

  const handleCalculatePrice = (operation: 'increase' | 'decrease') => {
    const value = parseFloat(changeValue);
    if (isNaN(value) || value <= 0) {
      setError('Введите положительное значение.');
      return;
    }
    setError('');
    let calculatedPrice: number;

    if (changeType === 'percent') {
      const multiplier = operation === 'increase' ? 1 + value / 100 : 1 - value / 100;
      calculatedPrice = currentPrice * multiplier;
    } else { // fixed
      calculatedPrice = operation === 'increase' ? currentPrice + value : currentPrice - value;
    }

    if (calculatedPrice < 0) {
      setError('Цена не может быть отрицательной.');
      setNewPrice(null);
      return;
    }
    setNewPrice(parseFloat(calculatedPrice.toFixed(2)));
  };

  const handleApplyPriceChange = async () => {
    if (newPrice === null) return;
    setIsSaving(true);
    setError('');
    try {
      const updatedProduct = await apiService.updateListing(product.id, { price: newPrice });
      onUpdate(updatedProduct);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Не удалось обновить цену.');
    } finally {
      setIsSaving(false);
    }
  };

  const resetAndClose = () => {
    setChangeValue('');
    setNewPrice(null);
    setError('');
    setSimulatedDiscount('');
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={resetAndClose}>
      <div className="bg-base-100 rounded-2xl shadow-2xl w-full max-w-lg border border-base-300" onClick={e => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
                <h2 className="text-2xl font-bold text-white">Аналитика и цена</h2>
                <p className="text-base-content/70 text-sm">{product.title}</p>
            </div>
            <button onClick={resetAndClose} className="text-base-content/70 hover:text-white text-3xl leading-none">&times;</button>
          </div>
          
          {/* Financial Breakdown */}
          <div className="bg-base-200 p-4 rounded-lg mb-6">
            <h3 className="font-semibold text-white mb-3">Финансовая сводка</h3>
             <div className="mb-4">
                <label className="block text-sm font-medium text-base-content/70 mb-1">Симулятор скидки (%)</label>
                <input
                    type="number"
                    value={simulatedDiscount}
                    onChange={(e) => setSimulatedDiscount(e.target.value)}
                    placeholder="Введите % скидки для расчета"
                    className="w-full bg-base-100 border border-base-300 rounded-md p-2"
                    min="0"
                    max="100"
                />
            </div>
            <ul className="space-y-2 text-sm">
                <li className="flex justify-between items-center">
                    <span className="text-base-content/70">Цена для покупателя</span>
                     <div className="text-right">
                        {isDiscountApplied && (
                            <span className="font-mono text-base-content/70 line-through mr-2">{getFormattedPrice(currentPrice)}</span>
                        )}
                        <span className="font-mono text-white font-semibold">{getFormattedPrice(discountedPrice)}</span>
                    </div>
                </li>
                 <li className="flex justify-between items-center">
                    <span className="text-base-content/70">Затраты на товар</span>
                    <span className="font-mono text-red-400">- {getFormattedPrice(purchaseCost)}</span>
                </li>
                 <li className="flex justify-between items-center">
                    <span className="text-base-content/70">Комиссия ({isDiscountApplied ? 'с учетом скидки' : '2%'})</span>
                    <span className="font-mono text-red-400">- {getFormattedPrice(commission)}</span>
                </li>
                <li className="flex justify-between items-center border-t border-base-300 pt-2 mt-2">
                    <span className="font-bold text-white">Чистая прибыль</span>
                    <div className={`font-mono font-bold text-lg ${profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>{getFormattedPrice(profit)}</div>
                </li>
            </ul>
          </div>

          {/* Price Change */}
           <div className="bg-base-200 p-4 rounded-lg">
                <h3 className="font-semibold text-white mb-3">Изменить цену</h3>
                <div className="flex gap-2 p-1 bg-base-100 rounded-lg mb-4">
                    <button onClick={() => { setChangeType('percent'); setNewPrice(null); }} className={`flex-1 text-center p-2 rounded-md transition-colors ${changeType === 'percent' ? 'bg-primary text-white' : 'hover:bg-base-300/50'}`}>Процент (%)</button>
                    <button onClick={() => { setChangeType('fixed'); setNewPrice(null); }} className={`flex-1 text-center p-2 rounded-md transition-colors ${changeType === 'fixed' ? 'bg-primary text-white' : 'hover:bg-base-300/50'}`}>Фиксированная сумма</button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                    <button onClick={() => handleCalculatePrice('decrease')} className="col-span-1 bg-red-600/80 hover:bg-red-700 text-white font-bold py-2 rounded-lg">- Уменьшить</button>
                    <input 
                        type="number"
                        value={changeValue}
                        onChange={(e) => {setChangeValue(e.target.value); setNewPrice(null);}}
                        placeholder="0"
                        className="col-span-1 bg-base-100 border border-base-300 rounded-md p-2 text-center text-lg"
                    />
                    <button onClick={() => handleCalculatePrice('increase')} className="col-span-1 bg-green-600/80 hover:bg-green-700 text-white font-bold py-2 rounded-lg">+ Увеличить</button>
                </div>
           </div>

            {error && <p className="text-red-500 text-sm mt-4 text-center">{error}</p>}
           
            {newPrice !== null && (
                 <div className="mt-4 text-center p-4 bg-primary/10 rounded-lg">
                    <p className="text-sm text-base-content/70">Новая цена будет:</p>
                    <div className="text-2xl font-bold text-white">
                        <span className="line-through text-base-content/70/80">{getFormattedPrice(currentPrice)}</span>
                        <span className="mx-2">&rarr;</span>
                        <span className="text-primary">{getFormattedPrice(newPrice)}</span>
                    </div>
                    <button onClick={handleApplyPriceChange} disabled={isSaving} className="mt-4 w-full bg-primary hover:bg-primary-focus text-white font-bold py-2 px-4 rounded-lg flex justify-center items-center disabled:bg-gray-500">
                        {isSaving ? <Spinner size="sm" /> : 'Применить новую цену'}
                    </button>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default ProductAnalyticsModal;