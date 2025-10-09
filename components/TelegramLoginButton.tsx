import React, { useEffect, useRef } from 'react';

const TelegramLoginButton: React.FC = () => {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!ref.current) return;

        // The onTelegramAuth function is now globally defined in AuthProvider.
        // This component's only responsibility is to render the script tag.

        const script = document.createElement('script');
        script.src = "https://telegram.org/js/telegram-widget.js?22";
        script.async = true;
        script.setAttribute('data-telegram-login', 'crypcraft_bot');
        script.setAttribute('data-size', 'large');
        // This will call the window.onTelegramAuth function set in AuthProvider
        script.setAttribute('data-onauth', 'onTelegramAuth(user)');
        script.setAttribute('data-request-access', 'write');

        // Check if a script is already there to avoid duplicates on re-renders
        if (ref.current && !ref.current.querySelector('script')) {
            ref.current.appendChild(script);
        }

    }, []); // Empty dependency array ensures this runs only once per component mount

    // This div is where the Telegram script will inject the button iframe.
    return <div ref={ref}></div>;
};

export default TelegramLoginButton;