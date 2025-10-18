import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import type { User } from '../types';
import type { DashboardTabType } from '../pages/DashboardPage';
import DynamicIcon from './DynamicIcon';

const TABS: { id: DashboardTabType; label: string; iconName: string; }[] = [
    // FIX: Changed 'dashboard' to 'summary' to match DashboardTabType.
    { id: 'summary', label: 'Сводка', iconName: 'dashboard' },
    // FIX: Changed 'listings' to 'products' to match DashboardTabType.
    { id: 'products', label: 'Товары', iconName: 'listings' },
    { id: 'workshop', label: 'Мастерская', iconName: 'workshop' },
    // FIX: Changed 'wishlist' to 'favorites' to match DashboardTabType.
    { id: 'favorites', label: 'Избранное', iconName: 'wishlist-heart' },
    { id: 'collections', label: 'Коллекции', iconName: 'collection-add' },
    { id: 'purchases', label: 'Мои покупки', iconName: 'purchases' },
    { id: 'sales', label: 'Мои продажи', iconName: 'sales' },
    { id: 'analytics', label: 'Аналитика', iconName: 'analytics' },
    { id: 'wallet', label: 'Кошелек', iconName: 'wallet' },
    { id: 'settings', label: 'Настройки', iconName: 'settings' },
];

interface DashboardSidebarProps {
    user: User;
    activeTab: DashboardTabType;
    setActiveTab: (tab: DashboardTabType) => void;
}

const DashboardSidebar: React.FC<DashboardSidebarProps> = ({ user, activeTab, setActiveTab }) => {
    const { logout } = useAuth();
    
    return (
        <aside className="bg-base-100 p-4 rounded-lg shadow-lg sticky top-24 flex flex-col h-[calc(100vh-7rem)]">
            <div className="flex items-center gap-4 mb-6">
                <img src={user.avatarUrl} alt={user.name} className="w-16 h-16 rounded-full border-2 border-primary"/>
                <div>
                    <h2 className="text-xl font-bold text-white">{user.name}</h2>
                    <p className="text-sm text-base-content/70">Продавец</p>
                </div>
            </div>

            <nav className="flex-1 overflow-y-auto pr-2">
                <ul className="space-y-1">
                    {TABS.map(tab => (
                        <li key={tab.id}>
                            <button
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full flex items-center gap-3 p-3 text-left rounded-md transition-colors ${
                                    activeTab === tab.id
                                        ? 'bg-primary text-primary-content font-bold'
                                        : 'text-base-content/80 hover:bg-base-300'
                                }`}
                            >
                                <DynamicIcon name={tab.iconName} className="h-5 w-5" />
                                <span>{tab.label}</span>
                            </button>
                        </li>
                    ))}
                    <div className="divider my-2 text-sm text-base-content/70 before:bg-base-300 after:bg-base-300">Платформа</div>
                    <li>
                        <Link
                            to="/governance"
                            className="w-full flex items-center gap-3 p-3 text-left rounded-md transition-colors text-base-content/80 hover:bg-base-300"
                        >
                            <DynamicIcon name="dao-governance" className="h-5 w-5" />
                            <span>Управление DAO</span>
                        </Link>
                    </li>
                    <li>
                        <Link
                            to="/live/create"
                            className="w-full flex items-center gap-3 p-3 text-left rounded-md transition-colors text-base-content/80 hover:bg-base-300"
                        >
                            <DynamicIcon name="start-livestream" className="h-5 w-5" />
                            <span>Прямой эфир</span>
                        </Link>
                    </li>
                </ul>
            </nav>
            <div className="mt-4 border-t border-base-300 pt-4">
                 <button
                    onClick={logout}
                    className="w-full flex items-center gap-3 p-3 text-left rounded-md transition-colors text-red-400 hover:bg-red-500/20"
                >
                    <DynamicIcon name="logout" className="h-5 w-5"/>
                    <span>Выйти</span>
                </button>
            </div>
        </aside>
    );
};

export default DashboardSidebar;