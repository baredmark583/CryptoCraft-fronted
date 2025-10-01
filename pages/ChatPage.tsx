import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { apiService } from '../services/apiService';
import { cloudinaryService } from '../services/cloudinaryService';
import { useAuth } from '../hooks/useAuth';
import type { Chat, Message, MessageContent } from '../types';
import Spinner from '../components/Spinner';
import ChatMessage from '../components/ChatMessage';
import VerifiedBadge from '../components/VerifiedBadge';
import DynamicIcon from '../components/DynamicIcon';
import { io, Socket } from 'socket.io-client';
import { useTelegram } from '../hooks/useTelegram';

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
      query: { token },
      transports: ['websocket']
    });
    setSocket(newSocket);
    
    newSocket.on('connect', () => console.log('Connected to WebSocket server'));
    newSocket.on('disconnect', () => console.log('Disconnected from WebSocket server'));

    newSocket.on('newMessage', (newMessage: Message) => {
      setSelectedChat(prevChat => {
        if (prevChat && newMessage.chat && prevChat.id === newMessage.chat.id) {
          const messagesWithoutReplies = prevChat.messages.filter(m => m.senderId !== 'system');
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
        } else if (chatData.length > 0 && window.innerWidth >= 768) {
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
        } catch(e) {
          console.error(e)
        } finally {
          setIsLoading(false);
        }
      }
    };
    fetchChatDetails();
  }, [chatId]);

  // Scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
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
              senderId: 'system',
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

    // TODO: Добавь transformation в cloudinaryService для thumbnail, напр. { width: 300, crop: 'limit' }
    const imageUrl = await cloudinaryService.uploadImage(file);
    handleSend({ imageUrl });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const isTyping = typingUsers.length > 0 && selectedChat?.participant && typingUsers.includes(selectedChat.participant.id);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="flex flex-1 bg-base-100 text-base-content font-sans h-screen md:h-auto">
      {/* Chat List */}
      <div className={`w-full md:w-[360px] border-r border-base-300 ${chatId ? 'hidden md:flex' : 'flex'} flex-col flex-1 h-full`}>
        <div className="p-4 border-b border-base-300 bg-base-200">
          <h2 className="text-xl font-semibold text-base-content">Сообщения</h2>
        </div>
        <ul className="menu p-0 flex-1 overflow-y-auto h-full">
          {chats.length > 0 ? (
            chats.map(chat => {
                if (!chat?.id || !chat.participant?.id || !chat.participant.name) {
                  console.warn("Skipping render for malformed chat object:", chat);
                  return null;
                }
                const participant = chat.participant;
                const lastMessage = chat.lastMessage;
                const lastMessageText = lastMessage?.text || (lastMessage?.imageUrl ? 'Изображение' : 'Нет сообщений');

                return (
                  <li key={chat.id} onClick={() => navigate(`/chat/${chat.id}`)} className={chatId === chat.id ? 'active' : ''}>
                    <a className="flex items-center p-3">
                      <div className="avatar">
                        <div className="w-12 rounded-full">
                          <img src={participant.avatarUrl || 'https://via.placeholder.com/100'} alt={participant.name || 'Пользователь'} />
                        </div>
                      </div>
                      <div className="flex-grow overflow-hidden ml-3">
                        <p className="font-semibold truncate">{participant.name || 'Удаленный пользователь'}</p>
                        <p className="text-sm truncate opacity-70">{lastMessageText}</p>
                      </div>
                    </a>
                  </li>
                )
            })
          ) : (
            <div className="p-4 text-center opacity-70">У вас пока нет чатов.</div>
          )}
        </ul>
      </div>

      {/* Message Area */}
      <div className={`w-full md:flex-1 flex flex-col h-full overflow-hidden ${chatId ? 'flex' : 'hidden md:flex'}`}>
        {selectedChat ? (
          <>
            {/* Header */}
            <div className="p-3 border-b border-base-300 bg-base-200 flex items-center shadow-sm flex-shrink-0">
              <button
                onClick={() => navigate('/chat')}
                className="btn btn-ghost btn-square md:hidden mr-2"
                aria-label="Вернуться к списку чатов"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              {selectedChat.participant && selectedChat.participant.id && (
                <Link to={`/profile/${selectedChat.participant.id}`} className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="avatar">
                    <div className="w-10 rounded-full">
                      <img src={selectedChat.participant.avatarUrl || 'https://via.placeholder.com/100'} alt={selectedChat.participant.name || 'Пользователь'}/>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 overflow-hidden">
                    <span className="text-lg font-semibold hover:underline truncate">
                      {selectedChat.participant.name || 'Удаленный пользователь'}
                    </span>
                    <VerifiedBadge level={selectedChat.participant.verificationLevel} />
                  </div>
                </Link>
              )}
            </div>

            {/* Messages Wrapper */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-base-200 min-h-0">
                {selectedChat.messages.map(message => (
                  <ChatMessage
                    key={message.id}
                    message={message}
                    isOwnMessage={message.senderId === user.id}
                    onQuickReplyClick={handleQuickReplyClick}
                  />
                ))}
                {isTyping && (
                  <div className="chat chat-start">
                    <div className="chat-bubble">
                      <span className="loading loading-dots loading-sm"></span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Input - Sticky bottom */}
            <div className="flex-shrink-0 p-2 sm:p-4 bg-base-100 border-t border-base-300 sticky bottom-0 z-10 mb-16 md:mb-0">
              <form onSubmit={handleSendTextMessage} className="flex items-center gap-1 sm:gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  className="hidden"
                  accept="image/*"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="btn btn-ghost btn-circle"
                  aria-label="Прикрепить файл"
                >
                  <DynamicIcon name="attachment-clip" className="w-6 h-6" fallback={
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01.01-.01z"/>
                    </svg>
                  }/>
                </button>
                <div className="form-control flex-grow">
                   <input
                    type="text"
                    value={messageText}
                    onChange={handleTyping}
                    placeholder="Напишите сообщение..."
                    className="input input-bordered w-full"
                  />
                </div>
                <button
                  type="submit"
                  className="btn btn-primary btn-circle"
                  aria-label="Отправить сообщение"
                >
                  <DynamicIcon name="send-arrow" className="w-5 h-5" fallback={
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M3.105 2.289a.75.75 0 00-.826.95l1.414 4.949a.75.75 0 00.95.54l3.123-.93a.75.75 0 01.928.928l-.93 3.123a.75.75 0 00.54.95l4.95 1.414a.75.75 0 00.95-.826l-2.434-8.518a.75.75 0 00-.702-.556l-8.518-2.434z" />
                    </svg>
                  }/>
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-grow flex items-center justify-center bg-base-200">
            <p className="opacity-70">Выберите чат, чтобы начать общение</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPage;