import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiService } from '../services/apiService';
import { useAuth } from '../hooks/useAuth';
import Spinner from '../components/Spinner';
import WorkshopPostCard from '../components/WorkshopPostCard';
import CreateThreadModal from '../components/CreateThreadModal';
import type { FeedItem, ForumThread, LiveStream } from '../types';
import DynamicIcon from '../components/DynamicIcon';

type CommunityTab = 'feed' | 'threads' | 'live';

const THREADS_PER_PAGE = 6;

const CommunityHubPage: React.FC = () => {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<CommunityTab>('feed');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [threads, setThreads] = useState<ForumThread[]>([]);
  const [liveStreams, setLiveStreams] = useState<LiveStream[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [threadsPage, setThreadsPage] = useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    setThreadsPage(1);
  }, [debouncedSearch, selectedTag]);

  const fetchCommunityData = useCallback(async (withSpinner = true) => {
    if (withSpinner) {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }
    setError(null);
    try {
      const [feedResponse, forumThreads, streams] = await Promise.all([
        apiService.getFeedForUser(user?.id ?? 'public'),
        apiService.getForumThreads({
          limit: 50,
          search: debouncedSearch || undefined,
          tag: selectedTag === 'all' ? undefined : selectedTag,
        }),
        apiService.getLiveStreams(),
      ]);
      setFeedItems(feedResponse?.items ?? []);
      setThreads(forumThreads ?? []);
      setLiveStreams(streams ?? []);
    } catch (err) {
      console.error(err);
      setError('Не удалось загрузить активность сообщества. Попробуйте обновить страницу позже.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [debouncedSearch, selectedTag, user?.id]);

  useEffect(() => {
    fetchCommunityData();
  }, [fetchCommunityData]);

  const stats = useMemo(() => {
    const liveNow = liveStreams.filter(stream => stream.status === 'LIVE').length;
    const upcoming = liveStreams.filter(stream => stream.status === 'UPCOMING').length;
    const openThreads = threads.filter(thread => thread.status !== 'LOCKED').length;
    return [
      { label: 'Постов в ленте', value: feedItems.length },
      { label: 'Открытых тредов', value: openThreads },
      { label: 'Лайв-эфиров', value: liveNow },
      { label: 'Ожидающих эфиров', value: upcoming },
    ];
  }, [feedItems.length, threads, liveStreams]);

  const trendingTags = useMemo(() => {
    const counts = new Map<string, number>();
    threads.forEach(thread => {
      thread.tags?.forEach(tag => {
        counts.set(tag, (counts.get(tag) ?? 0) + 1);
      });
    });
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
  }, [threads]);

  const paginatedThreads = useMemo(() => {
    const start = (threadsPage - 1) * THREADS_PER_PAGE;
    return threads.slice(start, start + THREADS_PER_PAGE);
  }, [threads, threadsPage]);

  const totalThreadPages = Math.max(1, Math.ceil(threads.length / THREADS_PER_PAGE));

  const handleCreateThread = async (title: string, content: string) => {
    await apiService.createForumThread(title, content, user!);
    setIsCreateModalOpen(false);
    await fetchCommunityData(false);
  };

  const renderFeed = () => {
    if (!feedItems.length) {
      return (
        <div className="text-center py-12 text-base-content/70">
          Пока что нет свежих постов. Поделитесь своей работой первым!
        </div>
      );
    }
    return (
      <div className="space-y-4">
        {feedItems.map(item => (
          <WorkshopPostCard key={item.post.id} post={item.post} seller={item.seller} />
        ))}
      </div>
    );
  };

  const renderThreads = () => {
    if (!threads.length && !isLoading) {
      return (
        <div className="text-center py-12 text-base-content/70">
          Темы не найдены. Попробуйте сбросить фильтры или создать новую тему.
        </div>
      );
    }
    return (
      <div className="space-y-4">
        {paginatedThreads.map(thread => (
          <div key={thread.id} className="p-4 rounded-xl border border-base-300 bg-base-100 flex flex-col gap-2">
            <div className="flex items-center justify-between gap-4">
              <div>
                <Link to={`/thread/${thread.id}`} className="text-xl font-semibold text-white hover:text-primary transition-colors">
                  {thread.title}
                </Link>
                <p className="text-xs text-base-content/60">
                  {thread.author.name} • {new Date(thread.createdAt).toLocaleString()} • {thread.replyCount} ответов
                </p>
              </div>
              {thread.isPinned && (
                <span className="px-3 py-1 text-xs rounded-full bg-primary/20 text-primary uppercase tracking-wide">Закреплена</span>
              )}
            </div>
            {thread.tags && thread.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {thread.tags.map(tag => (
                  <span key={`${thread.id}-${tag}`} className="px-2 py-1 text-xs rounded-full bg-base-200 text-base-content/80">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
            <div className="flex items-center justify-between text-sm text-base-content/70">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <DynamicIcon name="comment-bubble" className="w-4 h-4" />
                  {thread.replyCount}
                </span>
                <span className="flex items-center gap-1">
                  <DynamicIcon name="view" fallback={fallbackIcons.view} className="w-4 h-4" />
                  {thread.viewCount ?? 0}
                </span>
              </div>
              <Link to={`/thread/${thread.id}`} className="text-primary font-semibold hover:underline">
                Читать тред →
              </Link>
            </div>
          </div>
        ))}

        {totalThreadPages > 1 && (
          <div className="flex justify-between items-center pt-4 border-t border-base-300">
            <button
              type="button"
              disabled={threadsPage === 1}
              onClick={() => setThreadsPage(page => Math.max(1, page - 1))}
              className="px-3 py-1 rounded-lg bg-base-200 text-sm disabled:opacity-40"
            >
              Назад
            </button>
            <span className="text-sm text-base-content/70">
              Страница {threadsPage} из {totalThreadPages}
            </span>
            <button
              type="button"
              disabled={threadsPage >= totalThreadPages}
              onClick={() => setThreadsPage(page => Math.min(totalThreadPages, page + 1))}
              className="px-3 py-1 rounded-lg bg-base-200 text-sm disabled:opacity-40"
            >
              Далее
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderLive = () => {
    if (!liveStreams.length) {
      return (
        <div className="text-center py-12 text-base-content/70">
          Прямые эфиры пока не запланированы.
        </div>
      );
    }
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {liveStreams.map(stream => (
          <div key={stream.id} className="p-4 rounded-xl border border-base-300 bg-base-100 flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-base-content/60">{stream.seller.name}</p>
                <h3 className="text-lg font-semibold text-white">{stream.title}</h3>
              </div>
              <span
                className={`px-3 py-1 text-xs rounded-full ${
                  stream.status === 'LIVE'
                    ? 'bg-red-500/20 text-red-300'
                    : stream.status === 'UPCOMING'
                    ? 'bg-primary/20 text-primary'
                    : 'bg-base-200 text-base-content/70'
                }`}
              >
                {stream.status === 'LIVE' ? 'В эфире' : stream.status === 'UPCOMING' ? 'Скоро' : 'Завершено'}
              </span>
            </div>
            <p className="text-sm text-base-content/80 line-clamp-3">{stream.welcomeMessage || stream.featuredProduct?.description}</p>
            <div className="flex items-center justify-between text-sm text-base-content/70">
              <span className="flex items-center gap-1">
                <DynamicIcon name="live" fallback={fallbackIcons.live} className="w-4 h-4" />
                {stream.viewerCount ?? 0} зрителей
              </span>
              {stream.status !== 'ENDED' && (
                <Link to={`/live/${stream.id}`} className="text-primary font-semibold hover:underline">
                  Присоединиться
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-wide text-base-content/60">Сообщество</p>
          <h1 className="text-3xl font-black text-white">CryptoCraft Hub</h1>
          <p className="text-base-content/70 text-sm">
            Лента мастерской, форум и прямые эфиры в одном месте. Делитесь прогрессом, ищите вдохновение и общайтесь с создателями.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => fetchCommunityData(false)}
            className="px-4 py-2 rounded-lg bg-base-200 text-sm font-semibold flex items-center gap-2 disabled:opacity-60"
            disabled={isRefreshing}
          >
            <DynamicIcon
              name="refresh"
              fallback={fallbackIcons.refresh}
              className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`}
            />
            Обновить
          </button>
          {user && (
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold"
            >
              Новая тема
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map(stat => (
          <div key={stat.label} className="rounded-2xl border border-base-300 bg-base-100/80 p-4">
            <p className="text-xs uppercase tracking-wide text-base-content/60">{stat.label}</p>
            <p className="text-2xl font-bold text-white">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-base-100 rounded-2xl border border-base-300 p-4 space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex gap-2 bg-base-200 rounded-xl p-1 w-full md:w-auto">
            {(['feed', 'threads', 'live'] as CommunityTab[]).map(tab => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-semibold ${
                  activeTab === tab ? 'bg-primary text-white' : 'text-base-content/70'
                }`}
              >
                {tab === 'feed' ? 'Лента' : tab === 'threads' ? 'Форум' : 'Лайвы'}
              </button>
            ))}
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <input
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Поиск по темам"
              className="flex-1 bg-base-200 border border-base-300 rounded-lg px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setDebouncedSearch('');
                setSelectedTag('all');
              }}
              className="px-3 py-2 rounded-lg bg-base-200 text-sm"
            >
              Сбросить
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSelectedTag('all')}
            className={`px-3 py-1 rounded-full text-xs font-semibold border ${
              selectedTag === 'all' ? 'bg-primary/20 text-primary border-primary/40' : 'border-base-300'
            }`}
          >
            Все темы
          </button>
          {trendingTags.map(([tag, count]) => (
            <button
              key={tag}
              type="button"
              onClick={() => setSelectedTag(tag)}
              className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                selectedTag === tag ? 'bg-primary/20 text-primary border-primary/40' : 'border-base-300 text-base-content/80'
              }`}
            >
              #{tag} · {count}
            </button>
          ))}
        </div>

        <div className="pt-2">
          {error && (
            <div className="mb-4 rounded-xl border border-red-500/40 bg-red-500/10 text-sm text-red-200 p-3">
              {error}
            </div>
          )}
          {isLoading ? (
            <div className="flex justify-center py-16">
              <Spinner size="lg" />
            </div>
          ) : (
            <>
              {activeTab === 'feed' && renderFeed()}
              {activeTab === 'threads' && renderThreads()}
              {activeTab === 'live' && renderLive()}
            </>
          )}
        </div>
      </div>

      {isCreateModalOpen && (
        <CreateThreadModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={handleCreateThread}
        />
      )}
    </div>
  );
};

export default CommunityHubPage;
const fallbackIcons = {
  refresh: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.65 6.35A8 8 0 1 0 12 20a8 8 0 0 0 7.55-5h-2.1a6 6 0 1 1-1.9-6.36l-2.55 2.55H22V2l-2.35 2.35z" />
    </svg>
  ),
  view: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 5C5 5 1 12 1 12s4 7 11 7 11-7 11-7-4-7-11-7zm0 12a5 5 0 1 1 0-10 5 5 0 0 1 0 10z" />
    </svg>
  ),
  live: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 5a7 7 0 0 1 0 14v-2a5 5 0 1 0 0-10V5zm-5 7a5 5 0 0 0 5 5v2a7 7 0 0 1 0-14v2a5 5 0 0 0-5 5z" />
    </svg>
  ),
};
