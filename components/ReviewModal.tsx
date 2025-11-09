import React, { useEffect, useMemo, useState } from 'react';
import type { Order, ReviewMediaAttachment } from '../types';
import StarRating from './StarRating';
import Spinner from './Spinner';
import DynamicIcon from './DynamicIcon';
import { apiService } from '../services/apiService';

const MAX_ATTACHMENTS = 3;

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: { rating: number; text: string; attachments: ReviewMediaAttachment[] }) => Promise<void>;
  order: Order;
}

type PendingAttachment = {
  id: string;
  file: File;
  preview: string;
  type: 'image' | 'video';
};

const ReviewModal: React.FC<ReviewModalProps> = ({ isOpen, onClose, onSubmit, order }) => {
  const [rating, setRating] = useState(0);
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState<PendingAttachment[]>([]);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    return () => {
      attachments.forEach((att) => URL.revokeObjectURL(att.preview));
    };
  }, [attachments]);

  useEffect(() => {
    if (!isOpen) {
      setRating(0);
      setText('');
      setAttachments([]);
      setError('');
      setIsSubmitting(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const selectedFiles = Array.from(e.target.files);
    const slotsLeft = MAX_ATTACHMENTS - attachments.length;
    if (slotsLeft <= 0) return;

    const nextAttachments = selectedFiles.slice(0, slotsLeft).map((file) => {
      const type = file.type.startsWith('video/') ? 'video' : 'image';
      return {
        id: `${file.name}-${file.size}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        file,
        preview: URL.createObjectURL(file),
        type,
      };
    });
    setAttachments((prev) => [...prev, ...nextAttachments]);
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => {
      const target = prev.find((att) => att.id === id);
      if (target) {
        URL.revokeObjectURL(target.preview);
      }
      return prev.filter((att) => att.id !== id);
    });
  };

  const uploadAttachments = async (): Promise<ReviewMediaAttachment[]> => {
    const uploaded: ReviewMediaAttachment[] = [];
    for (const attachment of attachments) {
      const { url } = await apiService.uploadFile(attachment.file);
      uploaded.push({
        type: attachment.type,
        url,
        name: attachment.file.name,
        mimeType: attachment.file.type,
        size: attachment.file.size,
      });
    }
    return uploaded;
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
      const uploadedAttachments = await uploadAttachments();
      await onSubmit({
        rating,
        text,
        attachments: uploadedAttachments,
      });
      onClose();
    } catch (err) {
      console.error(err);
      setError('Не удалось отправить отзыв. Попробуйте позже.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const firstItem = order.items[0];
  const sellerName = order.seller?.name ?? firstItem.product.seller.name;
  const attachmentSlotsLeft = MAX_ATTACHMENTS - attachments.length;

  const attachmentHint = useMemo(() => {
    if (attachmentSlotsLeft === 0) return 'Максимум 3 файла';
    if (attachmentSlotsLeft === 1) return 'Можно добавить ещё 1 файл';
    return `Можно добавить ещё ${attachmentSlotsLeft} файла`;
  }, [attachmentSlotsLeft]);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-base-100 rounded-2xl shadow-2xl w-full max-w-lg border border-base-300">
        <form onSubmit={handleSubmit} className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-white">Оставить отзыв</h2>
            <button type="button" onClick={onClose} className="text-base-content/70 hover:text-white text-3xl leading-none">
              &times;
            </button>
          </div>

          <div className="flex items-center bg-base-200 p-3 rounded-lg mb-6">
            <img
              src={firstItem.product.imageUrls[0]}
              alt={firstItem.product.title}
              className="w-16 h-16 object-cover rounded-md mr-4"
            />
            <div>
              <p className="text-base-content/70 text-sm">Ваш отзыв о покупке у продавца:</p>
              <p className="font-semibold text-white">{sellerName}</p>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-base-content/70 mb-2">Ваша общая оценка</label>
            <StarRating rating={rating} onRatingChange={setRating} interactive />
          </div>

          <div className="mb-4">
            <label htmlFor="review-text" className="block text-sm font-medium text-base-content/70 mb-2">
              Комментарий (необязательно)
            </label>
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
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-base-content/70">Добавить медиа (до 3 файлов)</label>
              <span className="text-xs text-base-content/60">{attachmentHint}</span>
            </div>
            <div className="mt-1 flex flex-col gap-3">
              <div className="flex flex-wrap gap-3">
                {attachments.map((att) => (
                  <div key={att.id} className="relative w-24 h-24 rounded-md overflow-hidden border border-base-300 flex items-center justify-center bg-base-200">
                    {att.type === 'image' ? (
                      <img src={att.preview} alt="Предпросмотр" className="w-full h-full object-cover" />
                    ) : (
                      <video src={att.preview} className="w-full h-full object-cover" muted loop />
                    )}
                    <button
                      type="button"
                      onClick={() => removeAttachment(att.id)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full h-6 w-6 flex items-center justify-center font-bold"
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
              {attachmentSlotsLeft > 0 && (
                <div className="flex justify-center px-6 pt-5 pb-6 border-2 border-base-300 border-dashed rounded-md">
                  <div className="space-y-1 text-center">
                    <DynamicIcon name="upload-image" className="mx-auto h-12 w-12 text-base-content/70" />
                    <div className="flex text-sm text-base-content/70 justify-center">
                      <label
                        htmlFor="review-file-upload"
                        className="relative cursor-pointer bg-base-100 rounded-md font-medium text-primary hover:text-primary-focus focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary focus-within:ring-offset-base-200 px-1"
                      >
                        <span>Выберите файлы</span>
                        <input
                          id="review-file-upload"
                          name="review-file-upload"
                          type="file"
                          className="sr-only"
                          accept="image/*,video/*"
                          multiple
                          onChange={handleFileChange}
                        />
                      </label>
                    </div>
                    <p className="text-xs text-base-content/60">Поддерживаются фото и короткие видео до 25 МБ</p>
                  </div>
                </div>
              )}
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
