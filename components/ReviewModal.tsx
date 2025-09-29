import React, { useState } from 'react';
import type { Order } from '../types';
import StarRating from './StarRating';
import Spinner from './Spinner';
import { cloudinaryService } from '../services/cloudinaryService';
import DynamicIcon from './DynamicIcon';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (rating: number, text: string, imageUrl?: string) => Promise<void>;
  order: Order;
}

const ReviewModal: React.FC<ReviewModalProps> = ({ isOpen, onClose, onSubmit, order }) => {
  const [rating, setRating] = useState(0);
  const [text, setText] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        setImageFile(file);
        setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      setError('Пожалуйста, поставьте оценку.');
      return;
    }
    setError('');
    setIsSubmitting(true);
    try {
      let imageUrl: string | undefined;
      if (imageFile) {
        imageUrl = await cloudinaryService.uploadImage(imageFile);
      }
      await onSubmit(rating, text, imageUrl);
      onClose(); // Close on success
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
      <div className="bg-base-100 rounded-2xl shadow-2xl w-full max-w-lg border border-base-300">
        <form onSubmit={handleSubmit} className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-white">Оставить отзыв</h2>
            <button type="button" onClick={onClose} className="text-base-content/70 hover:text-white text-3xl leading-none">&times;</button>
          </div>
          
          <div className="flex items-center bg-base-200 p-3 rounded-lg mb-6">
            <img src={firstItem.product.imageUrls[0]} alt={firstItem.product.title} className="w-16 h-16 object-cover rounded-md mr-4"/>
            <div>
              <p className="text-base-content/70 text-sm">Ваш отзыв о заказе у продавца:</p>
              <p className="font-semibold text-white">{sellerName}</p>
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-base-content/70 mb-2">Ваша общая оценка</label>
            <StarRating rating={rating} onRatingChange={setRating} interactive />
          </div>

          <div className="mb-4">
            <label htmlFor="review-text" className="block text-sm font-medium text-base-content/70 mb-2">Ваш комментарий (необязательно)</label>
            <textarea
              id="review-text"
              rows={4}
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full bg-base-200 border border-base-300 rounded-md shadow-sm p-3 focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder={`Поделитесь впечатлениями о товарах и продавце ${sellerName}...`}
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-base-content/70 mb-2">Добавить фото (необязательно)</label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-base-300 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                    {preview ? (
                        <div className="relative">
                            <img src={preview} alt="Предпросмотр" className="mx-auto h-32 w-auto rounded-md"/>
                            <button type="button" onClick={() => {setImageFile(null); setPreview(null);}} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full h-6 w-6 flex items-center justify-center font-bold">&times;</button>
                        </div>
                    ) : (
                        <>
                            <DynamicIcon name="upload-image" className="mx-auto h-12 w-12 text-base-content/70" fallback={
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                                </svg>
                            }/>
                            <div className="flex text-sm text-base-content/70">
                                <label htmlFor="review-file-upload" className="relative cursor-pointer bg-base-100 rounded-md font-medium text-primary hover:text-primary-focus focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary focus-within:ring-offset-base-200 px-1">
                                    <span>Выберите файл</span>
                                    <input id="review-file-upload" name="review-file-upload" type="file" className="sr-only" accept="image/*" onChange={handleFileChange} />
                                </label>
                            </div>
                        </>
                    )}
                </div>
            </div>
          </div>

          {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}
          
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-primary hover:bg-primary-focus text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center disabled:bg-gray-500 disabled:cursor-not-allowed"
          >
            {isSubmitting ? <Spinner size="sm" /> : 'Отправить отзыв'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ReviewModal;