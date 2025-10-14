import React from 'react';
import type { User } from '../types';

interface VerifiedBadgeProps {
    level: User['verificationLevel'];
}

const VerifiedBadge: React.FC<VerifiedBadgeProps> = ({ level }) => {
    // This component is obsolete in the new "SandBoard" design.
    return null;
};

export default VerifiedBadge;