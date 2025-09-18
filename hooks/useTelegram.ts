import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const getTelegram = () => {
    if (typeof window !== 'undefined') {
        return (window as any).Telegram?.WebApp;
    }
    return null;
}

export const useTelegram = () => {
    const tg = getTelegram();

    const onClose = () => {
        tg?.close();
    }
    
    return {
        tg,
        onClose,
        user: tg?.initDataUnsafe?.user,
    }
}

export const useTelegramBackButton = (isVisible: boolean) => {
    const navigate = useNavigate();
    const { tg } = useTelegram();

    useEffect(() => {
        const backButton = tg?.BackButton;
        if (!backButton) {
            return;
        }

        const handleBackClick = () => {
            navigate(-1);
        };

        if (isVisible) {
            backButton.show();
            backButton.onClick(handleBackClick);
        } else {
            backButton.hide();
            // Important: remove listener when hiding
            backButton.offClick(handleBackClick);
        }

        // Cleanup on component unmount
        return () => {
            if (backButton) {
                backButton.offClick(handleBackClick);
                backButton.hide();
            }
        };
    }, [isVisible, navigate, tg]);
};
