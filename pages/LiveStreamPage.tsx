import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiService } from '../services/apiService';
import type { LiveStream, Product, Message, User } from '../types';
import Spinner from '../components/Spinner';
import { useAuth } from '../hooks/useAuth';
import { useCart } from '../hooks/useCart';
import DynamicIcon from '../components/DynamicIcon';
import { io, Socket } from 'socket.io-client';

import {
  LiveKitRoom,
  ParticipantTile,
  ControlBar,
  useParticipants,
  useTracks,
  GridLayout,
} from '@livekit/components-react';
import '@livekit/components-styles';
import { Track } from 'livekit-client';


const API_BASE_URL = (import.meta as any).env.VITE_API_BASE_URL || 'http://localhost:3001';
const LIVEKIT_URL = (import.meta as any).env.VITE_LIVEKIT_URL;

const LiveVideoDisplay: React.FC<{ isSeller: boolean }> = ({ isSeller }) => {
    // We get all participants in the room, including the local one.
    const participants = useParticipants();
    
    // If we are the seller, we want to be the main participant on screen.
    // If we are a viewer, we want the seller (the one publishing video) to be the main participant.
    const mainParticipant = isSeller 
        ? participants.find(p => p.isLocal) 
        : participants.find(p => p.isCameraEnabled);

    if (mainParticipant) {
        return (
            <div className="w-full h-full">
                <ParticipantTile participant={mainParticipant} />
            </div>
        )
    }

    return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-black text-white">
            <Spinner />
            <p className="mt-4">{isSeller ? 'Подключаем вашу камеру...' : 'Ожидание трансляции от продавца...'}</p>
        </div>
    );
};


const LiveStreamPage: React.FC = () => {
    const { streamId } = useParams<{ streamId: string }>();
    const { user, token: authToken } = useAuth();
    const { addToCart } = useCart();

    const [stream, setStream] = useState<LiveStream | null>(null);
    const [product, setProduct] = useState<Product | null>(null);
    const [chatMessages, setChatMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [newMessage, setNewMessage] = useState('');
    const [socket, setSocket] = useState<Socket | null>(null);
    const [livekitToken, setLivekitToken] = useState<string>('');
    
    const chatEndRef = useRef<HTMLDivElement>(null);
    const isSeller = user && stream && user.id === stream.seller.id;
    const isModerator = user?.role === 'SUPER_ADMIN' || user?.role === 'MODERATOR';

    // Fetch stream and product data
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
    
    // Fetch LiveKit token
    useEffect(() => {
        if (streamId && user) {
            apiService.getLiveStreamToken(streamId)
                .then(data => setLivekitToken(data.token))
                .catch(err => console.error("Failed to get livestream token", err));
        }
    }, [streamId, user]);


    // Setup WebSocket connection for chat
    useEffect(() => {
        if (!streamId) return;

        const newSocket = io(API_BASE_URL, {
            query: { token: authToken },
            transports: ['websocket']
        });
        setSocket(newSocket);

        newSocket.on('connect', () => {
            console.log('Connected to WebSocket for live stream chat');
            newSocket.emit('joinChat', streamId);
        });

        newSocket.on('newMessage', (message: Message) => {
            setChatMessages(prev => [...prev, message]);
        });
        
        newSocket.on('messageDeleted', ({ messageId }: { messageId: string }) => {
            setChatMessages(prev => prev.filter(m => m.id !== messageId));
        });

        newSocket.on('streamEnded', () => {
            setStream(prev => prev ? { ...prev, status: 'ENDED' } : null);
        });

        return () => {
            newSocket.emit('leaveChat', streamId);
            newSocket.close();
        };
    }, [streamId, authToken]);

    // Scroll chat to bottom
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatMessages]);

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !socket || !streamId) return;
        
        socket.emit('sendMessage', {
            chatId: streamId,
            message: { text: newMessage }
        });
        setNewMessage('');
    };

    const handleDeleteMessage = (messageId: string) => {
        if (!socket || !streamId || !isModerator) return;
        socket.emit('deleteMessage', { roomId: streamId, messageId });
    };

    const handleEndStream = async () => {
        if (!streamId || (!isModerator && !isSeller)) return;
        if (window.confirm('Вы уверены, что хотите завершить этот эфир?')) {
            try {
                const endedStream = await apiService.endLiveStream(streamId);
                setStream(endedStream);
                if (socket) {
                    socket.emit('streamEndedBroadcast', { roomId: streamId });
                }
            } catch (error) {
                console.error('Failed to end stream', error);
                alert('Не удалось завершить трансляцию.');
            }
        }
    };


    if (isLoading) return <div className="flex justify-center items-center h-96"><Spinner /></div>;
    if (!stream) return <div className="text-center text-xl text-base-content/70">Трансляция не найдена.</div>;

    const renderVideo = () => {
        if (stream.status !== 'LIVE') {
            return (
                <div className="w-full h-full flex items-center justify-center bg-black">
                    <p className="text-white text-2xl font-bold">
                        {stream.status === 'UPCOMING' ? `Начнется в ${new Date(stream.scheduledStartTime || 0).toLocaleTimeString()}` : 'Трансляция завершена'}
                    </p>
                </div>
            );
        }
        
        if (!livekitToken || !LIVEKIT_URL) {
            return (
                <div className="w-full h-full flex items-center justify-center bg-black text-white">
                    <Spinner />
                    <p className="ml-4">Подключаемся к эфиру...</p>
                </div>
            );
        }

        return (
            <LiveKitRoom
              video={isSeller}
              audio={isSeller}
              token={livekitToken}
              serverUrl={LIVEKIT_URL}
              connect={true}
              data-lk-theme="default"
              style={{ height: '100%', width: '100%' }}
            >
                <LiveVideoDisplay isSeller={isSeller} />
                {(isSeller || isModerator) && <ControlBar />}
            </LiveKitRoom>
        )
    };


    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
            {/* Video Player & Product */}
            <div className="lg:col-span-2 space-y-6">
                <div className="aspect-video bg-base-200 rounded-lg flex items-center justify-center relative overflow-hidden">
                    {renderVideo()}
                    {stream.status === 'LIVE' && <span className="absolute top-4 left-4 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center"><span className="relative flex h-2 w-2 mr-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span></span>LIVE</span>}
                    {(isSeller || isModerator) && stream.status === 'LIVE' && (
                        <button onClick={handleEndStream} className="btn btn-error btn-sm absolute top-4 right-4">Завершить эфир</button>
                    )}
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
                        <div key={msg.id} className="group flex gap-2 items-start">
                             <div className="flex-1">
                                <span className={`font-bold text-sm ${msg.sender?.id === user.id ? 'text-primary' : 'text-base-content'}`}>{msg.sender?.name || 'Гость'}:</span>
                                <span className="text-sm text-base-content/90 ml-2">{msg.text}</span>
                            </div>
                             {isModerator && msg.sender?.id !== 'system' && (
                                <button onClick={() => handleDeleteMessage(msg.id)} className="opacity-0 group-hover:opacity-100 text-red-500 text-xs">&times;</button>
                             )}
                        </div>
                    ))}
                    <div ref={chatEndRef} />
                </div>
                {stream.status === 'LIVE' && (
                    <div className="p-4 border-t border-base-300">
                        <form onSubmit={handleSendMessage} className="flex gap-2">
                            <input type="text" value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="Ваше сообщение..." className="flex-1 bg-base-200 border border-base-300 rounded-full py-2 px-4 text-sm" />
                            <button type="submit" className="p-2 bg-primary rounded-full text-white">
                                <DynamicIcon name="send-arrow" className="w-5 h-5" />
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LiveStreamPage;