import React from 'react';
import { NavLink } from 'react-router-dom';
import DynamicIcon from './DynamicIcon';

interface NavItemProps {
    to: string;
    children: React.ReactNode;
    exact?: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ to, children, exact = false }) => (
    <NavLink 
        to={to} 
        end={exact}
        className={({ isActive }) => 
            `flex flex-col items-center justify-center flex-1 text-xs transition-colors h-full ${isActive ? 'text-primary' : 'text-base-content/70 hover:text-base-content'}`
        }
    >
        {children}
    </NavLink>
);


const MobileNavBar: React.FC = () => {
    return (
        <nav className="block md:hidden fixed bottom-0 left-0 right-0 h-16 bg-base-200/90 backdrop-blur-lg border-t border-base-300 z-40 flex items-center">
            <NavItem to="/" exact={true}>
                <DynamicIcon name="mobile-nav-home" className="h-6 w-6 mb-1" />
                <span>Главная</span>
            </NavItem>
            <NavItem to="/community">
                <DynamicIcon name="community" className="h-6 w-6 mb-1" />
                <span>Сообщество</span>
            </NavItem>
             <NavLink to="/create" className="flex-1 h-full flex flex-col items-center justify-center" aria-label="Создать объявление">
                <div className="flex items-center justify-center h-12 w-16 bg-primary rounded-2xl text-primary-content animate-pulse-primary shadow-lg shadow-primary/30">
                     <DynamicIcon name="add-item-plus" className="h-7 w-7" />
                </div>
            </NavLink>
            <NavItem to="/chat">
                <DynamicIcon name="chat" className="h-6 w-6 mb-1" />
                <span>Чаты</span>
            </NavItem>
            <NavItem to="/dashboard">
                 <DynamicIcon name="dashboard" className="h-6 w-6 mb-1" />
                <span>Панель</span>
            </NavItem>
        </nav>
    );
};

export default MobileNavBar;