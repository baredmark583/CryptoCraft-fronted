import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiService } from '../services/apiService';
import type { LiveStream, Product, Message } from '../types';
import Spinner from '../components/Spinner';
import { useAuth } from '../hooks/useAuth';
import { useCart } from '../hooks/useCart';
import DynamicIcon from '../components/DynamicIcon';

// Mock messages for chat simulation
const mockChatMessages = [
  { name: 'ArtLover22', text: 'Какая красивая работа! 😍' },
  { name: 'Collector_Jane', text: 'Сколько стоит доставка?' },
  { name: 'CraftyAlex', text: 'Это ручная роспись?' },
  { name: 'PotteryFan_UA', text: 'А есть другие цвета?' },
  { name: 'VintageFinds', text: 'Супер! Уже хочу купить!' },
];

const LiveStreamPage: React.FC = () => {
    const { streamId } = useParams<{ streamId: string }>();
    const { user } = useAuth();
    const { addToCart } = useCart();
    const [stream, setStream] = useState<LiveStream | null>(null);
    const [product, setProduct] = useState<Product | null>(null);
    const [chatMessages, setChatMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [newMessage, setNewMessage] = useState('');
    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
    if (!streamId) return;
    const fetchData = async () => {
        setIsLoading(true);
        try {
        const streamData = await apiService.getLiveStreamById(streamId);
        setStream(streamData);
        if (streamData) {
            const productData = await apiService.getProductById(streamData.featuredProductId);
            setProduct(productData || null);
        }
        } catch (error) {
        console.error("Failed to load stream data:", error);
        } finally {
        setIsLoading(false);
        }
    };
    fetchData();
    }, [streamId]);

    // Chat simulation
    useEffect(() => {
    if (stream?.status === 'LIVE') {
        const interval = setInterval(() => {
        const mockMsg = mockChatMessages[Math.floor(Math.random() * mockChatMessages.length)];
        const newChatMessage: Message = {
            id: `msg-${Date.now()}`,
            senderId: `user-${Math.random()}`,
            senderName: mockMsg.name,
            text: mockMsg.text,
            timestamp: Date.now(),
        };
        setChatMessages(prev => [...prev, newChatMessage]);
        }, 4000);
        return () => clearInterval(interval);
    }
    }, [stream?.status]);

    useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatMessages]);

    const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    const userMessage: Message = {
        id: `msg-${Date.now()}`,
        senderId: user.id,
        senderName: user.name,
        text: newMessage,
        timestamp: Date.now(),
    };
    setChatMessages(prev => [...prev, userMessage]);
    setNewMessage('');
    };

    if (isLoading) return <div className="flex justify-center items-center h-96"><Spinner /></div>;
    if (!stream) return <div className="text-center text-xl text-base-content/70">Трансляция не найдена.</div>;

    return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
        {/* Video Player & Product */}
        <div className="lg:col-span-2 space-y-6">
        <div className="aspect-video bg-base-200 rounded-lg flex items-center justify-center relative">
            <p className="text-base-content/70">{stream.status === 'LIVE' ? 'Идет прямая трансляция...' : (stream.status === 'UPCOMING' ? `Начнется в ${new Date(stream.scheduledStartTime || 0).toLocaleTimeString()}` : 'Трансляция завершена')}</p>
            {stream.status === 'LIVE' && <span className="absolute top-4 left-4 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center"><span className="relative flex h-2 w-2 mr-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span></span>LIVE</span>}
        </div>
        {product && (
            <div className="bg-base-100 p-4 rounded-lg">
            <h3 className="text-lg font-bold text-white mb-2">Товар в эфире</h3>
            <div className="flex flex-col sm:flex-row items-start gap-4">
                <img src={product.imageUrls[0]} alt={product.title} className="w-24 h-24 object-cover rounded-md"/>
                <div className="flex-1">
                    <Link to={`/product/${product.id}`} className="font-semibold text-white hover:text-primary text-xl">{product.title}</Link>
                    <p className="text-2xl font-bold text-primary mt-2">{product.price?.toFixed(2)} USDT</p>
                </div>
                <button onClick={() => addToCart(product, 1, undefined, product.price || 0, 'RETAIL')} className="bg-primary hover:bg-primary-focus text-primary-content font-bold py-2 px-4 rounded-lg w-full sm:w-auto">
                    В корзину
                </button>
            </div>
            </div>
        )}
        </div>
        {/* Chat */}
        <div className="lg:col-span-1 bg-base-100 rounded-lg flex flex-col h-[calc(100vh-12rem)]">
        <div className="p-4 border-b border-base-300">
            <h3 className="font-bold text-white">Live-чат</h3>
        </div>
        <div className="flex-grow p-4 overflow-y-auto space-y-3">
            {stream.welcomeMessage && <div className="p-2 bg-base-300/50 rounded-md text-sm text-center text-amber-300 italic">{stream.welcomeMessage}</div>}
            {chatMessages.map(msg => (
                <div key={msg.id}>
                    <span className={`font-bold text-sm ${msg.senderId === user.id ? 'text-primary' : 'text-base-content'}`}>{msg.senderName || 'Гость'}:</span>
                    <span className="text-sm text-base-content/90 ml-2">{msg.text}</span>
                </div>
            ))}
            <div ref={chatEndRef} />
        </div>
        <div className="p-4 border-t border-base-300">
            <form onSubmit={handleSendMessage} className="flex gap-2">
                <input type="text" value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="Ваше сообщение..." className="flex-1 bg-base-200 border border-base-300 rounded-full py-2 px-4 text-sm" />
                <button type="submit" className="p-2 bg-primary rounded-full text-white">
                    <DynamicIcon name="send-arrow" fallback={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M3.105 2.289a.75.75 0 00-.826.95l1.414 4.949a.75.75 0 00.95.54l3.123-.93a.75.75 0 01.928.928l-.93 3.123a.75.75 0 00.54.95l4.95 1.414a.75.75 0 00.95-.826l-2.434-8.518a.75.75 0 00-.702-.556l-8.518-2.434z" /></svg>} className="w-5 h-5" />
                </button>
            </form>
        </div>
        </div>
    </div>
    );
};

export default LiveStreamPage;
