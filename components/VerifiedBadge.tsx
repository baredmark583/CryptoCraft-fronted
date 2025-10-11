

import React from 'react';
import type { User } from '../types';
import DynamicIcon from './DynamicIcon';

interface VerifiedBadgeProps {
    level: User['verificationLevel'];
}

const VerifiedBadge: React.FC<VerifiedBadgeProps> = ({ level }) => {
    // The "PRO" feature has been removed. This component is now obsolete.
    return null;
};

export default VerifiedBadge;