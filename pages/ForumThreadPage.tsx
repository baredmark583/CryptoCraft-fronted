import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiService } from '../services/apiService';
import type { ForumThread, ForumPost } from '../types';
import Spinner from '../components/Spinner';
import { useAuth } from '../hooks/useAuth';
import { useTelegramBackButton } from '../hooks/useTelegram';

const ForumThreadPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [thread, setThread] = useState<ForumThread | null>(null);
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [replyContent, setReplyContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useTelegramBackButton(true);

  useEffect(() => {
    if (!id) return;
    const fetchThreadData = async () => {
      setIsLoading(true);
      try {
        const [threadData, postsData] = await Promise.all([
          apiService.getForumThreadById(id),
          apiService.getForumPostsByThreadId(id)
        ]);
        setThread(threadData || null);
        setPosts(postsData);
      } catch (error) {
        console.error("Failed to fetch thread data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchThreadData();
  }, [id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [posts]);

  const handleReplySubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!replyContent.trim() || !id) return;
      setIsSubmitting(true);
      try {
          const newPost = await apiService.createForumPost(id, replyContent, user);
          setPosts(prev => [...prev, newPost]);
          setReplyContent('');
      } catch (error) {
          console.error("Failed to post reply:", error);
          alert("Не удалось отправить ответ.");
      } finally {
          setIsSubmitting(false);
      }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-96"><Spinner /></div>;
  }

  if (!thread) {
    return <div className="text-center text-2xl text-brand-text-secondary mt-16">Тема не найдена</div>;
  }

  return (
    <div>
      <div className="mb-6">
        <Link to="/community" className="text-sm text-brand-secondary hover:text-brand-primary mb-4 block">&larr; Вернуться в сообщество</Link>
        <h1 className="text-3xl font-bold text-white">{thread.title}</h1>
      </div>
      
      <div className="space-y-6">
        {posts.map(post => (
          <div key={post.id} className="bg-brand-surface rounded-lg shadow-md flex p-4">
            <div className="flex-shrink-0 mr-4 text-center">
              <Link to={`/profile/${post.author.id}`}>
                <img src={post.author.avatarUrl} alt={post.author.name} className="w-16 h-16 rounded-full mx-auto" />
              </Link>
              <p className="font-bold text-white mt-2">{post.author.name}</p>
              <p className="text-xs text-brand-text-secondary">{post.author.id === thread.author.id ? 'Автор темы' : ''}</p>
            </div>
            <div className="flex-grow border-l border-brand-border pl-4">
               <p className="text-xs text-brand-text-secondary mb-2">{new Date(post.createdAt).toLocaleString()}</p>
               <div className="text-brand-text-primary leading-relaxed whitespace-pre-wrap">
                   {post.content}
               </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      
       <div className="mt-8 bg-brand-surface p-6 rounded-lg">
          <h3 className="text-xl font-bold text-white mb-4">Ваш ответ</h3>
          <form onSubmit={handleReplySubmit}>
            <div className="flex items-start gap-4">
                <img src={user.avatarUrl} alt={user.name} className="w-12 h-12 rounded-full flex-shrink-0" />
                <textarea 
                    rows={5} 
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    className="w-full bg-brand-background border border-brand-border rounded-md p-3"
                    placeholder="Введите ваше сообщение..."
                    disabled={isSubmitting}
                />
            </div>
            <div className="text-right">
                <button 
                    type="submit"
                    disabled={isSubmitting || !replyContent.trim()}
                    className="mt-4 bg-brand-primary hover:bg-brand-primary-hover text-white font-bold py-2 px-6 rounded-lg disabled:bg-gray-500 disabled:cursor-not-allowed flex items-center justify-center min-w-[120px] ml-auto"
                >
                    {isSubmitting ? <Spinner size="sm" /> : 'Отправить'}
                </button>
            </div>
          </form>
      </div>
    </div>
  );
};

export default ForumThreadPage;