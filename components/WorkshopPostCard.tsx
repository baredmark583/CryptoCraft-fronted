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
  const [isLiked, setIsLiked] = useState(post.likedBy.includes(user.id));
  const [likeCount, setLikeCount] = useState(post.likedBy.length);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<WorkshopComment[]>(post.comments);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setIsLiked(post.likedBy.includes(user.id));
    setLikeCount(post.likedBy.length);
    setComments(post.comments);
  }, [post, user.id]);

  useEffect(() => {
      let timeoutId: number;
      if (copied) {
          timeoutId = window.setTimeout(() => {
              setCopied(false);
          }, 2000);
      }
      return () => {
          window.clearTimeout(timeoutId);
      };
  }, [copied]);

  const handleLikeToggle = async () => {
    // Optimistic update
    setIsLiked(!isLiked);
    setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
    
    try {
      await apiService.likeWorkshopPost(post.id, user.id);
    } catch (error) {
      console.error("Failed to update like status", error);
      // Revert on error
      setIsLiked(isLiked);
      setLikeCount(likeCount);
    }
  };
  
  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
        const addedComment = await apiService.addCommentToWorkshopPost(post.id, user.id, newComment);
        setComments(prev => [...prev, addedComment]);
        setNewComment('');
    } catch (error) {
        console.error("Failed to add comment", error);
        // Optionally show an error to the user
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/#/profile/${seller.id}`;
    const shareText = `Зацените пост от ${seller.name} на CryptoCraft!`;

    if (navigator.share) {
        try {
            await navigator.share({
                title: 'Пост в Мастерской CryptoCraft',
                text: shareText,
                url: shareUrl,
            });
        } catch (error) {
            console.log('Ошибка при попытке поделиться:', error);
        }
    } else {
        // Fallback: copy to clipboard
        navigator.clipboard.writeText(shareUrl).then(() => {
            setCopied(true);
        });
    }
  };

  return (
    <div className="bg-base-100 rounded-lg overflow-hidden shadow-lg flex flex-col">
      <div className="p-4">
        <div className="flex items-center mb-4">
          <Link to={`/profile/${seller.id}`}>
            <img src={seller.avatarUrl} alt={seller.name} className="w-12 h-12 rounded-full mr-4" />
          </Link>
          <div>
            <Link to={`/profile/${seller.id}`} className="font-bold text-white hover:text-primary">{seller.name}</Link>
            <p className="text-xs text-base-content/70">{new Date(post.timestamp).toLocaleString()}</p>
          </div>
        </div>
        <p className="text-base-content mb-4 whitespace-pre-wrap">{post.text}</p>
      </div>

      {post.imageUrl && (
        <div className="bg-base-200 flex-grow flex items-center justify-center">
          <img src={post.imageUrl} alt="Workshop post" className="w-full h-auto max-h-96 object-contain" />
        </div>
      )}

      <div className="p-4 flex justify-between text-base-content/70 text-sm border-b border-base-300/50">
        <div className="flex space-x-6">
            <button onClick={handleLikeToggle} className={`flex items-center space-x-2 transition-colors ${isLiked ? 'text-red-500' : 'hover:text-red-500'}`}>
                <DynamicIcon name="wishlist-heart" className="w-5 h-5" />
                <span>{likeCount}</span>
            </button>
            <button onClick={() => setShowComments(!showComments)} className="flex items-center space-x-2 hover:text-primary">
                <DynamicIcon name="comment-bubble" className="w-5 h-5" />
                <span>{comments.length}</span>
            </button>
        </div>
        <div className="relative w-20 text-center">
            {copied ? (
                <span className="text-green-400 text-xs font-bold animate-pulse">Скопировано!</span>
            ) : (
                <button onClick={handleShare} className="hover:text-primary" title="Поделиться">
                    <DynamicIcon name="share" className="w-5 h-5" />
                </button>
            )}
        </div>
      </div>

      {showComments && (
        <div className="p-4 bg-base-200/50 animate-fade-in-down">
            <div className="space-y-3 max-h-60 overflow-y-auto pr-2 mb-4">
                {comments.map(comment => (
                    <div key={comment.id} className="flex items-start">
                        <img src={comment.author.avatarUrl} alt={comment.author.name} className="w-8 h-8 rounded-full mr-3 flex-shrink-0"/>
                        <div className="bg-base-100 p-2 rounded-lg">
                            <Link to={`/profile/${comment.author.id}`} className="font-bold text-white text-sm hover:underline">{comment.author.name}</Link>
                            <p className="text-sm text-base-content">{comment.text}</p>
                        </div>
                    </div>
                ))}
            </div>
            <form onSubmit={handleCommentSubmit} className="flex items-center gap-2">
                <img src={user.avatarUrl} alt={user.name} className="w-8 h-8 rounded-full"/>
                <input
                    type="text"
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                    placeholder="Написать комментарий..."
                    className="flex-grow bg-base-100 border border-base-300 rounded-full py-2 px-4 text-sm"
                    disabled={isSubmitting}
                />
                <button type="submit" disabled={isSubmitting} className="p-2 text-primary disabled:text-gray-500">
                    {isSubmitting ? <Spinner size="sm" /> : 
                        <DynamicIcon name="send-arrow" className="w-6 h-6" />
                    }
                </button>
            </form>
        </div>
      )}
    </div>
  );
};

export default WorkshopPostCard;