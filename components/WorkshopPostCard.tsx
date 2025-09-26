

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
                <DynamicIcon name="wishlist-heart" className="w-5 h-5" fallback={
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M9.653 16.915l-.005-.003-.019-.01a20.759 20.759 0 01-1.162-.682 22.045 22.045 0 01-2.582-1.9-22.348 22.348 0 01-2.949-2.582 20.759 20.759 0 01-1.162-.682 1.348 1.348 0 00-.03-.028 1.348 1.348 0 00-.03-.028 1.348 1.348 0 00-.03-.028l-.005-.003A9.96 9.96 0 012 10V6.652a2.492 2.492 0 011.666-2.311 2.493 2.493 0 012.134.12l.28.168.026.016.026.016.025.015.025.015.025.015.025.015.025.015.025.015.025.015.025.015.025.015.025.015.025.015.025.015.025.015.025.015c.002 0 .003.001.005.002l.004.002c.002 0 .003.001.005.002l.005.002c.002 0 .003.001.004.002l.005.002.009.004.01.004.01.004.01.003.01.003.01.003.01.002.01.002.01.002.004.001.004.001.004.001.004.001c.002 0 .003 0 .005 0a.002.002 0 00.005 0c.002 0 .003 0 .005 0l.004-.001.004-.001.004-.001.004-.001.01-.002.01-.002.01-.002.01-.003.01-.003.01-.003.01-.004.01-.004.009-.004.005-.002.004-.002c.002-.001.003-.002.005-.002l.004-.002.005-.003.025-.015.025-.015.025-.015.025-.015.025-.015.025-.015.025-.015.025-.015.025-.015.025-.015.026-.016.026-.016.28-.168a2.493 2.493 0 012.134-.12 2.492 2.492 0 011.666 2.311V10c0 1.638-.403 3.228-1.162 4.682-.01.012-.02.023-.03.034l-.005.003z" /></svg>
                }/>
                <span>{likeCount}</span>
            </button>
            <button onClick={() => setShowComments(!showComments)} className="flex items-center space-x-2 hover:text-primary">
                <DynamicIcon name="comment-bubble" className="w-5 h-5" fallback={
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 2c-2.236 0-4.43.18-6.57.524C1.267 2.97 0 4.308 0 6v6c0 1.691 1.267 3.03 3.43 3.475C5.57 15.82 7.764 16 10 16s4.43-.18 6.57-.525C18.733 15.03 20 13.691 20 12V6c0-1.692-1.267-3.03-3.43-3.476C14.43 2.18 12.236 2 10 2zM6.686 4.751a.75.75 0 10-1.06-1.06l-1.061 1.06a.75.75 0 001.06 1.061l1.06-1.06zM14.43 3.691a.75.75 0 10-1.06 1.06l1.06 1.06a.75.75 0 001.06-1.06l-1.06-1.06z" clipRule="evenodd" /></svg>
                }/>
                <span>{comments.length}</span>
            </button>
        </div>
        <div className="relative w-20 text-center">
            {copied ? (
                <span className="text-green-400 text-xs font-bold animate-pulse">Скопировано!</span>
            ) : (
                <button onClick={handleShare} className="hover:text-primary" title="Поделиться">
                    <DynamicIcon name="share" className="w-5 h-5" fallback={
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M13 4.5a2.5 2.5 0 11.702 4.289l-3.41 1.95a2.5 2.5 0 110-1.478l3.41-1.95A2.5 2.5 0 0113 4.5zM4.5 8a2.5 2.5 0 100 5 2.5 2.5 0 000-5zm8.5 3.5a2.5 2.5 0 100 5 2.5 2.5 0 000-5z" /></svg>
                    }/>
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
                        <DynamicIcon name="send-arrow" className="w-6 h-6" fallback={
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M3.105 2.289a.75.75 0 00-.826.95l1.414 4.949a.75.75 0 00.95.54l3.123-.93a.75.75 0 01.928.928l-.93 3.123a.75.75 0 00.54.95l4.95 1.414a.75.75 0 00.95-.826l-2.434-8.518a.75.75 0 00-.702-.556l-8.518-2.434z" /></svg>
                        }/>
                    }
                </button>
            </form>
        </div>
      )}
    </div>
  );
};

export default WorkshopPostCard;
