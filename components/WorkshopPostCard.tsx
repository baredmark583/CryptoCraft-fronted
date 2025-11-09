import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { WorkshopPost, User, WorkshopComment } from '../types';
import { useAuth } from '../hooks/useAuth';
import { apiService } from '../services/apiService';
import DynamicIcon from './DynamicIcon';

interface WorkshopPostCardProps {
  post: WorkshopPost;
  seller: User;
}

const WorkshopPostCard: React.FC<WorkshopPostCardProps> = ({ post, seller }) => {
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likedBy.length);
  const [comments, setComments] = useState<WorkshopComment[]>(post.comments);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (user) {
      setIsLiked(post.likedBy.includes(user.id));
    } else {
      setIsLiked(false);
    }
    setLikeCount(post.likedBy.length);
    setComments(post.comments);
  }, [post, user]);

  const handleLikeToggle = async () => {
    if (!user) return;
    const nextLiked = !isLiked;
    setIsLiked(nextLiked);
    setLikeCount((prev) => (nextLiked ? prev + 1 : Math.max(0, prev - 1)));
    try {
      await apiService.likeWorkshopPost(post.id);
    } catch (error) {
      console.error('Failed to update like status', error);
      setIsLiked(!nextLiked);
      setLikeCount((prev) => (nextLiked ? prev - 1 : prev + 1));
    }
  };

  const handleShare = () => {
    const shareUrl = `${window.location.origin}/#/profile/${seller.id}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  const handleAddComment = async () => {
    if (!user || !newComment.trim()) return;
    setIsSubmitting(true);
    try {
      const created = await apiService.addCommentToWorkshopPost(post.id, newComment.trim());
      setComments((prev) => [...prev, created]);
      setNewComment('');
    } catch (error) {
      console.error('Failed to add comment', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReportPost = async () => {
    if (!user) return;
    const reason = prompt('Опишите жалобу на пост:');
    if (!reason?.trim()) return;
    try {
      await apiService.reportWorkshopPost(post.id, reason.trim());
      alert('Жалоба отправлена модераторам.');
    } catch (error) {
      console.error('Failed to report post', error);
      alert('Не удалось отправить жалобу.');
    }
  };

  const handleReportComment = async (commentId: string) => {
    if (!user) return;
    const reason = prompt('Опишите жалобу на комментарий:');
    if (!reason?.trim()) return;
    try {
      await apiService.reportWorkshopComment(commentId, reason.trim());
      alert('Жалоба отправлена.');
    } catch (error) {
      console.error('Failed to report comment', error);
    }
  };

  const visibleComments = comments.filter((comment) => comment.status !== 'HIDDEN');

  const statusBadge =
    post.status && post.status !== 'PUBLISHED'
      ? {
          text: post.status === 'FLAGGED' ? 'На проверке' : 'Скрыт модерацией',
          className: post.status === 'FLAGGED' ? 'bg-amber-500/20 text-amber-800' : 'bg-red-500/20 text-red-500',
        }
      : null;

  return (
    <article className="rounded-2xl border border-amber-200/80 bg-white p-4 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to={`/profile/${seller.id}`}>
            <img alt={seller.name} src={seller.avatarUrl} className="w-10 h-10 rounded-full object-cover" />
          </Link>
          <div>
            <Link to={`/profile/${seller.id}`} className="text-sm font-semibold text-amber-900">
              {seller.name}
            </Link>
            <small className="block text-xs text-amber-900/70">{new Date(post.timestamp).toLocaleString()}</small>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {statusBadge && <span className={`text-xs px-2 py-1 rounded-full border ${statusBadge.className}`}>{statusBadge.text}</span>}
          <button
            type="button"
            onClick={handleReportPost}
            className="text-xs text-amber-700 hover:underline"
          >
            Пожаловаться
          </button>
        </div>
      </div>

      <p className="text-base-content/90 text-sm whitespace-pre-line">{post.text}</p>
      {post.imageUrl && (
        <img alt="workshop" src={post.imageUrl} className="w-full h-56 object-cover rounded-xl border border-amber-100" />
      )}

      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleLikeToggle}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-300 bg-amber-100/70 transition-colors hover:bg-amber-200/70"
          >
            <img
              alt="Лайк"
              src="https://api.iconify.design/lucide-heart.svg"
              className={`w-4 h-4 ${isLiked ? 'text-red-500 fill-current' : 'text-inherit'}`}
            />
            <span className="text-sm">{likeCount}</span>
          </button>
          <button
            type="button"
            onClick={handleShare}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-200/80 bg-white transition-colors hover:bg-amber-100/70"
          >
            <img alt="Поделиться" src="https://api.iconify.design/lucide-share-2.svg" className="w-4 h-4" />
            <span className="text-sm text-amber-900/90">{copied ? 'Скопировано' : 'Поделиться'}</span>
          </button>
        </div>
        {post.commentsLocked && (
          <span className="text-xs text-amber-800/80 flex items-center gap-1">
            <DynamicIcon name="lock" className="w-4 h-4" /> Комментарии отключены
          </span>
        )}
      </div>

      <div className="space-y-3">
        {visibleComments.map((comment) => (
          <div key={comment.id} className="bg-base-100/70 border border-base-200 rounded-lg p-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <img src={comment.author.avatarUrl} alt={comment.author.name} className="w-6 h-6 rounded-full" />
                <span className="text-sm font-semibold text-base-content">{comment.author.name}</span>
              </div>
              <button
                type="button"
                onClick={() => handleReportComment(comment.id)}
                className="text-xs text-base-content/60 hover:text-base-content"
              >
                Жалоба
              </button>
            </div>
            <p className="text-sm text-base-content/80 mt-1 whitespace-pre-line">{comment.text}</p>
            <span className="text-[11px] text-base-content/50">{new Date(comment.timestamp).toLocaleString()}</span>
          </div>
        ))}

        {!post.commentsLocked && user && (
          <div className="flex flex-col gap-2">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows={2}
              placeholder="Добавить комментарий..."
              className="w-full bg-base-200 border border-base-300 rounded-md p-2 text-sm"
            />
            <button
              type="button"
              disabled={isSubmitting || !newComment.trim()}
              onClick={handleAddComment}
              className="self-end bg-primary text-white px-4 py-1.5 rounded-lg disabled:opacity-50"
            >
              Отправить
            </button>
          </div>
        )}
      </div>
    </article>
  );
};

export default WorkshopPostCard;
