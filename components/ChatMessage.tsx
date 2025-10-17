import React from 'react';
import { Link } from 'react-router-dom';
import type { Message, Product } from '../types';

interface ChatMessageProps {
  message: Message;
  isOwnMessage: boolean;
  onQuickReplyClick: (text: string) => void;
  onImageClick: (imageUrl: string) => void;
}

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

const ChatMessage: React.FC<ChatMessageProps> = ({ message, isOwnMessage, onQuickReplyClick, onImageClick }) => {
  const isSystemMessage = message.sender?.id === 'system';

  const formattedTime = message.timestamp && typeof message.timestamp === 'number'
    ? new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  if (isSystemMessage) {
    return (
        <div className="flex flex-wrap justify-center gap-2 my-4">
            {message.quickReplies?.map((reply, index) => (
                <button 
                    key={index} 
                    onClick={() => onQuickReplyClick(reply)}
                    className="btn btn-sm btn-outline border-amber-300 text-amber-800 hover:bg-amber-100 hover:border-amber-400"
                >
                    {reply}
                </button>
            ))}
        </div>
    );
  }

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

export default ChatMessage;