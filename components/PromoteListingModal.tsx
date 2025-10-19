import React, { useState } from 'react';
import type { Product } from '../types';
import Spinner from './Spinner';
import { useCurrency } from '../hooks/useCurrency';

interface PromoteListingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => Promise<void>;
  product: Product;
}

const PromoteListingModal: React.FC<PromoteListingModalProps> = ({ isOpen, onClose, onSubmit, product }) => {
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { getFormattedPrice } = useCurrency();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    try {
      // Here you would integrate a payment flow for the promotion fee
      console.log("Simulating payment for promotion...");
      await new Promise(res => setTimeout(res, 1500));
      await onSubmit();
    } catch (err) {
      setError('Не удалось оплатить продвижение. Попробуйте позже.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-base-100 rounded-2xl shadow-2xl w-full max-w-md border border-base-300">
        <form onSubmit={handleSubmit} className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-white">Продвигать товар</h2>
            <button type="button" onClick={onClose} className="text-base-content/70 hover:text-white text-3xl leading-none">&times;</button>
          </div>
          
          <div className="flex items-center bg-base-200 p-3 rounded-lg mb-6">
            <img src={product.imageUrls[0]} alt={product.title} className="w-16 h-16 object-cover rounded-md mr-4"/>
            <div>
              <p className="text-base-content/70 text-sm">Выбранный товар:</p>
              <p className="font-semibold text-white">{product.title}</p>
            </div>
          </div>
          
          <div className="text-center mb-6">
              <p className="text-base-content">Разместите ваш товар на главной странице и в топе категории на 7 дней.</p>
              <div className="text-4xl font-bold text-primary mt-2">{getFormattedPrice(5)}</div>
          </div>

          {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}
          
          <button
            type="submit"
            disabled={isSubmitting || product.isPromoted}
            className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center disabled:bg-gray-500 disabled:cursor-not-allowed"
          >
            {isSubmitting ? <Spinner size="sm" /> : (product.isPromoted ? 'Уже продвигается' : 'Оплатить и продвигать')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PromoteListingModal;
