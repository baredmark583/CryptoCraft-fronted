

import React, { useState, useEffect, useCallback } from 'react';
// FIX: Upgraded react-router-dom to v6. Replaced useHistory with useNavigate.
import { Link, useNavigate } from 'react-router-dom';
import { apiService } from '../services/apiService';
import type { ForumThread, LiveStream } from '../types';
import Spinner from '../components/Spinner';
import CreateThreadModal from '../components/CreateThreadModal';
import { useAuth } from '../hooks/useAuth';

const LiveStreamsSection: React.FC = () => {
  const [streams, setStreams] = useState<LiveStream[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStreams = async () => {
      setIsLoading(true);
      try {
        const data = await apiService.getLiveStreams();
        setStreams(data);
      } catch (error) {
        console.error("Failed to fetch streams", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStreams();
  }, []);

  if (isLoading) {
    return <div className="flex justify-center py-8"><Spinner /></div>;
  }
  
  if (streams.length === 0) return null;

  return (
    <section className="mb-12">
      <h2 className="text-3xl font-bold text-white mb-4">Прямые эфиры</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {streams.map(stream => (
          <Link to={`/live/${stream.id}`} key={stream.id} className="block bg-base-100 rounded-lg group overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-primary/20 hover:-translate-y-1">
            <div className="relative aspect-video bg-base-200">
                <img src={stream.seller.headerImageUrl || 'https://picsum.photos/seed/livebg/600/400'} alt="Live Stream Background" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent p-4 flex flex-col justify-between">
                  <div>
                    {stream.status === 'LIVE' && (
                       <span className="bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center w-fit">
                          <span className="relative flex h-2 w-2 mr-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                          </span>
                          LIVE
                       </span>
                    )}
                     {stream.status === 'UPCOMING' && (
                       <span className="bg-sky-600 text-white text-xs font-bold px-3 py-1 rounded-full">СКОРО</span>
                    )}
                  </div>
                   <div className="flex items-center gap-3">
                      <img src={stream.seller.avatarUrl} alt={stream.seller.name} className="w-10 h-10 rounded-full border-2 border-primary"/>
                      <div>
                          <p className="font-bold text-white leading-tight">{stream.title}</p>
                          <p className="text-sm text-base-content/70">{stream.seller.name}</p>
                      </div>
                   </div>
                </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}


const CommunityHubPage: React.FC = () => {
  const [threads, setThreads] = useState<ForumThread[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { user } = useAuth();
  // FIX: Upgraded react-router-dom to v6. Replaced useHistory with useNavigate.
  const navigate = useNavigate();

  const fetchThreads = useCallback(async () => {
    setIsLoading(true);
    try {
        const data = await apiService.getForumThreads();
        setThreads(data);
    } catch (error) {
        console.error("Failed to fetch threads", error);
    } finally {
        setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchThreads();
  }, [fetchThreads]);

  const handleCreateThread = async (title: string, content: string): Promise<ForumThread> => {
      const newThread = await apiService.createForumThread(title, content, user);
      // Refetch or optimistically update
      setThreads(prev => [newThread, ...prev.filter(t => t.id !== newThread.id)]);
      setIsModalOpen(false);
      // FIX: Use navigate instead of history.push.
      navigate(`/thread/${newThread.id}`);
      return newThread;
  };

  const renderContent = () => {
    if (isLoading) {
      return <div className="flex justify-center items-center h-64"><Spinner /></div>;
    }

    if(threads.length === 0) {
        return (
            <div className="text-center py-16 bg-base-100 rounded-lg">
                <h2 className="text-2xl font-bold text-white mb-2">На форуме пока тихо</h2>
                <p className="text-base-content/70">Станьте первым, кто создаст новую тему для обсуждения!</p>
            </div>
        )
    }

    return (
      <div className="bg-base-100 rounded-lg shadow-lg">
        <ul>
          {threads.map((thread, index) => (
            <li key={thread.id} className={`flex items-center p-4 ${index < threads.length - 1 ? 'border-b border-base-300' : ''}`}>
              <div className="flex-shrink-0 mr-4">
                <img src={thread.author.avatarUrl} alt={thread.author.name} className="w-12 h-12 rounded-full" />
              </div>
              <div className="flex-grow">
                <Link to={`/thread/${thread.id}`} className="font-semibold text-white hover:text-primary text-lg leading-tight">
                  {thread.isPinned && <span className="text-yellow-400 mr-2" title="Закреплено">📌</span>}
                  {thread.title}
                </Link>
                <p className="text-sm text-base-content/70 mt-1">
                  Автор: {thread.author.name} &bull; Создана: {new Date(thread.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="text-right text-sm text-base-content/70 hidden sm:block">
                <p>{thread.replyCount} ответов</p>
                <p>Последний: {new Date(thread.lastReplyAt).toLocaleDateString()}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <>
        <div>
          <section className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">Центр сообщества</h1>
            <p className="text-lg text-base-content/70">Обсуждения, вопросы и ответы от мастеров и покупателей.</p>
          </section>

          <LiveStreamsSection />
          
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-3xl font-bold text-white">Форум</h2>
            <button onClick={() => setIsModalOpen(true)} className="bg-primary hover:bg-primary-focus text-white font-bold py-2 px-4 rounded-lg">
                Создать новую тему
            </button>
          </div>

          {renderContent()}
        </div>
        {isModalOpen && (
            <CreateThreadModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleCreateThread}
            />
        )}
    </>
  );
};

export default CommunityHubPage;