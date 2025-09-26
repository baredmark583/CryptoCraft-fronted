import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { apiService } from '../services/apiService';
import { cloudinaryService } from '../services/cloudinaryService';
import type { WorkshopPost } from '../types';
import Spinner from './Spinner';
import DynamicIcon from './DynamicIcon';

interface CreateWorkshopPostProps {
  onPostCreated: (newPost: WorkshopPost) => void;
}

const CreateWorkshopPost: React.FC<CreateWorkshopPostProps> = ({ onPostCreated }) => {
  const { user } = useAuth();
  const [text, setText] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) {
      setError('Текст поста не может быть пустым.');
      return;
    }
    setIsSubmitting(true);
    setError('');
    
    try {
      let imageUrl: string | undefined = undefined;
      if (imageFile) {
        imageUrl = await cloudinaryService.uploadImage(imageFile);
      }
      
      const newPostData = {
        sellerId: user.id,
        text,
        imageUrl,
      };
      
      const createdPost = await apiService.createWorkshopPost(newPostData);
      onPostCreated(createdPost);

      // Reset form
      setText('');
      setImageFile(null);
      setPreview(null);
    } catch (err: any) {
      setError(err.message || 'Не удалось создать пост.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-base-100 p-4 rounded-lg mb-8">
      <form onSubmit={handleSubmit} className="space-y-4">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full bg-base-200 border border-base-300 rounded-md shadow-sm p-3 focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="Что нового в вашей мастерской?"
          rows={3}
        />
        {preview && (
          <div className="relative">
            <img src={preview} alt="Preview" className="max-h-48 rounded-lg mx-auto" />
            <button
              type="button"
              onClick={() => { setImageFile(null); setPreview(null); }}
              className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1"
            >
              &times;
            </button>
          </div>
        )}
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <div className="flex justify-between items-center">
          <label htmlFor="post-image-upload" className="cursor-pointer text-base-content/70 hover:text-primary">
            <DynamicIcon name="upload-image" className="w-6 h-6 inline-block" fallback={
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                </svg>
            }/>
             <input id="post-image-upload" type="file" className="sr-only" accept="image/*" onChange={handleImageChange} />
          </label>
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-primary hover:bg-primary-focus text-primary-content font-bold py-2 px-6 rounded-lg transition-colors flex items-center disabled:bg-gray-500"
          >
            {isSubmitting ? <Spinner size="sm" /> : 'Опубликовать'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateWorkshopPost;
