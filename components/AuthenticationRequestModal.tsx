import React, { useState } from 'react';
import type { Product } from '../types';
import Spinner from './Spinner';
import { apiService } from '../services/apiService';
import { useCurrency } from '../hooks/useCurrency';
import { AUTHENTICATION_FEE } from '../constants';

interface AuthenticationRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  onUpdate: (updatedProduct: Product) => void;
}

const AuthenticationRequestModal: React.FC<AuthenticationRequestModalProps> = ({ isOpen, onClose, product, onUpdate }) => {
  const { getFormattedPrice } = useCurrency();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError('');
    try {
      const updatedProduct = await apiService.requestProductAuthentication(product.id);
      onUpdate(updatedProduct);
      setIsSuccess(true);
      // Don't close immediately, show a message
      setTimeout(onClose, 3000); // Close after 3s to let seller read the success message
    } catch (err: any) {
      setError(err.message || 'Не удалось отправить запрос.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-brand-surface rounded-2xl shadow-2xl w-full max-w-lg border border-brand-border">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-white">Запрос на аутентификацию</h2>
            <button type="button" onClick={onClose} className="text-brand-text-secondary hover:text-white text-3xl leading-none">&times;</button>
          </div>

          {isSubmitting && !isSuccess ? (
             <div className="text-center p-8">
                <Spinner />
                <p className="mt-4 text-white">Отправляем ваш запрос...</p>
             </div>
          ) : isSuccess ? (
              <div className="text-center p-8 animate-fade-in-down">
                  <div className="text-5xl mb-4">✅</div>
                  <h3 className="text-xl font-bold text-green-400">Запрос успешно отправлен!</h3>
                  <p className="text-brand-text-secondary mt-2">Статус товара обновлен на "На проверке у эксперта". Мы свяжемся с вами для уточнения деталей по отправке товара в наш центр.</p>
              </div>
          ) : (
             <>
                <p className="text-brand-text-secondary mb-4">Вы собираетесь запросить проверку подлинности для товара <span className="font-semibold text-white">"{product.title}"</span>.</p>
                <div className="bg-brand-background p-4 rounded-lg space-y-3 text-sm">
                    <p>Процесс проверки:</p>
                    <ol className="list-decimal list-inside text-brand-text-secondary space-y-1">
                        <li>Вы отправляете товар в наш экспертный центр.</li>
                        <li>Наши специалисты проверяют подлинность и состояние товара.</li>
                        <li>Мы создаем детальный отчет и присваиваем товару значок "Подлинность подтверждена".</li>
                    </ol>
                    <p className="font-semibold text-white">Стоимость услуги: <span className="text-brand-primary">{getFormattedPrice(AUTHENTICATION_FEE)}</span> (будет списана с вашего баланса).</p>
                </div>
                {error && <p className="text-red-500 text-sm mt-4 text-center">{error}</p>}
                <button
                    onClick={handleSubmit}
                    className="w-full mt-6 bg-brand-primary hover:bg-brand-primary-hover text-white font-bold py-3 rounded-lg"
                >
                    Подтвердить и отправить запрос
                </button>
             </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthenticationRequestModal;