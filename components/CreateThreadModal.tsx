import React, { useState } from 'react';
import Spinner from './Spinner';

interface CreateThreadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (title: string, content: string) => Promise<any>;
}

const CreateThreadModal: React.FC<CreateThreadModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setError('Пожалуйста, заполните заголовок и текст сообщения.');
      return;
    }
    setError('');
    setIsSubmitting(true);
    try {
      await onSubmit(title, content);
    } catch (err) {
      setError('Не удалось создать тему. Попробуйте позже.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-base-100 rounded-2xl shadow-2xl w-full max-w-2xl border border-base-300" onClick={e => e.stopPropagation()}>
        <form onSubmit={handleSubmit} className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-white">Создать новую тему</h2>
            <button type="button" onClick={onClose} className="text-base-content/70 hover:text-white text-3xl leading-none">&times;</button>
          </div>
          
          <div className="space-y-4">
             <div>
                <label htmlFor="thread-title" className="block text-sm font-medium text-base-content/70 mb-1">Заголовок</label>
                <input
                  id="thread-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-base-200 border border-base-300 rounded-md shadow-sm p-3 focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="О чем вы хотите поговорить?"
                  disabled={isSubmitting}
                />
              </div>
               <div>
                <label htmlFor="thread-content" className="block text-sm font-medium text-base-content/70 mb-1">Ваше сообщение</label>
                <textarea
                  id="thread-content"
                  rows={8}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full bg-base-200 border border-base-300 rounded-md shadow-sm p-3 focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Начните обсуждение..."
                  disabled={isSubmitting}
                />
              </div>
          </div>

          {error && <p className="text-red-500 text-sm mt-4 text-center">{error}</p>}
          
          <div className="mt-6 flex justify-end gap-4">
             <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="bg-base-300 hover:bg-base-300/80 text-white font-bold py-2 px-6 rounded-lg transition-colors"
              >
                Отмена
              </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-primary hover:bg-primary-focus text-primary-content font-bold py-2 px-6 rounded-lg transition-colors flex items-center justify-center min-w-[150px]"
            >
              {isSubmitting ? <Spinner size="sm" /> : 'Опубликовать'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateThreadModal;