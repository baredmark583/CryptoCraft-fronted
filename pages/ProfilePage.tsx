import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

// This page now acts as a redirector.
// Public profiles are not part of the new "SandBoard" design provided.
// Own profile is now handled by DashboardPage.
const ProfilePage: React.FC = () => {
    const { profileId } = useParams<{ profileId?: string }>();
    const { user: authUser, isLoading } = useAuth();
    const navigate = useNavigate();
    
    useEffect(() => {
        if (isLoading) {
            return; // Wait until authentication check is complete
        }

        const isOwnProfile = !profileId || (authUser && profileId === authUser.id);
        
        if (isOwnProfile) {
            // If it's the user's own profile, redirect to the new dashboard
            navigate('/dashboard', { replace: true });
        } else {
            // For public profiles, the new design doesn't have a dedicated page.
            // A sensible default is to redirect to the home page.
            // In a real scenario, you might want a lean public profile page.
            navigate('/', { replace: true });
        }
    }, [profileId, authUser, isLoading, navigate]);

    // Render nothing while redirecting
    return null;
};

export default ProfilePage;