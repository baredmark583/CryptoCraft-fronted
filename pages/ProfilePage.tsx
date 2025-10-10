import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { apiService } from '../services/apiService';
import { useAuth } from '../hooks/useAuth';
import type { User, Product } from '../types';
import Spinner from '../components/Spinner';
import ProductCard from '../components/ProductCard';
import StarRating from '../components/StarRating';
import { useTelegramBackButton } from '../hooks/useTelegram';
import WorkshopTab from '../components/WorkshopTab';
import CollectionsTab from '../components/CollectionsTab';

export type PublicProfileTab = 'listings' | 'workshop' | 'collections';

const TABS: { id: PublicProfileTab; label: string }[] = [
    { id: 'listings', label: 'Товары' },
    { id: 'workshop', label: 'Мастерская' },
    { id: 'collections', label: 'Коллекции' },
];

const ListingsTab: React.FC<{ products: Product[] }> = ({ products }) => {
    if (products.length === 0) return <div className="text-center py-16"><p className="text-base-content/70">У этого пользователя пока нет товаров.</p></div>
    
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map(product => <ProductCard key={product.id} product={product} />)}
        </div>
    )
};

const ProfileHeader: React.FC<{ user: User; isContacting: boolean; onContactSeller: () => void }> = ({ user, isContacting, onContactSeller }) => {
    return (
        <div className="mb-8">
            <div className="h-48 bg-base-100 rounded-lg overflow-hidden mb-[-4rem] sm:mb-[-5rem]">
                {user.headerImageUrl ? (
                    <img src={user.headerImageUrl} alt={`${user.name}'s header`} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full bg-gradient-to-r from-base-100 via-base-300 to-base-100"></div>
                )}
            </div>
            <div className="relative flex flex-col sm:flex-row items-center gap-6 px-6">
                <img src={user.avatarUrl} alt={user.name} className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-base-200 bg-base-200 ring-2 ring-primary"/>
                <div className="flex-1 flex flex-col sm:flex-row items-center justify-center sm:justify-between w-full pt-4 sm:pt-12">
                    <div className="text-center sm:text-left">
                        <h1 className="text-3xl font-bold text-white">{user.name}</h1>
                        <div className="flex items-center justify-center sm:justify-start gap-2 mt-1">
                            <StarRating rating={user.rating} />
                            <span className="text-base-content/70">{user.rating.toFixed(1)}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 mt-4 sm:mt-0">
                        <button onClick={onContactSeller} disabled={isContacting} className="bg-primary hover:bg-primary-focus text-white font-bold py-2 px-4 rounded-lg">
                            {isContacting ? <Spinner size="sm" /> : 'Написать'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}


const ProfilePage: React.FC = () => {
    const { profileId } = useParams<{ profileId?: string }>();
    const { user: authUser } = useAuth();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    
    const [profileUser, setProfileUser] = useState<User | null>(null);
    const [userProducts, setUserProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isContacting, setIsContacting] = useState(false);
    
    const isOwnProfile = !profileId || profileId === authUser?.id;
    useTelegramBackButton(!isOwnProfile);
    
    const activeTab = (searchParams.get('tab') as PublicProfileTab) || 'listings';
    
    const setActiveTab = (tab: PublicProfileTab) => {
        setSearchParams({ tab });
    };

    useEffect(() => {
        // If it's the user's own profile, redirect to the new dashboard
        if (isOwnProfile) {
            navigate('/dashboard');
            return;
        }

        const fetchProfileData = async () => {
            if (!profileId) return;
            setIsLoading(true);
            try {
                const userToSet = await apiService.getUserById(profileId) || null;
                if (userToSet) {
                    setProfileUser(userToSet);
                    const products = await apiService.getProductsBySellerId(profileId);
                    setUserProducts(products);
                } else {
                    setProfileUser(null);
                    setUserProducts([]);
                }
            } catch (error) {
                console.error("Failed to fetch public profile data:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchProfileData();
    }, [profileId, isOwnProfile, navigate]);


    const handleContactSeller = async () => {
        if (!profileUser || !authUser || isOwnProfile) return;
        setIsContacting(true);
        try {
            const chat = await apiService.findOrCreateChat(authUser.id, profileUser.id);
            navigate(`/chat/${chat.id}`);
        } catch (error) {
            console.error("Failed to create or find chat:", error);
            alert("Не удалось начать чат.");
        } finally {
            setIsContacting(false);
        }
    };

    if (isLoading) return <div className="flex justify-center items-center h-96"><Spinner /></div>;
    if (!profileUser) return <div className="text-center text-xl text-base-content/70">Профиль не найден.</div>;

    const renderTabContent = () => {
        switch (activeTab) {
            case 'listings':
                return <ListingsTab products={userProducts} />;
            case 'workshop':
                return <WorkshopTab user={profileUser} />;
            case 'collections':
                 return <CollectionsTab />;
            default:
                return <ListingsTab products={userProducts} />;
        }
    }

    return (
        <div>
            <ProfileHeader 
                user={profileUser}
                isContacting={isContacting}
                onContactSeller={handleContactSeller}
            />
            <div className="mt-8">
                 <div className="tabs tabs-boxed mb-6">
                    {TABS.map(tab => (
                        <a 
                            key={tab.id}
                            className={`tab ${activeTab === tab.id ? 'tab-active' : ''}`}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            {tab.label}
                        </a>
                    ))}
                </div>
                <div>
                    {renderTabContent()}
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;