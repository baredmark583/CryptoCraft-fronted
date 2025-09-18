import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { apiService } from '../services/apiService';
import type { Dispute, DisputeMessage, User } from '../types';
import Spinner from '../components/Spinner';
import { cloudinaryService } from '../services/cloudinaryService';

const DisputeMessageBubble: React.FC<{ message: DisputeMessage, authUser: User }> = ({ message, authUser }) => {
    const isOwnMessage = message.senderId === authUser.id;
    const isArbitrator = message.senderId === 'arbitrator-01';
    
    const alignment = isOwnMessage ? 'items-end' : 'items-start';
    const bubbleColor = isOwnMessage ? 'bg-brand-primary' : (isArbitrator ? 'bg-amber-600/80' : 'bg-brand-surface');
    const bubbleStyles = isOwnMessage ? 'rounded-br-none' : 'rounded-bl-none';

    return (
        <div className={`flex flex-col mb-4 ${alignment}`}>
            {!isOwnMessage && (
                 <div className="flex items-center gap-2 mb-1">
                    <img src={message.senderAvatar} alt={message.senderName} className="w-6 h-6 rounded-full"/>
                    <span className="text-sm font-semibold text-brand-text-secondary">{message.senderName} {isArbitrator && ' (Арбитр)'}</span>
                 </div>
            )}
            <div className={`max-w-md px-4 py-3 rounded-2xl ${bubbleColor} ${bubbleStyles}`}>
                {message.imageUrl && (
                    <img src={message.imageUrl} alt="Доказательство" className="rounded-lg max-w-full h-auto my-1 cursor-pointer" onClick={() => window.open(message.imageUrl, '_blank')} />
                )}
                {message.text && (
                     <p className="text-white text-sm leading-relaxed">{message.text}</p>
                )}
                <p className={`text-xs mt-1 ${isOwnMessage ? 'text-stone-200' : 'text-brand-text-secondary'} text-right`}>
                    {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
            </div>
        </div>
    );
};


const DisputeCenterPage: React.FC = () => {
    const { orderId } = useParams<{ orderId: string }>();
    const { user } = useAuth();
    const [dispute, setDispute] = useState<Dispute | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    
    const [newMessage, setNewMessage] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [isSending, setIsSending] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    useEffect(() => {
        if (!orderId) return;
        const fetchDispute = async () => {
            setIsLoading(true);
            try {
                const data = await apiService.getDisputeById(orderId);
                setDispute(data || null);
            } catch (error) {
                console.error("Failed to fetch dispute:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchDispute();
    }, [orderId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [dispute?.messages]);
    
    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!orderId || (!newMessage.trim() && !imageFile)) return;

        setIsSending(true);
        try {
            let imageUrl: string | undefined;
            if (imageFile) {
                imageUrl = await cloudinaryService.uploadImage(imageFile);
            }
            
            const messageContent = {
                senderId: user.id,
                senderName: user.name,
                senderAvatar: user.avatarUrl,
                text: newMessage.trim() || undefined,
                imageUrl,
            };

            const sentMessage = await apiService.addMessageToDispute(orderId, messageContent);

            // Optimistic update might be complex with arbitrator simulation, so we'll just refetch
            const updatedDispute = await apiService.getDisputeById(orderId);
            setDispute(updatedDispute || null);
            
            setNewMessage('');
            setImageFile(null);
            if(fileInputRef.current) fileInputRef.current.value = '';

        } catch (error) {
            console.error("Failed to send message", error);
            alert("Ошибка отправки сообщения");
        } finally {
            setIsSending(false);
        }
    };
    
    if (isLoading) {
        return <div className="flex justify-center items-center h-96"><Spinner /></div>;
    }

    if (!dispute) {
        return <div className="text-center text-xl text-brand-text-secondary">Спор не найден.</div>;
    }
    
    const { order } = dispute;
    const firstItem = order.items[0];

    const statusInfo = {
        'OPEN': { text: 'Спор открыт', color: 'bg-yellow-500/20 text-yellow-300' },
        'UNDER_REVIEW': { text: 'На рассмотрении арбитром', color: 'bg-sky-500/20 text-sky-300' },
        'RESOLVED_BUYER': { text: 'Решен в пользу покупателя', color: 'bg-green-500/20 text-green-300' },
        'RESOLVED_SELLER': { text: 'Решен в пользу продавца', color: 'bg-green-500/20 text-green-300' },
    }[dispute.status];

    return (
        <div className="max-w-6xl mx-auto">
            <h1 className="text-3xl font-bold text-white mb-6">Центр разрешения споров</h1>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Info Panel */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-brand-surface p-4 rounded-lg">
                        <h2 className="text-lg font-bold text-white mb-3">Детали заказа</h2>
                        <div className="flex items-center gap-4">
                            <img src={firstItem.product.imageUrls[0]} alt={firstItem.product.title} className="w-20 h-20 object-cover rounded-md"/>
                            <div>
                                <p className="font-semibold text-white">{firstItem.product.title}</p>
                                <p className="text-sm text-brand-text-secondary">Заказ #{order.id}</p>
                                <p className="text-sm text-brand-text-secondary">Сумма: {order.total.toFixed(2)} USDT</p>
                            </div>
                        </div>
                    </div>
                     <div className="bg-brand-surface p-4 rounded-lg">
                        <h2 className="text-lg font-bold text-white mb-2">Статус спора</h2>
                        <div className={`px-3 py-1.5 rounded-full inline-block text-sm font-semibold ${statusInfo.color}`}>{statusInfo.text}</div>
                    </div>
                    <div className="bg-brand-surface p-4 rounded-lg">
                        <h2 className="text-lg font-bold text-white mb-3">Участники</h2>
                        <ul className="space-y-3">
                            <li className="flex items-center gap-3">
                                <img src={order.buyer.avatarUrl} alt={order.buyer.name} className="w-10 h-10 rounded-full"/>
                                <div>
                                    <p className="font-semibold text-white">{order.buyer.name}</p>
                                    <p className="text-xs text-brand-text-secondary">Покупатель</p>
                                </div>
                            </li>
                            <li className="flex items-center gap-3">
                                <img src={order.seller.avatarUrl} alt={order.seller.name} className="w-10 h-10 rounded-full"/>
                                <div>
                                    <p className="font-semibold text-white">{order.seller.name}</p>
                                    <p className="text-xs text-brand-text-secondary">Продавец</p>
                                </div>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Chat Panel */}
                <div className="lg:col-span-2 bg-brand-surface rounded-lg flex flex-col h-[calc(100vh-15rem)]">
                    <div className="flex-grow p-6 overflow-y-auto bg-brand-background/50 rounded-t-lg">
                        {dispute.messages.map(msg => (
                            <DisputeMessageBubble key={msg.id} message={msg} authUser={user} />
                        ))}
                        <div ref={messagesEndRef} />
                    </div>
                    <div className="p-4 border-t border-brand-border">
                        {imageFile && (
                            <div className="relative w-24 h-24 mb-2 p-1 bg-brand-background rounded-md">
                                <img src={URL.createObjectURL(imageFile)} alt="Preview" className="w-full h-full object-cover rounded"/>
                                <button onClick={() => {setImageFile(null); if(fileInputRef.current) fileInputRef.current.value = '';}} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full h-6 w-6 flex items-center justify-center font-bold">&times;</button>
                            </div>
                        )}
                        <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
                             <input type="file" ref={fileInputRef} onChange={(e) => setImageFile(e.target.files ? e.target.files[0] : null)} className="hidden" accept="image/*" />
                             <button type="button" onClick={() => fileInputRef.current?.click()} className="p-3 text-brand-text-secondary hover:text-white transition-colors rounded-full hover:bg-brand-border">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                                </svg>
                             </button>
                            <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Введите ваше сообщение..."
                                className="flex-grow bg-brand-background border border-brand-border rounded-full py-3 px-4"
                                disabled={isSending}
                            />
                            <button type="submit" disabled={isSending} className="w-24 bg-brand-primary text-white rounded-full p-3 hover:bg-brand-primary-hover transition-colors disabled:bg-gray-500 flex justify-center">
                                {isSending ? <Spinner size="sm"/> : 'Отправить'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DisputeCenterPage;