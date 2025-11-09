import React from 'react';
import { Link } from 'react-router-dom';
import type { Review } from '../types';
import StarRating from './StarRating';

interface ReviewCardProps {
  review: Review;
  onPreviewMedia: (url: string) => void;
}

const ReviewCard: React.FC<ReviewCardProps> = ({ review, onPreviewMedia }) => {
  const reviewDate = review.createdAt || review.timestamp;
  const formattedDate = reviewDate ? new Date(reviewDate).toLocaleDateString() : '';

  const media = review.attachments?.length
    ? review.attachments
    : review.imageUrl
    ? [{ type: 'image', url: review.imageUrl }]
    : [];

  return (
    <div className="bg-base-100 p-4 rounded-lg flex gap-4 border border-base-300/60">
      <div className="flex-shrink-0">
        <Link to={`/profile/${review.author.id}`}>
          <img src={review.author.avatarUrl} alt={review.author.name} className="w-12 h-12 rounded-full" />
        </Link>
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <Link to={`/profile/${review.author.id}`} className="font-semibold text-white hover:underline">
            {review.author.name}
          </Link>
          {formattedDate && <span className="text-xs text-base-content/70">{formattedDate}</span>}
        </div>
        <StarRating rating={review.rating} />
        {review.text && <p className="mt-2 text-base-content/90 whitespace-pre-line">{review.text}</p>}

        {media.length > 0 && (
          <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
            {media.map((attachment, idx) =>
              attachment.type === 'image' ? (
                <button
                  type="button"
                  key={`${attachment.url}-${idx}`}
                  onClick={() => onPreviewMedia(attachment.url)}
                  className="w-full h-24 rounded-md overflow-hidden border border-base-300 bg-base-200"
                >
                  <img src={attachment.thumbnailUrl || attachment.url} alt="Отзывы" className="w-full h-full object-cover" />
                </button>
              ) : (
                <video
                  key={`${attachment.url}-${idx}`}
                  src={attachment.url}
                  controls
                  className="w-full h-24 rounded-md border border-base-300 bg-black object-cover"
                />
              ),
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewCard;
