import React, { useState, useEffect, useRef, useMemo } from 'react';
// FIX: Upgraded to react-router-dom v6.
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { apiService } from '../services/apiService';
import { cloudinaryService } from '../services/cloudinaryService';
import { useAuth } from '../hooks/useAuth';
import type { Chat, Message, MessageContent } from '../types';
import Spinner from '../components/Spinner';
import ChatMessage from '../components/ChatMessage';
import VerifiedBadge from '../components/VerifiedBadge';
import { useTelegramBackButton } from '../hooks/useTelegram';
import DynamicIcon from '../components/DynamicIcon';

const ChatPage: React.FC = () => {
  const { chatId } = useParams<{ chatId?: string }>();
  // FIX: Using useSearchParams from react-router-dom v6.
  const [searchParams, setSearchParams] = useSearchParams();

  const { user } = useAuth();
  // FIX: Upgraded react-router-dom v6. Replaced useHistory with useNavigate.
  const navigate = useNavigate();

  useTelegramBackButton(!!chatId);

  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [messageText, setMessageText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchChats = async () => {
      setIsLoading(true);
      // FIX: apiService.getChats expects 0 arguments. The user is identified by the auth token on the backend.
      const chatData = await apiService.getChats();
      setChats(chatData);
      if (chatId) {
        // FIX: apiService.getChatById expects 1 argument. The user is identified by the auth token on the backend.
        const currentChat = await apiService.getChatById(chatId);
        setSelectedChat(currentChat || null);
      } else if (chatData.length > 0 && window.innerWidth >= 640) { // On desktop, select first chat
        const firstChatId = chatData[0].id;
        navigate(`/chat/${firstChatId}`, { replace: true });
      }
      setIsLoading(false);
    };

    fetchChats();
  }, [user.id]); // Removed chatId and navigate to prevent re-fetching on navigation

  useEffect(() => {
    const fetchChatDetails = async () => {
        if (chatId && selectedChat?.id !== chatId) {
            setIsLoading(true);
            // FIX: apiService.getChatById expects 1 argument. The user is identified by the auth token on the backend.
            const currentChat = await apiService.getChatById(chatId);
            setSelectedChat(currentChat || null);
            setIsLoading(false);
        }
    };
    fetchChatDetails();
  }, [chatId, selectedChat?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedChat?.messages]);

  // Effect to send product context when a chat is opened from a product page
  useEffect(() => {
    const productId = searchParams.get('productId');
    if (productId && selectedChat) {
        const sendProductContextMessage = async () => {
            try {
                const product = await apiService.getProductById(productId);
                if (product) {
                    // Message from user with product context
                    const productMessageContent: MessageContent = {
                        productContext: product,
                        text: `Здравствуйте! Меня интересует это объявление.`
                    };
                    // FIX: apiService.sendMessage expects 2 arguments. The sender ID is handled by the backend.
                    const productMessage = await apiService.sendMessage(selectedChat.id, productMessageContent);

                    // Generate contextual quick replies based on product category
                    let replies: string[];
                    switch (product.category) {
                        case 'Автомобили':
                            replies = [
                                "Автомобиль еще в продаже?",
                                "Когда можно посмотреть?",
                                "Возможен ли торг?"
                            ];
                            break;
                        case 'Цифровые товары':
                             replies = [
                                "Файл еще доступен?",
                                "В каком формате вы предоставляете файл?",
                                "Можно использовать в коммерческих целях?"
                            ];
                            break;
                        case 'Электроника':
                            replies = [
                                "Устройство еще в продаже?",
                                "Есть ли гарантия?",
                                "Полный ли комплект?"
                            ];
                            break;
                        default:
                            replies = [
                                "Этот товар еще в продаже?",
                                "Возможен ли торг?",
                                "Какие условия доставки?"
                            ];
                    }

                    const quickRepliesContent: MessageContent = {
                        quickReplies: replies
                    };
                    // FIX: The backend does not support creating system messages.
                    // The quick replies message is constructed locally and added to the state for display.
                    const repliesMessage: Message = {
                        id: `system-${Date.now()}`,
                        senderId: 'system',
                        timestamp: Date.now(),
                        ...quickRepliesContent
                    };

                    setSelectedChat(prev => prev ? {...prev, messages: [...prev.messages, productMessage, repliesMessage]} : null);

                    // FIX: Use setSearchParams to clean URL params with react-router-dom v6.
                    searchParams.delete('productId');
                    setSearchParams(searchParams, { replace: true });
                }
            } catch (error) {
                console.error("Failed to send product context message", error);
            }
        };
        sendProductContextMessage();
    }
}, [selectedChat, searchParams, user.id, setSearchParams]);
  
  const handleSend = async (content: MessageContent) => {
      if (!selectedChat) return;

      const tempId = `temp-${Date.now()}`;
      const tempMessage: Message = { ...content, id: tempId, senderId: user.id, timestamp: Date.now() };

      // Optimistic update
      setSelectedChat(prev => {
          if (!prev) return null;
          // Remove previous system message with quick replies if user interacts
          const messagesWithoutReplies = prev.messages.filter(m => !m.quickReplies);
          return { ...prev, messages: [...messagesWithoutReplies, tempMessage] };
      });
      
      if ('text' in content) {
          setMessageText('');
      }

      try {
        // FIX: apiService.sendMessage expects 2 arguments. The sender ID is handled by the backend.
        const sentMessage = await apiService.sendMessage(selectedChat.id, content);
        setSelectedChat(prev => prev ? {
            ...prev, 
            messages: prev.messages.map(m => m.id === tempId ? sentMessage : m)
        } : null);
      } catch (error) {
        console.error("Failed to send message", error);
        setSelectedChat(prev => prev ? {
            ...prev,
            messages: prev.messages.filter(m => m.id !== tempId)
        } : null);
      }
  };

  const handleSendTextMessage = (e: React.FormEvent) => {
      e.preventDefault();
      if (!messageText.trim()) return;
      handleSend({ text: messageText });
  };

  const handleQuickReplyClick = (replyText: string) => {
    handleSend({ text: replyText });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Simulate upload to get a URL. In a real app, you might show a loading state on the message.
      const imageUrl = await cloudinaryService.uploadImage(file);
      handleSend({ imageUrl });

      if (fileInputRef.current) {
          fileInputRef.current.value = ''; // Reset file input
      }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-96"><Spinner /></div>;
  }

  return (
    <div className="flex h-[calc(100vh-10rem)] bg-base-100 sm:rounded-lg sm:shadow-xl overflow-hidden">
      {/* Chat List (hidden on mobile when a chat is open) */}
      <div className={`w-full sm:w-1/3 border-r border-base-300 overflow-y-auto ${chatId ? 'hidden sm:block' : 'block'}`}>
        <div className="p-4 border-b border-base-300">
          <h2 className="text-xl font-bold text-white">Сообщения</h2>
        </div>
        {chats.length > 0 ? (
            <ul>
            {chats.map(chat => (
                <li key={chat.id} onClick={() => navigate(`/chat/${chat.id}`)}
                className={`p-4 flex items-center cursor-pointer transition-colors ${selectedChat?.id === chat.id ? 'bg-primary/20' : 'hover:bg-base-300/50'}`}>
                <img src={chat.participant?.avatarUrl} alt={chat.participant?.name} className="w-12 h-12 rounded-full mr-4 bg-base-300" />
                <div className="flex-grow overflow-hidden">
                    <p className="font-semibold text-white truncate">{chat.participant?.name || 'Чат'}</p>
                    <p className="text-sm text-base-content/70 truncate">{chat.lastMessage?.text}</p>
                </div>
                </li>
            ))}
            </ul>
        ) : (
            <div className="p-4 text-center text-base-content/70">У вас пока нет чатов.</div>
        )}
      </div>

      {/* Message Area (hidden on mobile if no chat is selected) */}
      <div className={`w-full sm:w-2/3 flex-col ${chatId ? 'flex' : 'hidden sm:flex'}`}>
        {selectedChat ? (
          <>
            <div className="p-4 border-b border-base-300 flex items-center">
                <button onClick={() => navigate('/chat')} className="sm:hidden mr-2 p-1 text-base-content/70 hover:text-white">
                    <DynamicIcon name="back-arrow" className="w-6 h-6" fallback={
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                       </svg>
                    }/>
                </button>
                <Link to={selectedChat.participant ? `/profile/${selectedChat.participant.id}` : '/chat'}>
                    <img src={selectedChat.participant?.avatarUrl} alt={selectedChat.participant?.name} className="w-10 h-10 rounded-full mr-3 bg-base-300" />
                </Link>
                <div className="flex items-center gap-2">
                    <Link to={selectedChat.participant ? `/profile/${selectedChat.participant.id}` : '/chat'} className="text-lg font-bold text-white hover:underline">{selectedChat.participant?.name || 'Чат'}</Link>
                    {selectedChat.participant && <VerifiedBadge level={selectedChat.participant.verificationLevel} />}
                </div>
            </div>
            <div className="flex-grow p-6 overflow-y-auto bg-base-200">
              {selectedChat.messages.length > 0 ? selectedChat.messages.map(message => (
                <ChatMessage key={message.id} message={message} isOwnMessage={message.senderId === user.id} onQuickReplyClick={handleQuickReplyClick} />
              )) : (
                 <div className="text-center text-base-content/70">Сообщений пока нет.</div>
              )}
              <div ref={messagesEndRef} />
            </div>
            <div className="p-4 bg-base-100">
              <form onSubmit={handleSendTextMessage} className="flex items-center space-x-2">
                <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
                <button type="button" onClick={() => fileInputRef.current?.click()} className="p-3 text-base-content/70 hover:text-white transition-colors rounded-full hover:bg-base-300">
                    <DynamicIcon name="attachment-clip" className="w-6 h-6" fallback={
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01.01-.01z" />
                        </svg>
                    }/>
                </button>
                <input
                  type="text"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Напишите сообщение..."
                  className="flex-grow bg-base-200 border border-base-300 rounded-full py-3 px-4 focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button type="submit" className="bg-primary text-white rounded-full p-3 hover:bg-primary-focus transition-colors">
                     <DynamicIcon name="send-arrow" className="w-5 h-5" fallback={
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M3.105 2.289a.75.75 0 00-.826.95l1.414 4.949a.75.75 0 00.95.54l3.123-.93a.75.75 0 01.928.928l-.93 3.123a.75.75 0 00.54.95l4.95 1.414a.75.75 0 00.95-.826l-2.434-8.518a.75.75 0 00-.702-.556l-8.518-2.434z" /></svg>
                     }/>
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-grow flex items-center justify-center bg-base-200">
            <p className="text-base-content/70">Выберите чат, чтобы начать общение</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPage;