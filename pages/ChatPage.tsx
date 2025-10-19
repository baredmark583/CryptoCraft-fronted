import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { apiService } from '../services/apiService';
import { cloudinaryService } from '../services/cloudinaryService';
import { useAuth } from '../hooks/useAuth';
import type { Chat, Message, MessageContent, Product } from '../types';
import Spinner from '../components/Spinner';
import { io, Socket } from 'socket.io-client';
import { useTelegram } from '../hooks/useTelegram';
import ImageModal from '../components/ImageModal';

const API_BASE_URL = (import.meta as any).env.VITE_API_BASE_URL || 'http://localhost:3001';

// Debounce hook
const useDebounce = (callback: (...args: any[]) => void, delay: number) => {
  const timeoutRef = useRef<number | null>(null);
  return (...args: any[]) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = window.setTimeout(() => {
      callback(...args);
    }, delay);
  };
};

const ProductContextCard: React.FC<{ product: Product, isOwnMessage: boolean }> = ({ product, isOwnMessage }) => {
    const price = product.price || 0;
    const bgColor = isOwnMessage ? 'bg-white/10 hover:bg-white/20' : 'bg-black/5 hover:bg-black/10';
    const textColor = isOwnMessage ? 'text-white' : 'text-inherit';
    const priceColor = isOwnMessage ? 'text-amber-300' : 'text-primary';

    return (
        <Link to={`/product/${product.id}`} className={`block p-2 rounded-lg transition-colors mb-2 ${bgColor}`}>
            <div className="flex items-center gap-3">
                <img src={product.imageUrls[0]} alt={product.title} className="w-12 h-12 rounded-md object-cover" />
                <div className="overflow-hidden">
                    <p className={`font-semibold truncate ${textColor}`}>{product.title}</p>
                    <p className={`text-sm font-bold ${priceColor}`}>{price.toLocaleString()} USDT</p>
                </div>
            </div>
        </Link>
    );
};

const ChatMessage: React.FC<{ message: Message; isOwnMessage: boolean; onImageClick: (url: string) => void }> = ({ message, isOwnMessage, onImageClick }) => {
  const formattedTime = new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className={`msg ${isOwnMessage ? 'outgoing' : 'incoming'}`}>
      <div className="bubble">
        {message.productContext && <ProductContextCard product={message.productContext} isOwnMessage={isOwnMessage} />}
        {message.imageUrl && (
            <img 
              src={message.imageUrl} 
              alt="Прикрепленное изображение" 
              className="rounded-lg max-w-[200px] h-auto my-1 cursor-pointer" 
              onClick={() => onImageClick(message.imageUrl)}
            />
        )}
        {message.text ? (
            <>
                {message.text}
                <span className="time">{formattedTime}</span>
            </>
        ) : (
            <span className="time">{formattedTime}</span>
        )}
      </div>
    </div>
  );
};


