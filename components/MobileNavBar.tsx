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
                <DynamicIcon name="mobile-nav-home" className="h-6 w-6 mb-1" fallback={
                    <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24"><path fill="currentColor" d="M10 20v-6h4v6h5v-8h3L12 3L2 12h3v8z"></path></svg>
                }/>
                <span>Главная</span>
            </NavItem>
            <NavItem to="/products">
                 <DynamicIcon name="mobile-nav-catalog" className="h-6 w-6 mb-1" fallback={
                    <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24"><path fill="currentColor" d="M3 3h8v8H3zm10 0h8v8h-8zM3 13h8v8H3zm10 10h8v-8h-8z"></path></svg>
                }/>
                <span>Каталог</span>
            </NavItem>
             <NavLink to="/create" className="flex-1 h-full flex flex-col items-center justify-center" aria-label="Создать объявление">
                <div className="flex items-center justify-center h-12 w-16 bg-primary rounded-2xl text-primary-content animate-pulse-primary shadow-lg shadow-primary/30">
                     <DynamicIcon name="add-item-plus" className="h-7 w-7" fallback={
                        <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24"><path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6z"></path></svg>
                     }/>
                </div>
            </NavLink>
            <NavItem to="/chat">
                <DynamicIcon name="chat" className="h-6 w-6 mb-1" fallback={
                    <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24"><path fill="currentColor" d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2m0 14H5.2L4 17.2V4h16z"></path></svg>
                }/>
                <span>Чаты</span>
            </NavItem>
            <NavItem to="/profile">
                <DynamicIcon name="mobile-nav-profile" className="h-6 w-6 mb-1" fallback={
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                }/>
                <span>Профиль</span>
            </NavItem>
        </nav>
    );
};

export default MobileNavBar;