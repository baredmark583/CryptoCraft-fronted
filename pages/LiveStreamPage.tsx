import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiService } from '../services/apiService';
import type { LiveStream, Product, Message } from '../types';
import Spinner from '../components/Spinner';
import { useAuth } from '../hooks/useAuth';
import { useCart } from '../hooks/useCart';

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
  const [isLoading, setIsLoading] = useState(true);
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [hearts, setHearts] = useState<{ id: number, x: number, y: number }[]>([]);

  const videoContainerRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const heartIdCounter = useRef(0);

  useEffect(() => {
    if (!streamId) return;

    const fetchStreamData = async () => {
      setIsLoading(true);
      try {
        const streamData = await apiService.getLiveStreamById(streamId);
        setStream(streamData);
        if (streamData) {
          const productData = await apiService.getProductById(streamData.featuredProductId);
          setProduct(productData);

          // Add welcome message if it exists
          if (streamData.welcomeMessage) {
              const welcomeMsg: Message = {
                  id: `msg-welcome`,
                  senderId: streamData.seller.id,
                  timestamp: Date.now() - 10000, // Show it slightly before simulated messages
                  text: streamData.welcomeMessage,
                  senderName: streamData.seller.name,
                  senderAvatar: streamData.seller.avatarUrl,
              };
              setChatMessages([welcomeMsg]);
          }
        }
      } catch (error) {
        console.error("Failed to fetch stream data", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStreamData();
  }, [streamId]);
  
  // Chat simulation effect
  useEffect(() => {
    if (stream?.status !== 'ENDED') {
        const interval = setInterval(() => {
            const randomMsg = mockChatMessages[Math.floor(Math.random() * mockChatMessages.length)];
            const newMsg: Message = {
                id: `msg-${Date.now()}`,
                senderId: `user-${Math.random()}`,
                timestamp: Date.now(),
                text: randomMsg.text,
                senderName: randomMsg.name,
                senderAvatar: `https://picsum.photos/seed/${randomMsg.name}/50/50`
            };
            setChatMessages(prev => [...prev, newMsg].slice(-50)); // Keep chat history from growing too large
        }, 5000); // New message every 5 seconds

        return () => clearInterval(interval);
    }
  }, [stream]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    const userMessage: Message = {
        id: `msg-${Date.now()}`,
        senderId: user.id,
        timestamp: Date.now(),
        text: newMessage,
        senderName: user.name,
        senderAvatar: user.avatarUrl
    };
    setChatMessages(prev => [...prev, userMessage]);
    setNewMessage('');
  };

  const handleAddToCart = () => {
    if (product) {
      // FIX: The addToCart function requires 5 arguments: product, quantity, variant, price, and purchaseType.
      const price = product.salePrice || product.price || 0;
      addToCart(product, 1, undefined, price, 'RETAIL');
      // You could show a confirmation message here
    }
  };
  
  const createHeart = (e: React.MouseEvent<HTMLDivElement>) => {
      if (!videoContainerRef.current) return;
      const rect = videoContainerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const newHeart = { id: heartIdCounter.current++, x, y };
      setHearts(prev => [...prev, newHeart]);
      
      setTimeout(() => {
          setHearts(prev => prev.filter(h => h.id !== newHeart.id));
      }, 2000); // Remove heart after 2s
  };


  if (isLoading) {
    return <div className="flex justify-center items-center h-96"><Spinner size="lg" /></div>;
  }

  if (!stream || !product) {
    return <div className="text-center text-2xl text-base-content/70 mt-16">Трансляция не найдена.</div>;
  }
  
  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-10rem)]">
        {/* Main Content */}
        <div className="flex-grow flex flex-col">
            {/* Video Player */}
            <div 
              ref={videoContainerRef}
              onClick={createHeart}
              className="relative aspect-video bg-base-200 rounded-lg overflow-hidden shadow-lg cursor-pointer"
            >
                <video src="https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4" autoPlay muted loop className="w-full h-full object-cover"/>
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent p-4 flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                         <span className={`text-sm font-bold px-3 py-1 rounded-full flex items-center w-fit ${stream.status === 'LIVE' ? 'bg-red-600 animate-pulse' : 'bg-gray-500'} text-white`}>
                          {stream.status === 'LIVE' && (
                            <span className="relative flex h-2 w-2 mr-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                            </span>
                          )}
                          {stream.status}
                       </span>
                        {/* You can add viewer count here */}
                    </div>
                     <div className="flex items-center gap-3">
                      <img src={stream.seller.avatarUrl} alt={stream.seller.name} className="w-12 h-12 rounded-full border-2 border-primary"/>
                      <div>
                          <p className="font-bold text-white text-lg leading-tight">{stream.title}</p>
                          <p className="text-base-content/70">{stream.seller.name}</p>
                      </div>
                   </div>
                </div>
                {/* Floating Hearts */}
                {hearts.map(heart => (
                    <div key={heart.id} className="absolute text-3xl animate-fly-up" style={{ left: heart.x, top: heart.y }}>
                        ❤️
                    </div>
                ))}
            </div>
            
            {/* Featured Product */}
            <div className="bg-base-100 rounded-lg mt-6 p-4 flex flex-col sm:flex-row items-center gap-4">
                <img src={product.imageUrls[0]} alt={product.title} className="w-24 h-24 object-cover rounded-md"/>
                <div className="flex-grow text-center sm:text-left">
                    <p className="text-sm text-base-content/70">Товар в эфире:</p>
                    <Link to={`/product/${product.id}`} className="font-bold text-xl text-white hover:text-primary">{product.title}</Link>
                    <p className="text-lg font-bold text-primary mt-1">{product.price?.toFixed(2)} USDT</p>
                </div>
                <button onClick={handleAddToCart} className="w-full sm:w-auto bg-primary hover:bg-primary-focus text-primary-content font-bold py-3 px-6 rounded-lg transition-colors">
                    Добавить в корзину
                </button>
            </div>
        </div>
        
        {/* Live Chat */}
        <div className="w-full lg:w-96 flex-shrink-0 bg-base-100 rounded-lg flex flex-col h-full shadow-lg">
            <h3 className="text-lg font-bold text-white p-4 border-b border-base-300">Чат трансляции</h3>
            <div className="flex-grow p-4 space-y-4 overflow-y-auto scrollbar-hide">
                {chatMessages.map(msg => (
                     <div key={msg.id} className="flex items-start gap-3">
                         <img src={msg.senderAvatar} alt={msg.senderName} className="w-8 h-8 rounded-full"/>
                         <div>
                            <p className="text-sm font-semibold text-base-content/70">{msg.senderName}</p>
                            <p className="text-white bg-base-200/50 rounded-lg px-3 py-2 text-sm">{msg.text}</p>
                         </div>
                     </div>
                ))}
                <div ref={chatEndRef} />
            </div>
            <div className="p-4 border-t border-base-300">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                    <input 
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Ваше сообщение..."
                        className="flex-grow bg-base-200 border border-base-300 rounded-full py-2 px-4"
                        disabled={stream.status === 'ENDED'}
                    />
                    <button type="submit" className="bg-primary text-primary-content rounded-full p-2.5 hover:bg-primary-focus transition-colors" disabled={stream.status === 'ENDED'}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10.894 2.553a1 1 0 00-1.789 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
                    </button>
                </form>
            </div>
        </div>
    </div>
  );
};

export default LiveStreamPage;