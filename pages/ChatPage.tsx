import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { apiService } from '../services/apiService';
import { useAuth } from '../hooks/useAuth';
import type { Chat, Message, MessageAttachment, MessageContent, Product } from '../types';
import Spinner from '../components/Spinner';
import { io, Socket } from 'socket.io-client';
import { useTelegram } from '../hooks/useTelegram';
import ImageModal from '../components/ImageModal';
import { useCurrency } from '../hooks/useCurrency';

const API_BASE_URL = (import.meta as any).env.VITE_API_BASE_URL || 'http://localhost:3001';
const MAX_ATTACHMENT_SIZE = 25 * 1024 * 1024; // 25 MB

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

const formatFileSize = (size?: number) => {
  if (!size) return '';
  const units = ['Б', 'КБ', 'МБ', 'ГБ'];
  let value = size;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(1)} ${units[unitIndex]}`;
};

const ensureTimestamp = (value?: number | string) => {
  if (!value) return Date.now();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? Date.now() : date.getTime();
};

const normalizeMessage = (message: Partial<Message>): Message => {
  const timestamp = message.timestamp ?? message.createdAt ?? message.updatedAt ?? new Date().toISOString();
  return {
    ...(message as Message),
    timestamp,
    attachments: Array.isArray(message.attachments) ? message.attachments : [],
    quickReplies: Array.isArray(message.quickReplies) ? message.quickReplies : [],
    readReceipts: Array.isArray(message.readReceipts) ? message.readReceipts : [],
  };
};

const normalizeChat = (chat: Partial<Chat> & Pick<Chat, 'id' | 'participant'>): Chat => {
  const normalizedMessages = Array.isArray(chat.messages) ? chat.messages.map(normalizeMessage) : [];
  const lastMessage =
    chat.lastMessage ? normalizeMessage(chat.lastMessage) : normalizedMessages[normalizedMessages.length - 1] ?? null;
  return {
    ...chat,
    messages: normalizedMessages,
    lastMessage,
    unreadCount: chat.unreadCount ?? 0,
  };
};

const getLastMessagePreview = (message?: Message | null) => {
  if (!message) return 'Нет сообщений';
  if (message.text) return message.text;
  if (message.attachments && message.attachments.length > 0) {
    const hasImage = message.attachments.some((att) => att.type === 'image');
    return hasImage ? 'Изображение' : 'Вложение';
  }
  if (message.imageUrl) return 'Изображение';
  if (message.productContext) return 'Карточка товара';
  return 'Сообщение';
};

const ProductContextCard: React.FC<{ product: Product; isOwnMessage: boolean }> = ({ product, isOwnMessage }) => {
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

const AttachmentPreview: React.FC<{
  attachment: MessageAttachment;
  isOwnMessage: boolean;
  onImageClick: (url: string) => void;
}> = ({ attachment, isOwnMessage, onImageClick }) => {
  if (attachment.type === 'image') {
    return (
      <img
        key={attachment.id}
        src={attachment.thumbnailUrl || attachment.url}
        alt={attachment.name || 'Вложение'}
        className="rounded-lg max-w-[200px] h-auto my-1 cursor-pointer"
        onClick={() => onImageClick(attachment.url)}
      />
    );
  }
  return (
    <a
      key={attachment.id}
      href={attachment.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex items-center gap-3 p-2 rounded-xl text-xs ${
        isOwnMessage ? 'bg-black/10 text-white' : 'bg-white text-amber-900 border border-amber-100'
      }`}
    >
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-black/20">
        <img src="https://api.iconify.design/lucide/file.svg" alt="file" className="h-4 w-4" />
      </span>
      <div className="flex flex-col">
        <span className="font-semibold truncate max-w-[160px]">{attachment.name || 'Файл'}</span>
        <span className="opacity-70">{formatFileSize(attachment.size)}</span>
      </div>
    </a>
  );
};

