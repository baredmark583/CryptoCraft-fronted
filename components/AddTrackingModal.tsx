import React, { useState } from 'react';
import Spinner from './Spinner';

interface AddTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (trackingNumber: string, shippingProvider: string) => Promise<void>;
  orderId: string;
}

const AddTrackingModal: React.FC<AddTrackingModalProps> = ({ isOpen, onClose, onSubmit, orderId }) => {
  const [trackingNumber, setTrackingNumber] = useState('');
  const [shippingProvider, setShippingProvider] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingNumber.trim() || !shippingProvider.trim()) {
      setError('Пожалуйста, заполните все поля.');
      return;
    }
    setError('');
    setIsSubmitting(true);
    try {
      await onSubmit(trackingNumber, shippingProvider);
    } catch (err) {
      setError('Не удалось добавить информацию. Попробуйте позже.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-base-100 rounded-2xl shadow-2xl w-full max-w-md border border-base-300">
        <form onSubmit={handleSubmit} className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-white">Добавить трек-номер</h2>
            <button type="button" onClick={onClose} className="text-base-content/70 hover:text-white text-3xl leading-none">&times;</button>
          </div>
          
          <p className="text-base-content/70 text-sm mb-6">Для заказа <span className="font-mono text-primary">{orderId}</span></p>

          <div className="mb-4">
            <label htmlFor="shipping-provider" className="block text-sm font-medium text-base-content/70 mb-2">Служба доставки</label>
            <input
              id="shipping-provider"
              type="text"
              value={shippingProvider}
              onChange={(e) => setShippingProvider(e.target.value)}
              className="w-full bg-base-200 border border-base-300 rounded-md shadow-sm p-3 focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Например: СДЭК, Почта России"
            />
          </div>

          <div className="mb-6">
            <label htmlFor="tracking-number" className="block text-sm font-medium text-base-content/70 mb-2">Трек-номер</label>
            <input
              id="tracking-number"
              type="text"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              className="w-full bg-base-200 border border-base-300 rounded-md shadow-sm p-3 focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Введите номер для отслеживания"
            />
          </div>
          
          {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}
          
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-primary hover:bg-primary-focus text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center disabled:bg-gray-500 disabled:cursor-not-allowed"
          >
            {isSubmitting ? <Spinner size="sm" /> : 'Сохранить и отправить'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddTrackingModal;