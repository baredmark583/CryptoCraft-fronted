import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { WorkshopPost, User, WorkshopComment } from '../types';
import { useAuth } from '../hooks/useAuth';
import { apiService } from '../services/apiService';
import Spinner from './Spinner';
import DynamicIcon from './DynamicIcon';

interface WorkshopPostCardProps {
  post: WorkshopPost;
  seller: User;
}

const WorkshopPostCard: React.FC<WorkshopPostCardProps> = ({ post, seller }) => {
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(user && post.likedBy.includes(user.id));
  const [likeCount, setLikeCount] = useState(post.likedBy.length);
  const [comments, setComments] = useState<WorkshopComment[]>(post.comments);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (user) {
        setIsLiked(post.likedBy.includes(user.id));
    }
    setLikeCount(post.likedBy.length);
    setComments(post.comments);
  }, [post, user]);

  const handleLikeToggle = async () => {
    if (!user) return;
    setIsLiked(!isLiked);
    setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
    try {
      await apiService.likeWorkshopPost(post.id, user.id);
    } catch (error) {
      console.error("Failed to update like status", error);
      setIsLiked(isLiked);
      setLikeCount(likeCount);
    }
  };

  const handleShare = () => {
      const shareUrl = `${window.location.origin}/#/profile/${seller.id}`;
      navigator.clipboard.writeText(shareUrl).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
      });
  };

  return (
    <article className="rounded-2xl border border-amber-200/80 bg-white p-4 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to={`/profile/${seller.id}`}>
            <img loading="lazy" decoding="async" alt={seller.name} src={seller.avatarUrl} className="w-10 h-10 rounded-full object-cover" />
          </Link>
          <div>
            <Link to={`/profile/${seller.id}`} className="text-sm font-semibold text-amber-900">{seller.name}</Link>
            <small className="block text-xs text-amber-900/70">{new Date(post.timestamp).toLocaleString()}</small>
          </div>
        </div>
        <span className="px-2 py-1 text-xs rounded-full bg-amber-50 text-amber-900/80 border border-amber-200">
            Готовлю к продаже
        </span>
      </div>
      <p className="text-base-content/90 text-sm">{post.text}</p>
      {post.imageUrl && <img loading="lazy" decoding="async" alt="Предмет поста" src={post.imageUrl} className="w-full h-56 object-cover rounded-xl" />}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button type="button" onClick={handleLikeToggle} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-300 bg-amber-100/70 transition-colors hover:bg-amber-200/70">
            <img loading="lazy" decoding="async" alt="Лайк" src="https://api.iconify.design/lucide-heart.svg" className={`w-4 h-4 transition-colors ${isLiked ? 'text-red-500 fill-current' : 'text-inherit'}`} />
            <span className="text-sm">{likeCount}</span>
          </button>
          <a href="#comments" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-200/80 bg-white transition-colors hover:bg-amber-100/70">
            <img loading="lazy" decoding="async" alt="Комментарий" src="https://api.iconify.design/lucide-message-circle.svg" className="w-4 h-4" />
            <span className="text-sm text-amber-900/90">Комментарий</span>
          </a>
          <button type="button" onClick={handleShare} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-200/80 bg-white transition-colors hover:bg-amber-100/70">
            <img loading="lazy" decoding="async" alt="Поделиться" src="https://api.iconify.design/lucide-share-2.svg" className="w-4 h-4" />
            <span className="text-sm text-amber-900/90">{copied ? 'Скопировано' : 'Поделиться'}</span>
          </button>
        </div>
      </div>
    </article>
  );
};

export default WorkshopPostCard;