const ChatMessage: React.FC<{
  message: Message;
  isOwnMessage: boolean;
  onImageClick: (url: string) => void;
  onQuickReply: (text: string) => void;
  otherParticipantId?: string;
}> = ({ message, isOwnMessage, onImageClick, onQuickReply, otherParticipantId }) => {
  const formattedTime = new Date(ensureTimestamp(message.timestamp)).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
  const attachments = message.attachments || [];
  const hasRecipientRead =
    isOwnMessage && otherParticipantId
      ? (message.readReceipts || []).some((receipt) => receipt.userId === otherParticipantId)
      : false;

  return (
    <div className={`flex max-w-[80%] sm:max-w-[70%] ${isOwnMessage ? 'self-end' : 'self-start'}`}>
      <div
        className={`px-4 py-2 rounded-2xl relative text-sm ${
          isOwnMessage ? 'bg-primary text-primary-content rounded-br-lg' : 'bg-white border border-amber-200/60 rounded-bl-lg'
        }`}
      >
        {message.productContext && <ProductContextCard product={message.productContext} isOwnMessage={isOwnMessage} />}
        {message.imageUrl && (
          <img
            src={message.imageUrl}
            alt="Прикрепленное изображение"
            className="rounded-lg max-w-[200px] h-auto my-1 cursor-pointer"
            onClick={() => onImageClick(message.imageUrl as string)}
          />
        )}
        {attachments.length > 0 && (
          <div className="flex flex-col gap-2 my-1">
            {attachments.map((attachment) => (
              <AttachmentPreview
                key={attachment.id}
                attachment={attachment}
                isOwnMessage={isOwnMessage}
                onImageClick={onImageClick}
              />
            ))}
          </div>
        )}
        {message.text && (
          <p className="whitespace-pre-line break-words">
            {message.text}
            <span className={`text-xs ml-3 ${isOwnMessage ? 'text-amber-900/60' : 'opacity-70'}`}>{formattedTime}</span>
          </p>
        )}
        {!message.text && (
          <span className={`text-xs ${isOwnMessage ? 'text-amber-900/60' : 'opacity-70'}`}>{formattedTime}</span>
        )}
        {!isOwnMessage && message.quickReplies && message.quickReplies.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {message.quickReplies.map((reply) => (
              <button
                key={reply}
                type="button"
                className="text-xs px-3 py-1 rounded-full border border-amber-200/80 text-amber-800 hover:bg-amber-50"
                onClick={() => onQuickReply(reply)}
              >
                {reply}
              </button>
            ))}
          </div>
        )}
        {isOwnMessage && (
          <div className="mt-1 flex items-center justify-end gap-1 text-[10px] uppercase tracking-wide">
            <span className={hasRecipientRead ? 'text-emerald-200' : 'text-amber-200'}>
              {hasRecipientRead ? 'Просмотрено' : 'Отправлено'}
            </span>
            <img
              src={`https://api.iconify.design/lucide/${hasRecipientRead ? 'check-check' : 'check'}.svg`}
              className="w-3 h-3 opacity-70"
              alt="status"
            />
          </div>
        )}
      </div>
    </div>
  );
};