const ChatPage: React.FC = () => {
  const { chatId } = useParams<{ chatId?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const { tg } = useTelegram();

  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [messageText, setMessageText] = useState('');
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [socket, setSocket] = useState<Socket | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (tg?.MainButton) {
      tg.MainButton.hide();
    }
  }, [tg, chatId]);

  useEffect(() => {
    const newSocket = io(API_BASE_URL, {
      auth: { token },
      // @ts-ignore
      transports: ['websocket'],
    });
    setSocket(newSocket);
    
    newSocket.on('connect', () => console.log('Connected to WebSocket server'));
    newSocket.on('disconnect', () => console.log('Disconnected from WebSocket server'));

    newSocket.on('newMessage', (newMessage: Message) => {
      setSelectedChat(prevChat => {
        if (prevChat && newMessage.chat && prevChat.id === newMessage.chat.id) {
          return { ...prevChat, messages: [...prevChat.messages, newMessage] };
        }
        return prevChat;
      });
      setChats(prevChats => prevChats.map(c => (newMessage.chat && c.id === newMessage.chat.id) ? {...c, lastMessage: newMessage} : c));
    });

    newSocket.on('typing', ({ userId, isTyping }: { userId: string, isTyping: boolean }) => {
      setTypingUsers(prev => {
        const next = new Set(prev);
        if (isTyping) next.add(userId);
        else next.delete(userId);
        return Array.from(next);
      });
    });

    return () => { newSocket.close(); };
  }, [token]);

  useEffect(() => {
    if (socket && chatId) {
      socket.emit('joinChat', chatId);
      return () => { socket.emit('leaveChat', chatId); };
    }
  }, [socket, chatId]);
  
  useEffect(() => {
    const fetchChats = async () => {
      setIsLoading(true);
      try {
        const chatData = await apiService.getChats();
        setChats(Array.isArray(chatData) ? chatData : []);
      } catch (e) { console.error("Failed to fetch chats", e); setChats([]); } 
      finally { setIsLoading(false); }
    };
    fetchChats();
  }, []);
  
  useEffect(() => {
    const fetchChatDetails = async () => {
      if (chatId) {
        setIsLoading(true);
        try {
          const currentChat = await apiService.getChatById(chatId);
          setSelectedChat(currentChat);
          setIsSidebarOpen(false);
        } catch(e) { console.error(e) } 
        finally { setIsLoading(false); }
      } else {
        setSelectedChat(null);
      }
    };
    fetchChatDetails();
  }, [chatId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedChat?.messages, typingUsers]);
  
  const handleSend = useCallback((content: MessageContent) => {
    if (!socket || !chatId) return;
    socket.emit('sendMessage', { chatId, message: content });
    if ('text' in content) setMessageText('');
    socket.emit('typing', { chatId, isTyping: false });
  }, [socket, chatId]);

  const handleSendTextMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;
    handleSend({ text: messageText });
  };
  
  const debouncedStopTyping = useDebounce(() => {
    if (socket && chatId) socket.emit('typing', { chatId, isTyping: false });
  }, 2000);

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageText(e.target.value);
    if (socket && chatId) {
      socket.emit('typing', { chatId, isTyping: true });
      debouncedStopTyping();
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const imageUrl = await cloudinaryService.uploadImage(file);
    handleSend({ imageUrl });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };
  
  const filteredChats = chats.filter(chat =>
    chat.participant?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.lastMessage?.text?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const isTyping = typingUsers.length > 0 && selectedChat?.participant && typingUsers.includes(selectedChat.participant.id);

  if (isLoading && !selectedChat) {
    return <div className="flex justify-center items-center h-full"><Spinner /></div>;
  }

  return (
    <>
      <section id="sb-chat" className={`w-full h-full ${isSidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="chat-container">
            <div className="chat-card">
              <aside aria-label="Список чатов" className="chat-sidebar">
                  <div className="sidebar-head">
                    <span className="sidebar-title">Сообщения</span>
                    <button type="button" aria-label="Закрыть список" className="icon-btn sidebar-close" onClick={() => setIsSidebarOpen(false)}>
                      <img src="https://api.iconify.design/lucide-x.svg" alt="Закрыть" />
                    </button>
                  </div>
                  <div className="sidebar-search">
                    <div className="search-field">
                      <img src="https://api.iconify.design/lucide-search.svg" alt="Поиск" />
                      <input type="search" placeholder="Поиск в чатах..." className="search-input" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                    </div>
                  </div>
                  <ul role="listbox" aria-label="Чаты" className="chat-list">
                    {filteredChats.map(chat => {
                      if (!chat?.id || !chat.participant?.id || !chat.participant.name) return null;
                      const { participant, lastMessage } = chat;
                      const lastMessageText = lastMessage?.text || (lastMessage?.imageUrl ? 'Изображение' : 'Нет сообщений');
                      return (
                        <li key={chat.id} role="option" aria-selected={chatId === chat.id} className={`chat-item ${chatId === chat.id ? 'is-active' : ''}`} onClick={() => navigate(`/chat/${chat.id}`)}>
                            <img src={participant.avatarUrl} alt={`Аватар: ${participant.name}`} className="avatar"/>
                            <div className="item-main">
                                <div className="item-top">
                                    <span className="item-name">{participant.name}</span>
                                    <span className="item-time">{lastMessage ? new Date(lastMessage.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit'}) : ''}</span>
                                </div>
                                <span className="item-preview">{lastMessageText}</span>
                            </div>
                        </li>
                      )
                    })}
                  </ul>
              </aside>
              <main aria-label="Окно чата" className="chat-main">
                  <div id="sb-chat-overlay" aria-hidden={!isSidebarOpen} className="overlay" onClick={() => setIsSidebarOpen(false)}></div>
                   {selectedChat ? (
                    <>
                      <header className="chat-header">
                        <button type="button" id="sb-chat-open" aria-label="Открыть список чатов" className="icon-btn mobile-toggle" onClick={() => setIsSidebarOpen(true)}>
                          <img src="https://api.iconify.design/lucide-menu.svg" alt="Меню" />
                        </button>
                        <div className="peer">
                           <Link to={`/profile/${selectedChat.participant.id}`}>
                            <img src={selectedChat.participant.avatarUrl} alt={`Аватар: ${selectedChat.participant.name}`} />
                          </Link>
                          <div className="peer-meta">
                            <Link to={`/profile/${selectedChat.participant.id}`} className="peer-name">{selectedChat.participant.name}</Link>
                            <span className="peer-status">В сети</span>
                          </div>
                        </div>
                        <div className="header-actions">
                          <button type="button" aria-label="Ещё" className="icon-btn">
                            <img src="https://api.iconify.design/lucide-more-horizontal.svg" alt="Ещё" />
                          </button>
                        </div>
                      </header>
                      <div id="sb-chat-messages" role="log" className="messages">
                        {selectedChat.messages.map(message => (
                            <ChatMessage key={message.id} message={message} isOwnMessage={message.sender?.id === user.id} onImageClick={setViewingImage} />
                        ))}
                        {isTyping && (
                          <div className="msg incoming"><div className="bubble"><span className="loading loading-dots loading-sm"></span></div></div>
                        )}
                        <div ref={messagesEndRef} />
                      </div>
                      <form method="post" id="sb-chat-composer" action="#send" className="composer" onSubmit={handleSendTextMessage}>
                        <div className="field">
                          <button type="button" aria-label="Прикрепить файл" className="icon-btn" onClick={() => fileInputRef.current?.click()}>
                            <img src="https://api.iconify.design/lucide-paperclip.svg" alt="Прикрепить" />
                             <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*"/>
                          </button>
                          <input type="text" value={messageText} onChange={handleTyping} placeholder="Напишите сообщение..." aria-label="Поле ввода сообщения" />
                          <button type="submit" className="send-btn">
                            <img src="https://api.iconify.design/lucide-send.svg" alt="Отправить" />
                          </button>
                        </div>
                      </form>
                    </>
                   ) : (
                    <div className="flex-grow flex items-center justify-center">
                        <p className="opacity-70">Выберите чат, чтобы начать общение</p>
                    </div>
                   )}
              </main>
            </div>
        </div>
      </section>
      {viewingImage && <ImageModal imageUrl={viewingImage} onClose={() => setViewingImage(null)} />}
    </>
  );
};

export default ChatPage;