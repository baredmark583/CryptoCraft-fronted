import React from 'react';
import { NavLink } from 'react-router-dom';

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
            `flex flex-col items-center justify-center w-full text-xs transition-colors ${isActive ? 'text-brand-primary' : 'text-brand-text-secondary hover:text-white'}`
        }
    >
        {children}
    </NavLink>
);


const MobileNavBar: React.FC = () => {
    return (
        <nav className="block md:hidden fixed bottom-0 left-0 right-0 h-16 bg-brand-surface/90 backdrop-blur-lg border-t border-brand-border z-40 flex items-center justify-around px-2">
            <NavItem to="/" exact={true}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                <span>Главная</span>
            </NavItem>
            <NavItem to="/products">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
                <span>Каталог</span>
            </NavItem>
            <NavLink to="/create" className="flex items-center justify-center w-16 h-16 -mt-8 bg-brand-primary hover:bg-brand-primary-hover rounded-full shadow-lg text-white">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
            </NavLink>
            <NavItem to="/chat">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mb-1" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <span>Чаты</span>
            </NavItem>
            <NavItem to="/profile">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                <span>Профиль</span>
            </NavItem>
        </nav>
    );
};

export default MobileNavBar;