import React, { useState, useMemo } from 'react';
import type { Product } from '../types';
import Spinner from './Spinner';
import { useCurrency } from '../hooks/useCurrency';

interface BidModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (bidAmount: number) => Promise<void>;
  product: Product;
}

const BidModal: React.FC<BidModalProps> = ({ isOpen, onClose, onSubmit, product }) => {
  const [bidAmount, setBidAmount] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { getFormattedPrice } = useCurrency();

  const minNextBid = useMemo(() => {
    const current = product.currentBid || product.startingBid || 0;
    // Minimum 5% increase, rounded to 2 decimal places
    return Math.round((current * 1.05) * 100) / 100;
  }, [product.currentBid, product.startingBid]);
  
  const suggestedBids = useMemo(() => {
      const bids = [minNextBid];
      bids.push(Math.round(minNextBid * 1.1)); // +10%
      bids.push(Math.round(minNextBid * 1.2)); // +20%
      return [...new Set(bids)]; // Ensure unique values
  }, [minNextBid]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(bidAmount);
    if (isNaN(amount) || amount < minNextBid) {
      setError(`Минимальная ставка: ${minNextBid.toFixed(2)} USDT`);
      return;
    }
    setError('');
    setIsSubmitting(true);
    try {
      await onSubmit(amount);
    } catch (err: any) {
      setError(err.message || 'Не удалось сделать ставку.');
      setIsSubmitting(false);
    } 
  };
  
  const handleBidSelect = (amount: number) => {
      setBidAmount(amount.toString());
  }

  const resetAndClose = () => {
    setBidAmount('');
    setError('');
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-base-100 rounded-2xl shadow-2xl w-full max-w-md border border-base-300">
        <form onSubmit={handleSubmit} className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-white">Сделать ставку</h2>
            <button type="button" onClick={resetAndClose} className="text-base-content/70 hover:text-white text-3xl leading-none">&times;</button>
          </div>
          
          <div className="text-center bg-base-200 p-4 rounded-lg mb-6">
              <p className="text-sm text-base-content/70">Текущая ставка</p>
              <div className="text-3xl font-bold text-primary">{getFormattedPrice(product.currentBid || product.startingBid || 0)}</div>
          </div>
          
          <div className="mb-4">
            <label htmlFor="bid-amount" className="block text-sm font-medium text-base-content/70 mb-2">Ваша ставка (USDT)</label>
            <input
              id="bid-amount"
              type="number"
              step="0.01"
              value={bidAmount}
              onChange={(e) => setBidAmount(e.target.value)}
              className="w-full bg-base-200 border border-base-300 rounded-md shadow-sm p-3 text-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder={`min. ${minNextBid.toFixed(2)}`}
            />
             <div className="flex gap-2 mt-2">
                {suggestedBids.map(bid => (
                    <button type="button" key={bid} onClick={() => handleBidSelect(bid)} className="flex-1 text-sm bg-base-300/50 hover:bg-base-300 text-white py-1.5 rounded-md transition-colors">
                        {bid.toFixed(2)}
                    </button>
                ))}
            </div>
          </div>

          {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}
          
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-primary hover:bg-primary-focus text-primary-content font-bold py-3 rounded-lg transition-colors flex items-center justify-center disabled:bg-gray-500 disabled:cursor-not-allowed"
          >
            {isSubmitting ? <Spinner size="sm" /> : <>Сделать ставку {bidAmount ? getFormattedPrice(parseFloat(bidAmount)) : ''}</>}
          </button>
           <p className="text-xs text-base-content/70 text-center mt-3">Размещая ставку, вы обязуетесь выкупить товар в случае выигрыша.</p>
        </form>
      </div>
    </div>
  );
};

export default BidModal;
