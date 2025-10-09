import React from 'react';
import { useAuth } from '../hooks/useAuth';
import Spinner from './Spinner';
import TelegramLoginButton from './TelegramLoginButton';
import { useAppContext } from '../hooks/useAppContext';

const WebLoginPromptPage: React.FC = () => (
  <div className="text-center py-20 max-w-lg mx-auto">
    <h1 className="text-3xl font-bold text-white mb-4">Требуется авторизация</h1>
    <p className="text-base-content/70 mb-8">Пожалуйста, войдите в свой аккаунт, чтобы получить доступ к этой странице.</p>
    <div className="inline-block">
        <TelegramLoginButton />
    </div>
  </div>
);

const TwaLoginPromptPage: React.FC = () => (
    <div className="text-center py-20 max-w-lg mx-auto">
        <h1 className="text-3xl font-bold text-white mb-4">Ошибка авторизации</h1>
        <p className="text-base-content/70 mb-8">Не удалось автоматически войти в ваш аккаунт Telegram. Пожалуйста, попробуйте перезапустить приложение.</p>
        <p className="text-sm text-base-content/60">Если проблема не исчезнет, возможно, возникли временные неполадки на сервере или в настройках бота.</p>
    </div>
);


const ProtectedRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
    const { user, isLoading } = useAuth();
    const { isTwa } = useAppContext();

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-96">
                <Spinner size="lg" />
            </div>
        );
    }

    if (!user) {
        if (isTwa) {
            return <TwaLoginPromptPage />;
        }
        return <WebLoginPromptPage />;
    }

    return children;
};

export default ProtectedRoute;