import React from 'react';
import DynamicIcon from './DynamicIcon';

interface VerifiedBadgeProps {
  level?: 'NONE' | 'PRO';
}

const VerifiedBadge: React.FC<VerifiedBadgeProps> = ({ level }) => {
  if (level !== 'PRO') {
    return null;
  }

  return (
    <div
      className="inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded-full text-xs transition-colors bg-amber-500/10 text-amber-400"
      title="Pro-продавец: Этот продавец прошел верификацию."
    >
      <DynamicIcon name="verified-badge" className="h-3.5 w-3.5" fallback={
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
        </svg>
      } />
      <span>PRO</span>
    </div>
  );
};

export default VerifiedBadge;
