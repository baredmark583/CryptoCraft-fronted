import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { apiService } from '../services/apiService';
import type { WorkshopPost, User } from '../types';
import CreateWorkshopPost from './CreateWorkshopPost';
import WorkshopPostCard from './WorkshopPostCard';
import Spinner from './Spinner';

const WorkshopTab: React.FC<{ user: User }> = ({ user }) => {
    const [posts, setPosts] = useState<WorkshopPost[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { user: authUser } = useAuth();

    useEffect(() => {
        apiService.getPostsBySellerId(user.id)
            .then(setPosts)
            .finally(() => setIsLoading(false));
    }, [user.id]);
    
    const handlePostCreated = (newPost: WorkshopPost) => {
        setPosts(prev => [newPost, ...prev]);
    };

    if (isLoading) return <div className="flex justify-center py-8"><Spinner /></div>;
    
    const isOwnProfile = authUser?.id === user.id;

    return (
        <div className="space-y-6">
            {isOwnProfile && <CreateWorkshopPost onPostCreated={handlePostCreated} />}
            {posts.length > 0 ? (
                posts.map(post => <WorkshopPostCard key={post.id} post={post} seller={user} />)
            ) : (
                <p className="text-center text-base-content/70 py-8">
                    {isOwnProfile ? 'У вас пока нет постов в мастерской.' : 'У этого пользователя пока нет постов.'}
                </p>
            )}
        </div>
    );
};

export default WorkshopTab;
