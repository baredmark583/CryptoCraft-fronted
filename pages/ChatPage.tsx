import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { apiService } from '../services/apiService';
import { cloudinaryService } from '../services/cloudinaryService';
import { useAuth } from '../hooks/useAuth';
import type { Chat, Message, MessageContent } from '../types';
import Spinner from '../components/Spinner';
import ChatMessage from '../components/ChatMessage';
import { io, Socket } from 'socket.io-client';
import { useTelegram } from '../hooks/useTelegram';
import ImageModal from '../components/ImageModal';
import './ChatPage.css';

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

  // Force hide the Telegram MainButton as it causes layout issues on this page.
  useEffect(() => {
    if (tg?.MainButton) {
      tg.MainButton.hide();
    }
  }, [tg, chatId]);

  // Socket connection
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
          const messagesWithoutReplies = prevChat.messages.filter(m => m.sender?.id !== 'system');
          return { ...prevChat, messages: [...messagesWithoutReplies, newMessage] };
        }
        return prevChat;
      });
      setChats(prevChats => prevChats.map(c => (newMessage.chat && c.id === newMessage.chat.id) ? {...c, lastMessage: newMessage} : c));
    });

    newSocket.on('typing', ({ userId, isTyping }: { userId: string, isTyping: boolean }) => {
      setTypingUsers(prev => {
        const next = new Set(prev);
        if (isTyping) {
          next.add(userId);
        } else {
          next.delete(userId);
        }
        return Array.from(next);
      });
    });

    return () => {
      newSocket.close();
    };
  }, [token]);

  // Join/leave chat rooms
  useEffect(() => {
    if (socket && chatId) {
      socket.emit('joinChat', chatId);
      return () => {
        socket.emit('leaveChat', chatId);
      };
    }
  }, [socket, chatId]);
  
  // Fetch initial data
  useEffect(() => {
    const fetchChats = async () => {
      setIsLoading(true);
      try {
        const chatData = await apiService.getChats();
        setChats(Array.isArray(chatData) ? chatData : []);
        if (chatId) {
          const currentChat = await apiService.getChatById(chatId);
          setSelectedChat(currentChat);
        } else if (chatData.length > 0 && window.innerWidth >= 992) { // Changed breakpoint to 992px
          navigate(`/chat/${chatData[0].id}`, { replace: true });
        }
      } catch (e) {
        console.error("Failed to fetch chats", e);
        setChats([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchChats();
  }, []);
  
  useEffect(() => {
    const fetchChatDetails = async () => {
      if (chatId && selectedChat?.id !== chatId) {
        setIsLoading(true);
        try {
          const currentChat = await apiService.getChatById(chatId);
          setSelectedChat(currentChat);
          setIsSidebarOpen(false);
        } catch(e) {
          console.error(e)
        } finally {
          setIsLoading(false);
        }
      }
    };
    fetchChatDetails();
  }, [chatId, selectedChat?.id]);

  // Scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'auto', block: 'end' });
    }
  }, [selectedChat?.messages, typingUsers]);
  
  // Handle product context from URL
  useEffect(() => {
    const productId = searchParams.get('productId');
    if (productId && selectedChat && socket) {
      const sendProductContextMessage = async () => {
        try {
          const product = await apiService.getProductById(productId);
          if (product) {
            const productMessageContent: MessageContent = {
              productContext: product,
              text: `Здравствуйте! Меня интересует это объявление.`
            };
            socket.emit('sendMessage', { chatId: selectedChat.id, message: productMessageContent });

            const replies = [
              "Этот товар еще в продаже?",
              "Возможен ли торг?",
              "Какие условия доставки?"
            ];

            const repliesMessage: Message = {
              id: `system-${Date.now()}`,
              sender: { id: 'system' },
              timestamp: Date.now(),
              quickReplies: replies
            };

            setSelectedChat(prev => prev ? { ...prev, messages: [...prev.messages, repliesMessage] } : null);
            searchParams.delete('productId');
            setSearchParams(searchParams, { replace: true });
          }
        } catch (error) {
          console.error("Failed to send product context message", error);
        }
      };
      sendProductContextMessage();
    }
  }, [selectedChat, searchParams, socket, setSearchParams]);

  const handleSend = useCallback((content: MessageContent) => {
    if (!socket || !chatId) return;

    socket.emit('sendMessage', { chatId, message: content });

    if ('text' in content) {
      setMessageText('');
    }
    
    socket.emit('typing', { chatId, isTyping: false });

  }, [socket, chatId]);

  const handleSendTextMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;
    handleSend({ text: messageText });
  };
  
  const debouncedStopTyping = useDebounce(() => {
    if (socket && chatId) {
      socket.emit('typing', { chatId, isTyping: false });
    }
  }, 2000);

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageText(e.target.value);
    if (socket && chatId) {
      socket.emit('typing', { chatId, isTyping: true });
      debouncedStopTyping();
    }
  };

  const handleQuickReplyClick = (replyText: string) => {
    handleSend({ text: replyText });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const imageUrl = await cloudinaryService.uploadImage(file);
    handleSend({ imageUrl });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const filteredChats = chats.filter(chat =>
    chat.participant?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.lastMessage?.text?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const isTyping = typingUsers.length > 0 && selectedChat?.participant && typingUsers.includes(selectedChat.participant.id);

  if (isLoading && !selectedChat) {
    return (
      <div className="flex justify-center items-center h-full">
        <Spinner />
      </div>
    );
  }

  return (
    <>
      <section id="sb-chat" className={`${isSidebarOpen ? 'sidebar-open' : ''}`}>
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
                      if (!chat?.id || !chat.participant?.id || !chat.participant.name) {
                        return null;
                      }
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
                          <button type="button" aria-label="Звонок" className="icon-btn">
                            <img src="https://api.iconify.design/lucide-phone.svg" alt="Звонок" />
                          </button>
                          <button type="button" aria-label="Ещё" className="icon-btn">
                            <img src="https://api.iconify.design/lucide-more-horizontal.svg" alt="Ещё" />
                          </button>
                        </div>
                      </header>
                      <div id="sb-chat-messages" role="log" className="messages">
                        <div className="day-divider">Сегодня</div>
                        {selectedChat.messages.map(message => (
                            <ChatMessage
                              key={message.id}
                              message={message}
                              isOwnMessage={message.sender?.id === user.id}
                              onQuickReplyClick={handleQuickReplyClick}
                              onImageClick={setViewingImage}
                            />
                        ))}
                        {isTyping && (
                          <div className="msg incoming">
                            <div className="bubble">
                                <span className="loading loading-dots loading-sm"></span>
                            </div>
                          </div>
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
                          <button type="button" aria-label="Эмодзи" className="icon-btn">
                            <img src="https://api.iconify.design/lucide-smile.svg" alt="Эмодзи" />
                          </button>
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