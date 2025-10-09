import React, { useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';

interface TelegramUserData {
    id: number;
    first_name: string;
    last_name?: string;
    username?: string;
    photo_url?: string;
    auth_date: number;
    hash: string;
}

declare global {
    interface Window {
        onTelegramAuth: (user: TelegramUserData) => void;
    }
}

const TelegramLoginButton: React.FC = () => {
    const { loginWithTelegramWidget } = useAuth();
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!ref.current) return;

        // Define the callback function on the window object
        window.onTelegramAuth = async (user) => {
            try {
                await loginWithTelegramWidget(user);
            } catch (error) {
                console.error("Telegram login failed", error);
                alert("Login failed. Please try again.");
            }
        };

        const script = document.createElement('script');
        script.src = "https://telegram.org/js/telegram-widget.js?22";
        script.async = true;
        // The bot username should be configured here.
        script.setAttribute('data-telegram-login', 'crypcraft_bot');
        script.setAttribute('data-size', 'large');
        script.setAttribute('data-onauth', 'onTelegramAuth(user)');
        script.setAttribute('data-request-access', 'write');

        // Check if a script is already there to avoid duplicates on fast re-renders
        if (ref.current && !ref.current.querySelector('script')) {
            ref.current.appendChild(script);
        }

        return () => {
            // Cleanup the global callback function
            delete window.onTelegramAuth;
        }
    }, [loginWithTelegramWidget]);

    return <div ref={ref}></div>;
};

export default TelegramLoginButton;
