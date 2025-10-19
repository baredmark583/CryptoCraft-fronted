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
import { useCurrency } from '../hooks/useCurrency';

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
    const { getFormattedPrice } = useCurrency();
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
                    <p className={`text-sm font-bold ${priceColor}`}>{getFormattedPrice(price)}</p>
                </div>
            </div>
        </Link>
    );
};

const ChatMessage: React.FC<{ message: Message; isOwnMessage: boolean; onImageClick: (url: string) => void }> = ({ message, isOwnMessage, onImageClick }) => {
  const formattedTime = new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className={`flex max-w-[80%] sm:max-w-[70%] ${isOwnMessage ? 'self-end' : 'self-start'}`}>
      <div className={`px-4 py-2 rounded-2xl relative text-sm ${isOwnMessage ? 'bg-primary text-primary-content rounded-br-lg' : 'bg-white border border-amber-200/60 rounded-bl-lg'}`}>
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
                <span className={`text-xs ml-3 ${isOwnMessage ? 'text-amber-900/60' : 'opacity-70'}`}>{formattedTime}</span>
            </>
        ) : (
            <span className={`text-xs ${isOwnMessage ? 'text-amber-900/60' : 'opacity-70'}`}>{formattedTime}</span>
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(!chatId); // Open sidebar if no chat is selected on mobile
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
        if (window.innerWidth < 768) {
             setIsSidebarOpen(true);
        }
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
      <section className="w-full h-full">
        <div className="mx-auto p-0 h-full">
            <div className="w-full h-full bg-white border border-amber-200/80 rounded-2xl flex overflow-hidden shadow-sm relative">
              <aside 
                aria-label="Список чатов" 
                className={`w-full md:w-80 lg:w-96 border-r border-amber-200/80 flex flex-col absolute md:relative inset-y-0 left-0 bg-white z-20 transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
              >
                  <div className="flex items-center justify-between p-4 border-b border-amber-200/80">
                    <span className="text-xl font-bold font-manrope text-amber-900">Сообщения</span>
                    <button type="button" aria-label="Закрыть список" className="p-2 rounded-full hover:bg-amber-100 md:hidden" onClick={() => setIsSidebarOpen(false)}>
                      <img src="https://api.iconify.design/lucide-x.svg" alt="Закрыть" className="w-5 h-5"/>
                    </button>
                  </div>
                  <div className="p-3 border-b border-amber-200/80">
                    <div className="relative">
                      <img src="https://api.iconify.design/lucide-search.svg" alt="Поиск" className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 opacity-50" />
                      <input type="search" placeholder="Поиск в чатах..." className="w-full bg-amber-50/80 border border-amber-200/80 rounded-lg pl-10 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary focus:border-primary" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                    </div>
                  </div>
                  <ul role="listbox" aria-label="Чаты" className="flex-grow overflow-y-auto">
                    {filteredChats.map(chat => {
                      if (!chat?.id || !chat.participant?.id || !chat.participant.name) return null;
                      const { participant, lastMessage } = chat;
                      const lastMessageText = lastMessage?.text || (lastMessage?.imageUrl ? 'Изображение' : 'Нет сообщений');
                      return (
                        <li key={chat.id} role="option" aria-selected={chatId === chat.id} className={`flex items-start gap-3 p-3 cursor-pointer border-b border-amber-100/80 transition-colors ${chatId === chat.id ? 'bg-amber-100' : 'hover:bg-amber-50'}`} onClick={() => navigate(`/chat/${chat.id}`)}>
                            <img src={participant.avatarUrl} alt={`Аватар: ${participant.name}`} className="w-12 h-12 rounded-full object-cover shrink-0"/>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-center">
                                    <span className="font-semibold text-amber-900/90 truncate">{participant.name}</span>
                                    <span className="text-xs text-amber-800/60 shrink-0 ml-2">{lastMessage ? new Date(lastMessage.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit'}) : ''}</span>
                                </div>
                                <span className="text-sm text-amber-800/70 truncate block">{lastMessageText}</span>
                            </div>
                        </li>
                      )
                    })}
                  </ul>
              </aside>
              <main aria-label="Окно чата" className={`flex-1 flex-col h-full bg-amber-50/30 ${!chatId && 'hidden'} md:flex`}>
                  <div aria-hidden={!isSidebarOpen} className="fixed inset-0 bg-black/40 z-10 md:hidden" onClick={() => setIsSidebarOpen(false)}></div>
                   {selectedChat ? (
                    <>
                      <header className="flex items-center gap-3 p-3 border-b border-amber-200/80 bg-white shadow-sm shrink-0">
                        <button type="button" aria-label="Открыть список чатов" className="p-2 rounded-full hover:bg-amber-100 md:hidden" onClick={() => setIsSidebarOpen(true)}>
                          <img src="https://api.iconify.design/lucide-menu.svg" alt="Меню" className="w-5 h-5" />
                        </button>
                        <div className="flex items-center gap-3 min-w-0">
                           <Link to={`/profile/${selectedChat.participant.id}`}>
                            <img src={selectedChat.participant.avatarUrl} alt={`Аватар: ${selectedChat.participant.name}`} className="w-10 h-10 rounded-full object-cover"/>
                          </Link>
                          <div className="min-w-0">
                            <Link to={`/profile/${selectedChat.participant.id}`} className="font-bold text-amber-900 truncate block">{selectedChat.participant.name}</Link>
                            <span className="text-xs text-green-600">В сети</span>
                          </div>
                        </div>
                        <div className="ml-auto">
                          <button type="button" aria-label="Ещё" className="p-2 rounded-full hover:bg-amber-100">
                            <img src="https://api.iconify.design/lucide-more-horizontal.svg" alt="Ещё" className="w-5 h-5"/>
                          </button>
                        </div>
                      </header>
                      <div role="log" className="flex-1 overflow-y-auto p-4 lg:p-6 flex flex-col gap-2">
                        {selectedChat.messages.map(message => (
                            <ChatMessage key={message.id} message={message} isOwnMessage={message.sender?.id === user.id} onImageClick={setViewingImage} />
                        ))}
                        {isTyping && (
                          <div className="flex max-w-[80%] sm:max-w-[70%] self-start"><div className="px-4 py-2 rounded-2xl relative text-sm bg-white border border-amber-200/60 rounded-bl-lg"><span className="loading loading-dots loading-sm"></span></div></div>
                        )}
                        <div ref={messagesEndRef} />
                      </div>
                      <form method="post" action="#send" className="p-3 border-t border-amber-200/80 bg-white shrink-0" onSubmit={handleSendTextMessage}>
                        <div className="flex items-center gap-2">
                          <button type="button" aria-label="Прикрепить файл" className="p-2 rounded-full hover:bg-amber-100" onClick={() => fileInputRef.current?.click()}>
                            <img src="https://api.iconify.design/lucide-paperclip.svg" alt="Прикрепить" className="w-5 h-5"/>
                             <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*"/>
                          </button>
                          <input type="text" value={messageText} onChange={handleTyping} placeholder="Напишите сообщение..." aria-label="Поле ввода сообщения" className="flex-grow bg-amber-50/80 border border-amber-200/80 rounded-full py-2 px-4 outline-none focus:ring-2 focus:ring-primary focus:border-primary" />
                          <button type="submit" className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center shrink-0">
                            <img src="https://api.iconify.design/lucide-send.svg" alt="Отправить" className="w-5 h-5"/>
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