

import React from 'react';
import { Link } from 'react-router-dom';
import type { Message, Product } from '../types';

interface ChatMessageProps {
  message: Message;
  isOwnMessage: boolean;
  onQuickReplyClick: (text: string) => void;
}

const ProductContextCard: React.FC<{ product: Product }> = ({ product }) => {
    const price = product.price || 0;
    return (
        <Link to={`/product/${product.id}`} className="block bg-base-200/50 p-3 rounded-lg hover:bg-base-300/50 transition-colors mb-2">
            <div className="flex items-center gap-3">
                <img src={product.imageUrls[0]} alt={product.title} className="w-16 h-16 object-cover rounded-md flex-shrink-0" />
                <div className="overflow-hidden">
                    <p className="font-semibold text-white truncate">{product.title}</p>
                    <p className="text-sm text-primary font-bold">{price.toLocaleString()} USDT</p>
                </div>
            </div>
        </Link>
    );
};

const ChatMessage: React.FC<ChatMessageProps> = ({ message, isOwnMessage, onQuickReplyClick }) => {
  const alignment = isOwnMessage ? 'items-end' : 'items-start';
  const bgColor = isOwnMessage ? 'bg-primary' : 'bg-base-100';
  const bubbleStyles = isOwnMessage ? 'rounded-br-none' : 'rounded-bl-none';
  const isSystemMessage = message.senderId === 'system';

  return (
    <div className={`flex flex-col mb-4 ${alignment}`}>
      <div
        className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${bgColor} ${bubbleStyles}`}
      >
        {message.productContext && <ProductContextCard product={message.productContext} />}
        {message.imageUrl && (
            <img src={message.imageUrl} alt="Прикрепленное изображение" className="rounded-lg max-w-full h-auto my-1" />
        )}
        {message.text && (
            <p className="text-white text-sm leading-relaxed">{message.text}</p>
        )}
        {!isSystemMessage && (
             <p className={`text-xs mt-1 ${isOwnMessage ? 'text-stone-200' : 'text-base-content/70'} text-right`}>
                {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
        )}
      </div>
       {message.quickReplies && message.quickReplies.length > 0 && !isOwnMessage && (
            <div className="flex flex-wrap gap-2 mt-2 max-w-xs lg:max-w-md">
                {message.quickReplies.map((reply, index) => (
                    <button 
                        key={index} 
                        onClick={() => onQuickReplyClick(reply)}
                        className="px-3 py-1.5 text-sm bg-secondary/80 hover:bg-secondary text-white rounded-full transition-colors"
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