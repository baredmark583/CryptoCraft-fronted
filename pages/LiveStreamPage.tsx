import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiService } from '../services/apiService';
import type { LiveStream, Product, Message, User } from '../types';
import Spinner from '../components/Spinner';
import { useAuth } from '../hooks/useAuth';
import { useCart } from '../hooks/useCart';
import { useCurrency } from '../hooks/useCurrency';
import DynamicIcon from '../components/DynamicIcon';
import { io, Socket } from 'socket.io-client';

import {
  LiveKitRoom,
  useTracks,
  AudioTrack,
  VideoTrack,
} from '@livekit/components-react';
import '@livekit/components-styles';
import { Track } from 'livekit-client';

const API_BASE_URL = (import.meta as any).env.VITE_API_BASE_URL || 'http://localhost:3001';
// In a real app, this should come from environment variables
const LIVEKIT_URL = 'wss://babak-mm07ebah.livekit.cloud';

interface StreamPlayerProps {
    isSeller: boolean;
    sellerId: string;
    isMuted: boolean;
}

const StreamPlayer: React.FC<StreamPlayerProps> = ({ isSeller, sellerId, isMuted }) => {
    if (isSeller) {
        // The seller should see their own video preview.
        // `useTracks` with `onlySubscribed: false` will also include local tracks. We find the local one.
        const localVideoTrackRef = useTracks(
            [{ source: Track.Source.Camera, withPlaceholder: false }],
            { onlySubscribed: false },
        ).find(ref => ref.participant.isLocal);

        // FIX: Added a check for the 'publication' property to ensure the track reference is not a placeholder, resolving the TypeScript type error.
        if (localVideoTrackRef && localVideoTrackRef.publication) {
            return (
                // Use VideoTrack directly. Mirror the video for a natural self-view.
                <VideoTrack 
                    trackRef={localVideoTrackRef} 
                    style={{ width: '100%', height: '100%', objectFit: 'contain', transform: 'scaleX(-1)' }} 
                />
            );
        }
        
        // Fallback for seller if camera isn't ready
        return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-black text-white">
                <Spinner />
                <p className="mt-4">Подготовка камеры...</p>
            </div>
        );
    }
    
    // Viewer logic: find and show the seller's stream.
    const videoTrackRef = useTracks([Track.Source.Camera])
        .find(ref => ref.participant.identity === sellerId);
    
    const audioTrackRef = useTracks([Track.Source.Microphone])
        .find(ref => ref.participant.identity === sellerId);

    // FIX: Added a check for the 'publication' property to ensure the track reference is not a placeholder, resolving the TypeScript type error.
    if (videoTrackRef && videoTrackRef.publication) {
        return (
            <>
                <VideoTrack trackRef={videoTrackRef} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                {/* FIX: Added a check for the 'publication' property to ensure the track reference is not a placeholder, resolving the TypeScript type error. */}
                {audioTrackRef && audioTrackRef.publication && (
                    <AudioTrack trackRef={audioTrackRef} muted={isMuted} />
                )}
            </>
        );
    }

    // Fallback for viewer when the seller's stream is not yet available.
    return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-black text-white">
            <Spinner />
            <p className="mt-4">Ожидание начала трансляции...</p>
        </div>
    );
};


