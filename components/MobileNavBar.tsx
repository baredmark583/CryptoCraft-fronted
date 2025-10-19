import React from 'react';
import { NavLink } from 'react-router-dom';
import DynamicIcon from './DynamicIcon';
import { useAuth } from '../hooks/useAuth';

interface NavItemProps {
    to: string;
    label: string;
    iconName: string;
}

const NavItem: React.FC<NavItemProps> = ({ to, label, iconName }) => (
    <NavLink 
        to={to} 
        end={to === "/"}
        className={({ isActive }) => 
            `flex flex-col items-center justify-center flex-1 text-xs transition-colors h-full ${isActive ? 'text-primary' : 'text-base-content/70 hover:text-base-content'}`
        }
    >
        <DynamicIcon name={iconName} className="h-6 w-6 mb-1" />
        <span>{label}</span>
    </NavLink>
);


const MobileNavBar: React.FC = () => {
    const { user } = useAuth();

    return (
        <nav className="block md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white/90 backdrop-blur-lg border-t border-amber-200/80 z-40 flex items-center">
            <NavItem to="/" label="Главная" iconName="mobile-nav-home" />
            <NavItem to="/community" label="Сообщество" iconName="community" />
             <NavLink to="/create" className="flex-1 h-full flex flex-col items-center justify-center" aria-label="Создать объявление">
                <div className="flex items-center justify-center h-12 w-16 bg-primary rounded-2xl text-primary-content shadow-lg shadow-primary/30">
                     <DynamicIcon name="add-item-plus" className="h-7 w-7" />
                </div>
            </NavLink>
            <NavItem to="/chat" label="Чаты" iconName="chat" />
            <NavItem to={user ? "/dashboard" : "/"} label={user ? "Кабинет" : "Войти"} iconName="mobile-nav-profile" />
        </nav>
    );
};

export default MobileNavBar;