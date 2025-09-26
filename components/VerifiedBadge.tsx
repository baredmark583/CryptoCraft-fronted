

import React from 'react';
import type { User } from '../types';
import DynamicIcon from './DynamicIcon';

interface VerifiedBadgeProps {
    level: User['verificationLevel'];
}

const VerifiedBadge: React.FC<VerifiedBadgeProps> = ({ level }) => {
    if (level === 'PRO') {
        return (
            <div className="inline-flex items-center gap-1 bg-amber-500/10 text-amber-400 font-semibold px-2 py-0.5 rounded-full text-xs" title="Pro-продавец">
                <DynamicIcon name="verified-badge" className="w-4 h-4" fallback={
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                    </svg>
                }/>
                <span>Pro-продавец</span>
            </div>
        );
    }
    
    return null;
};

export default VerifiedBadge;
