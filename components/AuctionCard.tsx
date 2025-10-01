import React from 'react';
import { Link } from 'react-router-dom';
import type { Product } from '../types';
import { useCountdown } from '../hooks/useCountdown';

interface AuctionCardProps {
  product: Product;
}

const Countdown: React.FC<{ targetDate: number }> = ({ targetDate }) => {
    const { days, hours, minutes, seconds, isFinished } = useCountdown(targetDate);
    
    if (isFinished) {
        return <span className="text-red-500 font-bold">Завершен</span>;
    }
    
    if (days > 0) {
        return <span>{`${days}д ${hours}ч`}</span>;
    }

    return <span>{`${hours}:${minutes}:${seconds}`}</span>;
}

const AuctionCard: React.FC<AuctionCardProps> = ({ product }) => {

  return (
    <div className="card bg-base-100 border border-base-300 group transition-all duration-300 hover:shadow-2xl hover:shadow-primary/20 hover:-translate-y-1">
      <Link to={`/product/${product.id}`} className="block">
        <div className="relative">
            <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden">
                <img 
                    src={product.imageUrls[0]} 
                    alt={product.title} 
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300" 
                />
            </div>
             <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                <div className="flex justify-between items-center bg-black/50 backdrop-blur-sm px-3 py-1 rounded-full">
                    <p className="text-sm font-semibold text-white">
                        <span className="text-red-400 mr-1">●</span>
                        Live
                    </p>
                    <p className="text-sm font-mono text-white bg-primary/80 px-2 py-0.5 rounded-full">
                        <Countdown targetDate={product.auctionEnds || 0} />
                    </p>
                </div>
            </div>
        </div>

        <div className="p-4">
            <h3 className="font-semibold text-base-content truncate" title={product.title}>
            {product.title}
            </h3>
            <div className="flex items-baseline justify-between mt-2">
                <div className="text-sm text-base-content/70">
                    Текущая ставка
                </div>
                <p className="text-xl font-bold text-primary">{product.currentBid ?? product.startingBid} USDT</p>
            </div>
        </div>
      </Link>
    </div>
  );
};

export default AuctionCard;