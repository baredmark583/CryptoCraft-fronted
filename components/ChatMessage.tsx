import React from 'react';
import { Link } from 'react-router-dom';
import type { Message, Product } from '../types';

interface ChatMessageProps {
  message: Message;
  isOwnMessage: boolean;
  onQuickReplyClick: (text: string) => void;
}

const ProductContextCard: React.FC<{ product: Product; isOwnMessage: boolean }> = ({ product, isOwnMessage }) => {
    const price = product.price || 0;
    return (
        <Link to={`/product/${product.id}`} className={`block p-2 rounded-lg transition-colors mb-2 ${isOwnMessage ? 'bg-blue-400/80 hover:bg-blue-400' : 'bg-gray-100 hover:bg-gray-200'}`}>
            <div className="flex items-center gap-3">
                <img src={product.imageUrls[0]} alt={product.title} className="w-12 h-12 object-cover rounded-md flex-shrink-0" />
                <div className="overflow-hidden">
                    <p className={`font-semibold truncate ${isOwnMessage ? 'text-white' : 'text-gray-800'}`}>{product.title}</p>
                    <p className={`text-sm font-bold ${isOwnMessage ? 'text-blue-100' : 'text-blue-600'}`}>{price.toLocaleString()} USDT</p>
                </div>
            </div>
        </Link>
    );
};

const ChatMessage: React.FC<ChatMessageProps> = ({ message, isOwnMessage, onQuickReplyClick }) => {
  const alignment = isOwnMessage ? 'items-end' : 'items-start';
  const bgColor = isOwnMessage ? 'bg-blue-500' : 'bg-white';
  const textColor = isOwnMessage ? 'text-white' : 'text-gray-800';
  const bubbleStyles = isOwnMessage ? 'rounded-br-none' : 'rounded-bl-none';
  const isSystemMessage = message.senderId === 'system';

  const formattedTime = message.timestamp && typeof message.timestamp === 'number'
    ? new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <div className={`flex flex-col mb-2 ${alignment}`}>
      <div
        className={`max-w-xs lg:max-w-md px-3 py-2 rounded-2xl shadow-md ${bgColor} ${bubbleStyles}`}
      >
        {message.productContext && <ProductContextCard product={message.productContext} isOwnMessage={isOwnMessage} />}
        {message.imageUrl && (
            <img src={message.imageUrl} alt="Прикрепленное изображение" className="rounded-lg max-w-full h-auto my-1" />
        )}
        {message.text && (
            <p className={`text-sm leading-relaxed ${textColor}`}>{message.text}</p>
        )}
        {!isSystemMessage && (
             <p className={`text-xs mt-1 ${isOwnMessage ? 'text-blue-100' : 'text-gray-400'} text-right`}>
                {formattedTime}
            </p>
        )}
      </div>
       {message.quickReplies && message.quickReplies.length > 0 && !isOwnMessage && (
            <div className="flex flex-wrap gap-2 mt-2 max-w-xs lg:max-w-md">
                {message.quickReplies.map((reply, index) => (
                    <button 
                        key={index} 
                        onClick={() => onQuickReplyClick(reply)}
                        className="px-3 py-1.5 text-sm bg-white hover:bg-gray-200 text-blue-600 rounded-full transition-colors border border-gray-200 shadow-sm"
                    >
                        {reply}
                    </button>
                ))}
            </div>
        )}
    </div>
  );
};

export default ChatMessage;
