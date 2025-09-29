import React from 'react';
import type { Review } from '../types';
import StarRating from './StarRating';
import { Link } from 'react-router-dom';

interface ReviewCardProps {
  review: Review;
  onImageClick: (imageUrl: string) => void;
}

const ReviewCard: React.FC<ReviewCardProps> = ({ review, onImageClick }) => {
  return (
    <div className="bg-base-100 p-4 rounded-lg flex gap-4">
      <div className="flex-shrink-0">
        <Link to={`/profile/${review.author.id}`}>
          <img src={review.author.avatarUrl} alt={review.author.name} className="w-12 h-12 rounded-full" />
        </Link>
      </div>
      <div>
        <div className="flex items-center gap-2">
          <Link to={`/profile/${review.author.id}`} className="font-semibold text-white hover:underline">{review.author.name}</Link>
          <span className="text-xs text-base-content/70">{new Date(review.timestamp).toLocaleDateString()}</span>
        </div>
        <StarRating rating={review.rating} />
        <p className="mt-2 text-base-content/90">{review.text}</p>
        {review.imageUrl && (
          <div className="mt-3">
            <button onClick={() => onImageClick(review.imageUrl)} className="w-24 h-24 rounded-md overflow-hidden">
              <img src={review.imageUrl} alt="Review attachment" className="w-full h-full object-cover" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewCard;