const ChatPage: React.FC = () => {
  const { chatId } = useParams<{ chatId?: string }>();
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const { tg } = useTelegram();

  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [messageText, setMessageText] = useState('');
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(!chatId);
  const [searchQuery, setSearchQuery] = useState('');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const selectedChatIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (tg?.MainButton) {
      tg.MainButton.hide();
    }
  }, [tg, chatId]);

  useEffect(() => {
    selectedChatIdRef.current = selectedChat?.id ?? null;
  }, [selectedChat?.id]);

  useEffect(() => {
    if (!token) return;
    const newSocket = io(API_BASE_URL, {
      auth: { token },
      transports: ['websocket'],
    });
    setSocket(newSocket);

    newSocket.on('connect', () => console.log('Connected to WebSocket server'));
    newSocket.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
      setTypingUsers([]);
    });

    newSocket.on('newMessage', (incoming: Message) => {
      const normalizedMessage = normalizeMessage(incoming);
      setSelectedChat((prevChat) => {
        if (prevChat && normalizedMessage.chat && prevChat.id === normalizedMessage.chat.id) {
          return {
            ...prevChat,
            messages: [...prevChat.messages, normalizedMessage],
            lastMessage: normalizedMessage,
          };
        }
        return prevChat;
      });

      setChats((prevChats) => {
        const hasChat = prevChats.some((chat) => chat.id === normalizedMessage.chat?.id);
        if (!hasChat && normalizedMessage.chat) {
          // In case chat list is stale, refetch
          (async () => {
            try {
              const fetchedChats = await apiService.getChats();
              setChats(Array.isArray(fetchedChats) ? fetchedChats.map(normalizeChat) : []);
            } catch (error) {
              console.error('Failed to refresh chats', error);
            }
          })();
          return prevChats;
        }
        return prevChats.map((chat) => {
          if (!normalizedMessage.chat || chat.id !== normalizedMessage.chat.id) return chat;
          const isActiveChat = selectedChatIdRef.current === chat.id;
          const shouldIncrement = !isActiveChat && normalizedMessage.sender?.id !== user?.id;
          return {
            ...chat,
            lastMessage: normalizedMessage,
            unreadCount: shouldIncrement ? (chat.unreadCount ?? 0) + 1 : chat.unreadCount ?? 0,
          };
        });
      });
    });

    newSocket.on('messagesRead', ({ chatId: eventChatId, userId: readerId, receipts }) => {
      setSelectedChat((prevChat) => {
        if (!prevChat || prevChat.id !== eventChatId) return prevChat;
        return {
          ...prevChat,
          messages: prevChat.messages.map((msg) => {
            const receipt = receipts?.find((r: { messageId: string }) => r.messageId === msg.id);
            if (!receipt) return msg;
            const alreadyHas = (msg.readReceipts || []).some((r) => r.userId === readerId);
            if (alreadyHas) return msg;
            return {
              ...msg,
              readReceipts: [...(msg.readReceipts || []), { userId: readerId, readAt: receipt.readAt }],
            };
          }),
        };
      });
    });

    newSocket.on('typing', ({ userId, isTyping }: { userId: string; isTyping: boolean }) => {
      setTypingUsers((prev) => {
        const next = new Set(prev);
        if (isTyping) next.add(userId);
        else next.delete(userId);
        return Array.from(next);
      });
    });

    return () => {
      newSocket.close();
    };
  }, [token, user?.id]);

  useEffect(() => {
    if (socket && chatId) {
      socket.emit('joinChat', chatId);
      return () => {
        socket.emit('leaveChat', chatId);
      };
    }
  }, [socket, chatId]);

  useEffect(() => {
    const fetchChats = async () => {
      setIsLoading(true);
      try {
        const chatData = await apiService.getChats();
        setChats(Array.isArray(chatData) ? chatData.map(normalizeChat) : []);
      } catch (e) {
        console.error('Failed to fetch chats', e);
        setChats([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchChats();
  }, []);

  useEffect(() => {
    const fetchChatDetails = async () => {
      if (!chatId) {
        setSelectedChat(null);
        if (window.innerWidth < 768) {
          setIsSidebarOpen(true);
        }
        return;
      }
      setIsLoading(true);
      try {
        const currentChat = await apiService.getChatById(chatId);
        setSelectedChat(currentChat ? normalizeChat(currentChat) : null);
        setIsSidebarOpen(false);
      } catch (error) {
        console.error('Failed to load chat', error);
        setSelectedChat(null);
      } finally {
        setIsLoading(false);
      }
    };
    fetchChatDetails();
  }, [chatId]);

  const markVisibleChatAsRead = useCallback(() => {
    if (!socket || !selectedChat?.id) return;
    socket.emit('markAsRead', { chatId: selectedChat.id });
    setChats((prev) => prev.map((chat) => (chat.id === selectedChat.id ? { ...chat, unreadCount: 0 } : chat)));
  }, [socket, selectedChat?.id]);

  const messageCount = selectedChat?.messages.length ?? 0;
  useEffect(() => {
    if (!selectedChat) return;
    markVisibleChatAsRead();
  }, [selectedChat?.id, messageCount, markVisibleChatAsRead]);

  useEffect(() => {
    const onFocus = () => {
      markVisibleChatAsRead();
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [markVisibleChatAsRead]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedChat?.messages, typingUsers]);

  const emitTypingState = useCallback(
    (isTyping: boolean) => {
      const targetChatId = selectedChat?.id ?? chatId;
      if (socket && targetChatId) {
        socket.emit('typing', { chatId: targetChatId, isTyping });
      }
    },
    [socket, selectedChat?.id, chatId],
  );

  const debouncedStopTyping = useDebounce(() => emitTypingState(false), 2000);

  const handleSend = useCallback(
    (content: MessageContent) => {
      const targetChatId = selectedChat?.id ?? chatId;
      if (!socket || !targetChatId) return;
      socket.emit('sendMessage', { chatId: targetChatId, message: content });
      if (typeof content.text === 'string') {
        setMessageText('');
      }
      socket.emit('typing', { chatId: targetChatId, isTyping: false });
    },
    [socket, selectedChat?.id, chatId],
  );

  const handleSendTextMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;
    handleSend({ text: messageText.trim() });
  };

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageText(e.target.value);
    emitTypingState(true);
    debouncedStopTyping();
  };

  const handleQuickReply = (text: string) => {
    handleSend({ text });
  };

  const handleAttachmentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !files.length) return;
    setUploadError(null);
    setIsUploading(true);
    for (const file of Array.from(files)) {
      if (file.size > MAX_ATTACHMENT_SIZE) {
        setUploadError('Файл превышает допустимый размер (25 МБ).');
        continue;
      }
      try {
        const { url } = await apiService.uploadFile(file);
        const attachment: MessageAttachment = {
          id: `attachment-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          type: file.type.startsWith('image/') ? 'image' : 'file',
          url,
          name: file.name,
          mimeType: file.type,
          size: file.size,
        };
        handleSend({ attachments: [attachment] });
      } catch (error) {
        console.error('Failed to upload attachment', error);
        setUploadError('Не удалось загрузить файл. Попробуйте ещё раз.');
      }
    }
    setIsUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const filteredChats = useMemo(() => {
    return chats.filter((chat) => {
      const nameMatches = chat.participant?.name?.toLowerCase().includes(searchQuery.toLowerCase());
      const previewMatches = getLastMessagePreview(chat.lastMessage)
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      return nameMatches || previewMatches;
    });
  }, [chats, searchQuery]);

  const isTyping =
    typingUsers.length > 0 && selectedChat?.participant && typingUsers.includes(selectedChat.participant.id);

  if (isLoading && !selectedChat) {
    return (
      <div className="flex justify-center items-center h-full">
        <Spinner />
      </div>
    );
  }

  return (
    <>
      <section className="w-full h-full">
        <div className="mx-auto p-0 h-full">
          <div className="w-full h-full bg-white border border-amber-200/80 rounded-2xl flex overflow-hidden shadow-sm relative">
            <aside
              aria-label="Список чатов"
              className={`w-full md:w-80 lg:w-96 border-r border-amber-200/80 flex flex-col absolute md:relative inset-y-0 left-0 bg-white z-20 transition-transform duration-300 ease-in-out ${
                isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
              }`}
            >
              <div className="flex items-center justify-between p-4 border-b border-amber-200/80">
                <span className="text-xl font-bold font-manrope text-amber-900">Сообщения</span>
                <button
                  type="button"
                  aria-label="Закрыть список"
                  className="p-2 rounded-full hover:bg-amber-100 md:hidden"
                  onClick={() => setIsSidebarOpen(false)}
                >
                  <img src="https://api.iconify.design/lucide-x.svg" alt="Закрыть" className="w-5 h-5" />
                </button>
              </div>
              <div className="p-3 border-b border-amber-200/80">
                <div className="relative">
                  <img
                    src="https://api.iconify.design/lucide-search.svg"
                    alt="Поиск"
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 opacity-50"
                  />
                  <input
                    type="search"
                    placeholder="Поиск в чатах..."
                    className="w-full bg-amber-50/80 border border-amber-200/80 rounded-lg pl-10 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              <ul role="listbox" aria-label="Чаты" className="flex-grow overflow-y-auto">
                {filteredChats.map((chat) => {
                  if (!chat?.id || !chat.participant?.id || !chat.participant.name) return null;
                  const { participant, lastMessage, unreadCount } = chat;
                  const lastMessageText = getLastMessagePreview(lastMessage);
                  const isActive = chatId === chat.id;
                  return (
                    <li
                      key={chat.id}
                      role="option"
                      aria-selected={isActive}
                      className={`flex items-start gap-3 p-3 cursor-pointer border-b border-amber-100/80 transition-colors ${
                        isActive ? 'bg-amber-100' : 'hover:bg-amber-50'
                      }`}
                      onClick={() => navigate(`/chat/${chat.id}`)}
                    >
                      <img
                        src={participant.avatarUrl}
                        alt={`Аватар: ${participant.name}`}
                        className="w-12 h-12 rounded-full object-cover shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-amber-900/90 truncate">{participant.name}</span>
                          <div className="flex items-center gap-2 shrink-0 ml-2">
                            {unreadCount ? (
                              <span className="inline-flex items-center justify-center rounded-full bg-primary text-white text-[10px] w-5 h-5">
                                {unreadCount}
                              </span>
                            ) : null}
                            <span className="text-xs text-amber-800/60">
                              {lastMessage ? new Date(ensureTimestamp(lastMessage.timestamp)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                            </span>
                          </div>
                        </div>
                        <span className="text-sm text-amber-800/70 truncate block">{lastMessageText}</span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </aside>
            <main
              aria-label="Окно чата"
              className={`flex-1 flex-col h-full bg-amber-50/30 ${!chatId && 'hidden'} md:flex`}
            >
              <div
                aria-hidden={!isSidebarOpen}
                className="fixed inset-0 bg-black/40 z-10 md:hidden"
                onClick={() => setIsSidebarOpen(false)}
              ></div>
              {selectedChat ? (
                <>
                  <header className="flex items-center gap-3 p-3 border-b border-amber-200/80 bg-white shadow-sm shrink-0">
                    <button
                      type="button"
                      aria-label="Открыть список чатов"
                      className="p-2 rounded-full hover:bg-amber-100 md:hidden"
                      onClick={() => setIsSidebarOpen(true)}
                    >
                      <img src="https://api.iconify.design/lucide-menu.svg" alt="Меню" className="w-5 h-5" />
                    </button>
                    <div className="flex items-center gap-3 min-w-0">
                      <Link to={`/profile/${selectedChat.participant.id}`}>
                        <img
                          src={selectedChat.participant.avatarUrl}
                          alt={`Аватар: ${selectedChat.participant.name}`}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      </Link>
                      <div className="min-w-0">
                        <Link
                          to={`/profile/${selectedChat.participant.id}`}
                          className="font-bold text-amber-900 truncate block"
                        >
                          {selectedChat.participant.name}
                        </Link>
                        <span className="text-xs text-green-600">В сети</span>
                      </div>
                    </div>
                    <div className="ml-auto">
                      <button type="button" aria-label="Ещё" className="p-2 rounded-full hover:bg-amber-100">
                        <img src="https://api.iconify.design/lucide-more-horizontal.svg" alt="Ещё" className="w-5 h-5" />
                      </button>
                    </div>
                  </header>
                  <div role="log" className="flex-1 overflow-y-auto p-4 lg:p-6 flex flex-col gap-2">
                    {selectedChat.messages.map((message) => (
                      <ChatMessage
                        key={message.id}
                        message={message}
                        isOwnMessage={message.sender?.id === user?.id}
                        otherParticipantId={selectedChat.participant.id}
                        onImageClick={setViewingImage}
                        onQuickReply={handleQuickReply}
                      />
                    ))}
                    {isTyping && (
                      <div className="flex max-w-[80%] sm:max-w-[70%] self-start">
                        <div className="px-4 py-2 rounded-2xl relative text-sm bg-white border border-amber-200/60 rounded-bl-lg">
                          <span className="loading loading-dots loading-sm"></span>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                  <form method="post" action="#send" className="p-3 border-t border-amber-200/80 bg-white shrink-0" onSubmit={handleSendTextMessage}>
                    <div className="flex flex-col gap-2">
                      {uploadError && <p className="text-xs text-red-500 px-2">{uploadError}</p>}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          aria-label="Прикрепить файл"
                          className="p-2 rounded-full hover:bg-amber-100"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <img src="https://api.iconify.design/lucide-paperclip.svg" alt="Прикрепить" className="w-5 h-5" />
                          <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleAttachmentUpload}
                            className="hidden"
                            accept="image/*,.pdf,.doc,.docx,.zip,.rar,.7z,.txt,.json,.csv"
                            multiple
                          />
                        </button>
                        <input
                          type="text"
                          value={messageText}
                          onChange={handleTyping}
                          placeholder="Напишите сообщение..."
                          aria-label="Поле ввода сообщения"
                          className="flex-grow bg-amber-50/80 border border-amber-200/80 rounded-full py-2 px-4 outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                        />
                        <button
                          type="submit"
                          className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center shrink-0 disabled:opacity-40"
                          disabled={!messageText.trim()}
                        >
                          <img src="https://api.iconify.design/lucide-send.svg" alt="Отправить" className="w-5 h-5" />
                        </button>
                      </div>
                      {isUploading && (
                        <span className="text-xs text-amber-800/70 flex items-center gap-2 px-1">
                          <span className="loading loading-spinner loading-xs" />
                          Загружаем вложение...
                        </span>
                      )}
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
