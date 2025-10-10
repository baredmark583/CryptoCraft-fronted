import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { apiService } from '../services/apiService';
import type { Product } from '../types';

import Spinner from '../components/Spinner';
import DashboardSidebar from '../components/DashboardSidebar';
import DashboardTab from '../components/DashboardTab';
import ListingsTab from '../components/ListingsTab';
import WorkshopTab from '../components/WorkshopTab';
import WishlistTab from '../components/WishlistTab';
import CollectionsTab from '../components/CollectionsTab';
import PurchasesTab from '../components/PurchasesTab';
import SalesTab from '../components/SalesTab';
import AnalyticsDashboard from '../components/AnalyticsDashboard';
import WalletTab from '../components/WalletTab';
import SettingsTab from '../components/SettingsTab';

export type DashboardTabType = 'dashboard' | 'listings' | 'workshop' | 'wishlist' | 'collections' | 'purchases' | 'sales' | 'analytics' | 'wallet' | 'settings';

const DashboardPage: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    const [userProducts, setUserProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const activeTab = (searchParams.get('tab') as DashboardTabType) || 'dashboard';

    const setActiveTab = (tab: DashboardTabType) => {
        setSearchParams({ tab });
    };

    useEffect(() => {
        const fetchProfileData = async () => {
            if (!user) {
                setIsLoading(false);
                return;
            }
            setIsLoading(true);
            try {
                const products = await apiService.getProductsBySellerId(user.id);
                setUserProducts(products);
            } catch (error) {
                console.error("Failed to fetch user products:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchProfileData();
    }, [user]);
    
    const handleProductUpdate = (updatedProduct: Product) => {
        setUserProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
    };

    const renderTabContent = () => {
        if (isLoading) {
            return <div className="flex justify-center items-center h-96"><Spinner /></div>;
        }
        if (!user) return null;

        switch (activeTab) {
            case 'dashboard':
                return <DashboardTab />;
            case 'listings':
                return <ListingsTab products={userProducts} isOwnProfile={true} onProductUpdate={handleProductUpdate} />;
            case 'workshop':
                return <WorkshopTab user={user} />;
            case 'wishlist':
                return <WishlistTab />;
            case 'collections':
                 return <CollectionsTab />;
            case 'purchases':
                return <PurchasesTab />;
            case 'sales':
                return <SalesTab />;
            case 'analytics':
                return <AnalyticsDashboard sellerId={user.id} />;
            case 'wallet':
                return <WalletTab user={user} />;
            case 'settings':
                return <SettingsTab user={user} />;
            default:
                return <DashboardTab />;
        }
    };
    
    if (!user) return <div className="flex justify-center py-16"><Spinner size="lg"/></div>;

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <aside className="md:col-span-1">
                <DashboardSidebar 
                    user={user}
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                />
            </aside>
            <main className="md:col-span-3">
                 <div className="bg-base-100 p-4 sm:p-6 rounded-lg shadow-lg min-h-[400px]">
                    {renderTabContent()}
                </div>
            </main>
        </div>
    );
};

export default DashboardPage;