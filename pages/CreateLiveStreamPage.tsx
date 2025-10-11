import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { apiService } from '../services/apiService';
import type { Product } from '../types';
import Spinner from '../components/Spinner';
import { useRequiredAuth } from '../hooks/useAuth';

const CreateLiveStreamPage: React.FC = () => {
    const { user } = useRequiredAuth();
    const navigate = useNavigate();
    const videoRef = useRef<HTMLVideoElement>(null);

    const [stream, setStream] = useState<MediaStream | null>(null);
    const [error, setError] = useState<string>('');
    const [sellerProducts, setSellerProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isStartingStream, setIsStartingStream] = useState(false);
    
    const [title, setTitle] = useState('');
    const [featuredProductId, setFeaturedProductId] = useState('');
    const [welcomeMessage, setWelcomeMessage] = useState('');

    useEffect(() => {
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
        setupStream();
        // Cleanup function to stop media tracks when component unmounts
        return () => {
            stream?.getTracks().forEach(track => track.stop());
        };
    }, []);

    useEffect(() => {
        async function fetchProducts() {
            setIsLoading(true);
            try {
                const products = await apiService.getProductsBySellerId(user.id);
                setSellerProducts(products);
                if (products.length > 0) {
                    setFeaturedProductId(products[0].id);
                }
            } catch (err) {
                console.error("Failed to fetch seller products:", err);
                setError("Не удалось загрузить ваши товары.");
            } finally {
                setIsLoading(false);
            }
        }
        fetchProducts();
    }, [user.id]);

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
                welcomeMessage: welcomeMessage.trim() || undefined,
            };

            const newStream = await apiService.createLiveStream(title, featuredProductId, options);
            stream?.getTracks().forEach(track => track.stop()); // Stop camera before navigating
            navigate(`/live/${newStream.id}`);
        } catch (err: any) {
            console.error("Failed to create stream:", err);
            setError(err.message || "Не удалось начать трансляцию. Попробуйте снова.");
            setIsStartingStream(false);
        }
    };

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

                <form onSubmit={handleGoLive} className="space-y-6 text-left">
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
                     <div>
                        <label htmlFor="welcome-message" className="block text-sm font-medium text-base-content/70 mb-2">Приветственное сообщение в чате</label>
                        <textarea id="welcome-message" value={welcomeMessage} onChange={e => setWelcomeMessage(e.target.value)} rows={2} placeholder="Например: 'Всем привет! Сегодня показываю новые поступления, задавайте вопросы!'" className="w-full bg-base-200 border border-base-300 rounded-md p-3"/>
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
                                Начать эфир
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default CreateLiveStreamPage;