const LiveStreamPage: React.FC = () => {
    const { streamId } = useParams<{ streamId: string }>();
    const { user, token: authToken } = useAuth();
    const { addToCart } = useCart();
    const { getFormattedPrice } = useCurrency();

    const [stream, setStream] = useState<LiveStream | null>(null);
    const [product, setProduct] = useState<Product | null>(null);
    const [chatMessages, setChatMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [newMessage, setNewMessage] = useState('');
    const [socket, setSocket] = useState<Socket | null>(null);
    
    const [livekitToken, setLivekitToken] = useState<string>('');
    
    const [viewerCount, setViewerCount] = useState(0);
    const [likeCount, setLikeCount] = useState(0);
    const [flyingHearts, setFlyingHearts] = useState<{ id: number }[]>([]);
    const [isMuted, setIsMuted] = useState(true);

    const chatEndRef = useRef<HTMLDivElement>(null);

    const isSeller = !!user && !!stream && user.id === stream.seller.id;
    const isModerator = user?.role === 'SUPER_ADMIN' || user?.role === 'MODERATOR';

    // Fetch initial stream, product data, and LiveKit token for everyone
    useEffect(() => {
        if (!streamId) {
            setIsLoading(false);
            return;
        }
        
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const streamData = await apiService.getLiveStreamById(streamId);
                if (!streamData) throw new Error("Stream not found");
                
                setStream(streamData);
                setLikeCount(streamData.likes || 0);

                if (streamData.featuredProductId) {
                    const productData = await apiService.getProductById(streamData.featuredProductId);
                    setProduct(productData || null);
                }
                
                // Fetch token only if stream is LIVE
                if (streamData.status === 'LIVE') {
                    const { token } = await apiService.getLiveStreamToken(streamId);
                    setLivekitToken(token);
                }

            } catch (error) {
                console.error("Failed to load stream data or token:", error);
                setStream(null); // Clear stream on error
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [streamId]);

    // WebSocket connection for chat & interactivity
    useEffect(() => {
        if (!streamId) return;

        const newSocket = io(API_BASE_URL, {
            query: { token: authToken },
            transports: ['websocket']
        });
        setSocket(newSocket);

        newSocket.on('connect', () => {
            newSocket.emit('joinStreamRoom', streamId);
            newSocket.emit('getStreamStats', streamId);
        });

        newSocket.on('streamUpdate', (data: { likes: number; viewers: number }) => {
            setLikeCount(data.likes);
            setViewerCount(data.viewers);
        });

        newSocket.on('newMessage', (message: Message) => {
            setChatMessages(prev => [...prev.slice(-100), message]);
        });

        newSocket.on('streamEnded', () => {
            setStream(prev => prev ? { ...prev, status: 'ENDED' } : null);
        });

        return () => {
            newSocket.emit('leaveStreamRoom', streamId);
            newSocket.close();
        };
    }, [streamId, authToken]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatMessages]);

    const handleLike = useCallback(() => {
        if (!socket || !streamId) return;
        setLikeCount(prev => prev + 1);
        socket.emit('likeStream', streamId);

        const newHeart = { id: Date.now() };
        setFlyingHearts(prev => [...prev, newHeart]);
        setTimeout(() => {
            setFlyingHearts(prev => prev.filter(h => h.id !== newHeart.id));
        }, 2000);
    }, [socket, streamId]);

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !socket || !streamId || !user) return;
        
        socket.emit('sendMessage', { chatId: streamId, message: { text: newMessage } });
        setNewMessage('');
    };
    
    const handleEndStream = async () => {
        if (!streamId || (!isModerator && !isSeller)) return;
        if (window.confirm('Вы уверены, что хотите завершить этот эфир?')) {
            await apiService.endLiveStream(streamId);
            if(socket) {
                socket.emit('streamEndedBroadcast', { roomId: streamId });
            }
        }
    };

    if (isLoading) return <div className="flex justify-center items-center h-screen bg-base-200"><Spinner size="lg" /></div>;
    if (!stream) return <div className="text-center text-xl text-base-content/70 mt-10">Трансляция не найдена.</div>;

    return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 max-w-7xl mx-auto p-4">
        {/* Main Content: Video + Product */}
        <div className="lg:col-span-2 space-y-4">
            <div className="aspect-video bg-base-200 rounded-lg flex items-center justify-center relative overflow-hidden group">
                 {stream.status !== 'LIVE' ? (
                     <div className="w-full h-full flex items-center justify-center bg-black">
                        <p className="text-white text-2xl font-bold p-4 text-center">
                            {stream.status === 'UPCOMING' && stream.scheduledStartTime ? `Начнется в ${new Date(stream.scheduledStartTime).toLocaleTimeString()}` : 'Трансляция завершена'}
                        </p>
                    </div>
                 ) : !livekitToken ? (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-black text-white">
                        <Spinner />
                        <p className="mt-4">Подключение к эфиру...</p>
                    </div>
                 ) : (
                    <LiveKitRoom
                      video={isSeller}
                      audio={isSeller}
                      token={livekitToken}
                      serverUrl={LIVEKIT_URL}
                      connect={true}
                      data-lk-theme="default"
                      style={{ height: '100%', width: '100%' }}
                    >
                       <StreamPlayer isSeller={isSeller} sellerId={stream.seller.id} isMuted={isMuted} />
                    </LiveKitRoom>
                 )}
                <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/50 to-transparent flex justify-between items-start">
                    <div className="flex items-center gap-4">
                         {stream.status === 'LIVE' && <span className="bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center"><span className="relative flex h-2 w-2 mr-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span></span>LIVE</span>}
                         <div className="flex items-center gap-1.5 text-white bg-black/40 backdrop-blur-sm px-2 py-1 rounded-full text-sm">
                            <DynamicIcon name="livestream-viewers" className="w-5 h-5"/>
                            <span>{viewerCount}</span>
                         </div>
                    </div>
                     {(isSeller || isModerator) && stream.status === 'LIVE' && (
                        <button onClick={handleEndStream} className="btn btn-error btn-sm">Завершить эфир</button>
                    )}
                </div>
                 <div className="absolute bottom-4 right-4 flex flex-col gap-3 items-center">
                    <div className="flex items-center gap-1.5 text-white bg-black/40 backdrop-blur-sm px-3 py-1 rounded-full text-sm">
                       <DynamicIcon name="livestream-heart" className="w-5 h-5"/>
                       <span>{likeCount}</span>
                    </div>
                    <button onClick={handleLike} className="w-12 h-12 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:text-red-500 hover:bg-white/20 transition-colors">
                        <DynamicIcon name="livestream-heart" className="w-7 h-7" />
                    </button>
                    <button onClick={() => setIsMuted(!isMuted)} className="w-12 h-12 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors">
                        {isMuted ? <DynamicIcon name="livestream-sound-off" className="w-7 h-7" /> : <DynamicIcon name="livestream-sound-on" className="w-7 h-7" />}
                    </button>
                </div>
                <div className="absolute bottom-20 right-7">
                    {flyingHearts.map(heart => (
                        <div key={heart.id} className="absolute animate-fly-up text-3xl" style={{ right: `${Math.random() * 20 - 10}px` }}>❤️</div>
                    ))}
                </div>
            </div>
            {product && (
                <div className="bg-base-100 p-4 rounded-lg">
                    <div className="flex flex-col sm:flex-row items-start gap-4">
                        <img src={product.imageUrls[0]} alt={product.title} className="w-24 h-24 object-cover rounded-md"/>
                        <div className="flex-1">
                            <Link to={`/product/${product.id}`} className="font-semibold text-white hover:text-primary text-xl">{product.title}</Link>
                            <p className="text-2xl font-bold text-primary mt-2">{getFormattedPrice(product.price || 0)}</p>
                        </div>
                        <button onClick={() => addToCart(product, 1, undefined, product.price || 0, 'RETAIL')} className="btn btn-primary w-full sm:w-auto">
                            В корзину
                        </button>
                    </div>
                </div>
            )}
        </div>

        {/* Chat */}
        <div className="lg:col-span-1 bg-base-100 rounded-lg flex flex-col h-[calc(100vh-5rem)] lg:h-auto lg:max-h-[calc(100vh-2rem)]">
            <div className="p-4 border-b border-base-300">
                <h3 className="font-bold text-white">Live-чат</h3>
            </div>
            <div className="flex-grow p-4 overflow-y-auto space-y-3">
                {stream.welcomeMessage && <div className="p-2 bg-base-300/50 rounded-md text-sm text-center text-amber-300 italic">{stream.welcomeMessage}</div>}
                {chatMessages.map(msg => (
                    <div key={msg.id} className="group flex gap-2 items-start">
                         <div className="flex-1">
                            <span className={`font-bold text-sm ${msg.sender?.id === user?.id ? 'text-primary' : 'text-base-content'}`}>{msg.sender?.name || 'Гость'}:</span>
                            <span className="text-sm text-base-content/90 ml-2">{msg.text}</span>
                        </div>
                    </div>
                ))}
                <div ref={chatEndRef} />
            </div>
            {stream.status === 'LIVE' && (
                <div className="p-4 border-t border-base-300">
                    <form onSubmit={handleSendMessage}>
                        <fieldset disabled={!user} className="flex gap-2">
                            <input type="text" value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder={user ? "Ваше сообщение..." : "Войдите, чтобы писать в чат"} className="flex-1 input input-bordered input-sm w-full" />
                            <button type="submit" className="btn btn-primary btn-sm btn-square">
                                <DynamicIcon name="send-arrow" className="w-5 h-5" />
                            </button>
                        </fieldset>
                    </form>
                </div>
            )}
        </div>
    </div>
    );
};

export default LiveStreamPage;
