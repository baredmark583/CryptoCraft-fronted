import React from 'react';
import { Link } from 'react-router-dom';
import type { Message, Product } from '../types';

interface ChatMessageProps {
  message: Message;
  isOwnMessage: boolean;
  onQuickReplyClick: (text: string) => void;
  onImageClick: (imageUrl: string) => void;
}

const ProductContextCard: React.FC<{ product: Product; isOwnMessage: boolean }> = ({ product, isOwnMessage }) => {
    const price = product.price || 0;
    return (
        <Link to={`/product/${product.id}`} className="block p-2 rounded-lg transition-colors mb-2 bg-base-100/20 hover:bg-base-100/40">
            <div className="flex items-center gap-3">
                <div className="avatar">
                    <div className="w-12 rounded-md">
                        <img src={product.imageUrls[0]} alt={product.title} />
                    </div>
                </div>
                <div className="overflow-hidden">
                    <p className={`font-semibold truncate text-content`}>{product.title}</p>
                    <p className={`text-sm font-bold text-accent`}>{price.toLocaleString()} USDT</p>
                </div>
            </div>
        </Link>
    );
};

const ChatMessage: React.FC<ChatMessageProps> = ({ message, isOwnMessage, onQuickReplyClick, onImageClick }) => {
  const chatAlignment = isOwnMessage ? 'chat-end' : 'chat-start';
  const bubbleColor = isOwnMessage ? 'chat-bubble-primary' : 'chat-bubble-secondary';
  const isSystemMessage = message.senderId === 'system';

  const formattedTime = message.timestamp && typeof message.timestamp === 'number'
    ? new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  if (isSystemMessage) {
    return (
        <div className="flex flex-wrap justify-center gap-2 my-2">
            {message.quickReplies?.map((reply, index) => (
                <button 
                    key={index} 
                    onClick={() => onQuickReplyClick(reply)}
                    className="btn btn-sm btn-outline"
                >
                    {reply}
                </button>
            ))}
        </div>
    );
  }

  return (
    <div className={`chat ${chatAlignment}`}>
      <div className={`chat-bubble ${bubbleColor}`}>
        {message.productContext && <ProductContextCard product={message.productContext} isOwnMessage={isOwnMessage} />}
        {message.imageUrl && (
            <img 
              src={message.imageUrl} 
              alt="Прикрепленное изображение" 
              className="rounded-lg w-full max-w-[320px] h-auto my-1 cursor-pointer" 
              onClick={() => onImageClick(message.imageUrl)}
            />
        )}
        {message.text && (
            <p>{message.text}</p>
        )}
      </div>
      <div className="chat-footer opacity-50 text-xs">
        {formattedTime}
      </div>
    </div>
  );
};

export default ChatMessage;