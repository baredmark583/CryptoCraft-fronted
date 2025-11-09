import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';
import { apiService } from '../services/apiService';
import type { WorkshopPost, User } from '../types';
import CreateWorkshopPost from './CreateWorkshopPost';
import WorkshopPostCard from './WorkshopPostCard';
import Spinner from './Spinner';
import AutoSizer from 'react-virtualized-auto-sizer';
import { FixedSizeList as List, ListChildComponentProps } from 'react-window';

const POST_ITEM_HEIGHT = 360;
const VIRTUALIZED_THRESHOLD = 12;

interface VirtualizedItemData {
    posts: WorkshopPost[];
    seller: User;
}

const VirtualizedWorkshopFeed: React.FC<{ posts: WorkshopPost[]; seller: User }> = ({ posts, seller }) => {
    const minViewport = Math.min(posts.length, 8) || 1;
    const viewportHeight = Math.min(minViewport * POST_ITEM_HEIGHT, 900);

    const Row = ({ index, style, data }: ListChildComponentProps<VirtualizedItemData>) => {
        const post = data.posts[index];
        return (
            <div style={style} className="px-2">
                <WorkshopPostCard key={post.id} post={post} seller={data.seller} />
            </div>
        );
    };

    return (
        <div className="rounded-xl bg-base-100/40 border border-base-300/40" style={{ height: viewportHeight }}>
            <AutoSizer>
                {({ height, width }) => (
                    <List
                        height={height}
                        width={width}
                        itemCount={posts.length}
                        itemSize={POST_ITEM_HEIGHT}
                        itemData={{ posts, seller }}
                        className="divide-y divide-base-300/50"
                    >
                        {Row}
                    </List>
                )}
            </AutoSizer>
        </div>
    );
};

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
    const shouldVirtualize = useMemo(() => posts.length >= VIRTUALIZED_THRESHOLD, [posts.length]);

    return (
        <div className="space-y-6">
            {isOwnProfile && <CreateWorkshopPost onPostCreated={handlePostCreated} />}
            {posts.length > 0 ? (
                shouldVirtualize ? (
                    <VirtualizedWorkshopFeed posts={posts} seller={user} />
                ) : (
                    posts.map(post => <WorkshopPostCard key={post.id} post={post} seller={user} />)
                )
            ) : (
                <p className="text-center text-base-content/70 py-8">
                    {isOwnProfile ? 'У вас пока нет постов в мастерской.' : 'У этого пользователя пока нет постов.'}
                </p>
            )}
        </div>
    );
};

export default WorkshopTab;
