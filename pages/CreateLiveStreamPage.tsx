import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { apiService } from '../services/apiService';
import type { Product, User } from '../types';
import Spinner from '../components/Spinner';

const CreateLiveStreamPage: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const videoRef = useRef<HTMLVideoElement>(null);

    const [stream, setStream] = useState<MediaStream | null>(null);
    const [error, setError] = useState<string>('');
    const [sellerProducts, setSellerProducts] = useState<Product[]>([]);
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isStartingStream, setIsStartingStream] = useState(false);
    
    // Form state
    const [title, setTitle] = useState('');
    const [featuredProductId, setFeaturedProductId] = useState('');
    const [moderatorId, setModeratorId] = useState<string>('');
    const [enableAiModerator, setEnableAiModerator] = useState(false);
    const [isScheduled, setIsScheduled] = useState(false);
    const [scheduleDateTime, setScheduleDateTime] = useState('');
    const [welcomeMessage, setWelcomeMessage] = useState('');


    useEffect(() => {
        // Cleanup function to stop media tracks when component unmounts
        return () => {
            stream?.getTracks().forEach(track => track.stop());
        };
    }, [stream]);

    useEffect(() => {
        if (user.verificationLevel !== 'PRO') return;

        async function setupStream() {
            try {
                const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                setStream(mediaStream);
                if (videoRef.current) {
                    videoRef.current.srcObject = mediaStream;
                }
            } catch (err) {
                console.error("Camera/Mic access denied:", err);
                setError("Необходим доступ к камере и микрофону для начала трансляции. Пожалуйста, проверьте разрешения в настройках браузера.");
            }
        }

        async function fetchData() {
            setIsLoading(true);
            try {
                const [products, users] = await Promise.all([
                    apiService.getProductsBySellerId(user.id),
                    apiService.getUsers(),
                ]);
                setSellerProducts(products);
                setAllUsers(users.filter(u => u.id !== user.id)); // Exclude self from moderator list
                if (products.length > 0) {
                    setFeaturedProductId(products[0].id);
                }
            } catch (err) {
                console.error("Failed to fetch initial data:", err);
                setError("Не удалось загрузить данные для создания трансляции.");
            } finally {
                setIsLoading(false);
            }
        }
        
        setupStream();
        fetchData();

    }, [user.id, user.verificationLevel]);

    const handleGoLive = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !featuredProductId) {
            setError("Пожалуйста, введите название трансляции и выберите товар.");
            return;
        }

        setIsStartingStream(true);
        setError('');
        try {
            const options = {
                moderatorId: moderatorId || undefined,
                isAiModeratorEnabled: enableAiModerator,
                scheduledStartTime: isScheduled && scheduleDateTime ? new Date(scheduleDateTime).getTime() : undefined,
                welcomeMessage: welcomeMessage.trim() || undefined,
            };

            const newStream = await apiService.createLiveStream(title, user, featuredProductId, options);
            stream?.getTracks().forEach(track => track.stop()); // Stop camera before navigating
            navigate(`/live/${newStream.id}`);
        } catch (err: any) {
            console.error("Failed to create stream:", err);
            setError(err.message || "Не удалось начать трансляцию. Попробуйте снова.");
            setIsStartingStream(false);
        }
    };

    if (user.verificationLevel !== 'PRO') {
        return (
            <div className="text-center py-20 bg-base-100 rounded-lg">
                <h1 className="text-3xl font-bold text-white mb-4">Доступ для Pro-продавцов</h1>
                <p className="text-base-content/70 mb-8">Возможность начинать прямые эфиры доступна только для пользователей со статусом PRO.</p>
                <Link to="/verify" className="bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 px-6 rounded-lg transition-colors">
                    Стать Pro-продавцом
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto py-8">
            <div className="bg-base-100 p-6 sm:p-8 rounded-2xl shadow-2xl border border-base-300">
                <div className="text-center">
                    <h1 className="text-4xl font-bold text-white mb-4">Настройки трансляции</h1>
                    <p className="text-lg text-base-content/70 mb-8">
                        Продемонстрируйте свои товары в реальном времени и общайтесь с покупателями.
                    </p>
                </div>

                <div className="aspect-video bg-base-200 rounded-lg mb-8 flex items-center justify-center overflow-hidden">
                    {error && !stream ? (
                        <div className="p-4 text-red-400">{error}</div>
                    ) : (
                        <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover transform scale-x-[-1]" />
                    )}
                </div>

                <form onSubmit={handleGoLive} className="space-y-8 text-left">
                    {/* Section 1: Basic Info */}
                    <div className="bg-base-200/50 p-6 rounded-lg">
                        <h2 className="text-xl font-semibold text-white mb-4">1. Основная информация</h2>
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="stream-title" className="block text-sm font-medium text-base-content/70 mb-2">Название трансляции*</label>
                                <input id="stream-title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Например, 'Новая коллекция керамики!'" className="w-full bg-base-200 border border-base-300 rounded-md p-3" required />
                            </div>
                            <div>
                                <label htmlFor="featured-product" className="block text-sm font-medium text-base-content/70 mb-2">Главный товар в эфире*</label>
                                {isLoading ? <Spinner /> : (
                                    <select id="featured-product" value={featuredProductId} onChange={(e) => setFeaturedProductId(e.target.value)} className="w-full bg-base-200 border border-base-300 rounded-md p-3" required>
                                        {sellerProducts.length > 0 ? sellerProducts.map(p => (<option key={p.id} value={p.id}>{p.title}</option>)) : <option disabled>У вас нет товаров для показа</option>}
                                    </select>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Moderation */}
                     <div className="bg-base-200/50 p-6 rounded-lg">
                         <h2 className="text-xl font-semibold text-white mb-4">2. Модерация</h2>
                        <div className="space-y-6">
                            <div>
                                <label htmlFor="moderator-select" className="block text-sm font-medium text-base-content/70 mb-2">Назначить модератора (необязательно)</label>
                                <select id="moderator-select" value={moderatorId} onChange={(e) => setModeratorId(e.target.value)} className="w-full bg-base-200 border border-base-300 rounded-md p-3">
                                    <option value="">Без модератора</option>
                                    {allUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                </select>
                                <p className="text-xs text-base-content/70 mt-1">Модератор сможет блокировать пользователей и отправлять скидки от вашего имени.</p>
                            </div>
                            <div>
                                <label className="flex items-center justify-between cursor-pointer">
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm font-medium text-base-content">Активировать AI-модератора</span>
                                        <span className="bg-primary text-primary-content text-xs font-bold px-2 py-0.5 rounded-full">3 USDT</span>
                                    </div>
                                    <div className="relative">
                                        <input type="checkbox" checked={enableAiModerator} onChange={(e) => setEnableAiModerator(e.target.checked)} className="sr-only" />
                                        <div className="block bg-base-300 w-14 h-8 rounded-full"></div>
                                        <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${enableAiModerator ? 'translate-x-6 bg-green-400' : ''}`}></div>
                                    </div>
                                </label>
                                <p className="text-xs text-base-content/70 mt-1">AI будет фильтровать спам и отвечать на частые вопросы о товаре.</p>
                            </div>
                        </div>
                    </div>

                    {/* Section 3: Advanced */}
                     <div className="bg-base-200/50 p-6 rounded-lg">
                        <h2 className="text-xl font-semibold text-white mb-4">3. Расширенные настройки</h2>
                        <div className="space-y-6">
                            <div>
                                <label className="flex items-center cursor-pointer">
                                    <input type="checkbox" checked={isScheduled} onChange={(e) => setIsScheduled(e.target.checked)} className="h-4 w-4 rounded bg-base-200 border-base-300 text-primary focus:ring-primary"/>
                                    <span className="ml-2 text-sm font-medium text-base-content">Запланировать трансляцию</span>
                                </label>
                                {isScheduled && (
                                    <input type="datetime-local" value={scheduleDateTime} onChange={e => setScheduleDateTime(e.target.value)} className="mt-2 w-full bg-base-200 border border-base-300 rounded-md p-3"/>
                                )}
                            </div>
                            <div>
                                <label htmlFor="welcome-message" className="block text-sm font-medium text-base-content/70 mb-2">Приветственное сообщение в чате</label>
                                <textarea id="welcome-message" value={welcomeMessage} onChange={e => setWelcomeMessage(e.target.value)} rows={2} placeholder="Например: 'Всем привет! Сегодня показываю новые поступления, задавайте вопросы!'" className="w-full bg-base-200 border border-base-300 rounded-md p-3"/>
                            </div>
                        </div>
                    </div>

                    {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                    
                    <button 
                        type="submit"
                        disabled={isStartingStream || !stream || sellerProducts.length === 0 || isLoading}
                        className="w-full flex justify-center items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-8 rounded-lg transition-colors text-lg disabled:bg-gray-500 disabled:cursor-not-allowed"
                    >
                        {isStartingStream ? <Spinner size="sm"/> : (
                             <>
                                <span className="relative flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                                </span>
                                {isScheduled && scheduleDateTime ? 'Запланировать' : 'Начать эфир'}
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default CreateLiveStreamPage;