import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
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
    const navigate = useNavigate();

    return (
        <nav className="block md:hidden fixed bottom-0 left-0 right-0 h-16 bg-base-200/90 backdrop-blur-lg border-t border-base-300 z-40 flex items-center">
            <button 
                onClick={() => navigate(-1)} 
                className="flex flex-col items-center justify-center flex-1 text-xs transition-colors h-full text-base-content/70 hover:text-base-content"
            >
                <DynamicIcon name="back-arrow" className="h-6 w-6 mb-1" fallback={
                    <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24"><path fill="currentColor" d="M20 11v2H8l5.5 5.5l-1.42 1.42L4.16 12l7.92-7.92L13.5 5.5L8 11z"></path></svg>
                }/>
                <span>Назад</span>
            </button>
            <NavItem to="/" exact={true}>
                <DynamicIcon name="mobile-nav-home" className="h-6 w-6 mb-1" fallback={
                    <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24"><path fill="currentColor" d="M10 20v-6h4v6h5v-8h3L12 3L2 12h3v8z"></path></svg>
                }/>
                <span>Главная</span>
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
            <NavItem to="/dashboard">
                 <DynamicIcon name="dashboard" className="h-6 w-6 mb-1" fallback={
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 8.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 018.25 20.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6A2.25 2.25 0 0115.75 3.75h2.25A2.25 2.25 0 0120.25 6v2.25a2.25 2.25 0 01-2.25 2.25H15.75A2.25 2.25 0 0113.5 8.25V6zM13.5 15.75A2.25 2.25 0 0115.75 13.5h2.25a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                    </svg>
                }/>
                <span>Панель</span>
            </NavItem>
        </nav>
    );
};

export default MobileNavBar;