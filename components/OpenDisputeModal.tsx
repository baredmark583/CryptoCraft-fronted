import React, { useState } from 'react';
import type { Order } from '../types';
import Spinner from './Spinner';

interface OpenDisputeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => Promise<void>;
  order: Order;
}

const OpenDisputeModal: React.FC<OpenDisputeModalProps> = ({ isOpen, onClose, onSubmit, order }) => {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('Пожалуйста, опишите причину спора.');
      return;
    }
    setError('');
    setIsSubmitting(true);
    try {
      await onSubmit(reason);
    } catch (err) {
      setError('Не удалось открыть спор. Попробуйте позже.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const firstProduct = order.items[0].product;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-base-100 rounded-2xl shadow-2xl w-full max-w-lg border border-base-300">
        <form onSubmit={handleSubmit} className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-white">Открыть спор</h2>
            <button type="button" onClick={onClose} className="text-base-content/70 hover:text-white text-3xl leading-none">&times;</button>
          </div>
          
          <div className="flex items-center bg-base-200 p-3 rounded-lg mb-6">
            <img src={firstProduct.imageUrls[0]} alt={firstProduct.title} className="w-16 h-16 object-cover rounded-md mr-4"/>
            <div>
              <p className="text-base-content/70 text-sm">Спор по заказу:</p>
              <p className="font-semibold text-white">{firstProduct.title} {order.items.length > 1 ? `и еще ${order.items.length - 1}` : ''}</p>
            </div>
          </div>
          
          <div className="mb-6">
            <label htmlFor="dispute-reason" className="block text-sm font-medium text-base-content/70 mb-2">Опишите проблему</label>
            <textarea
              id="dispute-reason"
              rows={5}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-base-200 border border-base-300 rounded-md shadow-sm p-3 focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Например: товар не пришел, товар поврежден, не соответствует описанию..."
            />
          </div>

          {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}
          
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center disabled:bg-gray-500 disabled:cursor-not-allowed"
          >
            {isSubmitting ? <Spinner size="sm" /> : 'Подтвердить и открыть спор'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default OpenDisputeModal;