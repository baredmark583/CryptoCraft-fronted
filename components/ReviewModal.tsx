import React, { useState } from 'react';
import type { Order } from '../types';
import StarRating from './StarRating';
import Spinner from './Spinner';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (rating: number, text: string) => Promise<void>;
  order: Order;
}

const ReviewModal: React.FC<ReviewModalProps> = ({ isOpen, onClose, onSubmit, order }) => {
  const [rating, setRating] = useState(0);
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      setError('Пожалуйста, поставьте оценку.');
      return;
    }
    setError('');
    setIsSubmitting(true);
    try {
      await onSubmit(rating, text);
    } catch (err) {
      setError('Не удалось отправить отзыв. Попробуйте позже.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const firstItem = order.items[0];
  const sellerName = firstItem.product.seller.name;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-brand-surface rounded-2xl shadow-2xl w-full max-w-lg border border-brand-border">
        <form onSubmit={handleSubmit} className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-white">Оставить отзыв</h2>
            <button type="button" onClick={onClose} className="text-brand-text-secondary hover:text-white text-3xl leading-none">&times;</button>
          </div>
          
          <div className="flex items-center bg-brand-background p-3 rounded-lg mb-6">
            <img src={firstItem.product.imageUrls[0]} alt={firstItem.product.title} className="w-16 h-16 object-cover rounded-md mr-4"/>
            <div>
              <p className="text-brand-text-secondary text-sm">Ваш отзыв о заказе у продавца:</p>
              <p className="font-semibold text-white">{sellerName}</p>
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-brand-text-secondary mb-2">Ваша общая оценка</label>
            <StarRating rating={rating} onRatingChange={setRating} interactive />
          </div>

          <div className="mb-6">
            <label htmlFor="review-text" className="block text-sm font-medium text-brand-text-secondary mb-2">Ваш комментарий (необязательно)</label>
            <textarea
              id="review-text"
              rows={4}
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full bg-brand-background border border-brand-border rounded-md shadow-sm p-3 focus:outline-none focus:ring-2 focus:ring-brand-primary"
              placeholder={`Поделитесь впечатлениями о товарах и продавце ${sellerName}...`}
            />
          </div>

          {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}
          
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-brand-primary hover:bg-brand-primary-hover text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center disabled:bg-gray-500 disabled:cursor-not-allowed"
          >
            {isSubmitting ? <Spinner size="sm" /> : 'Отправить отзыв'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ReviewModal;