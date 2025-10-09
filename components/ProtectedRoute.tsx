import React from 'react';
import { useAuth } from '../hooks/useAuth';
import Spinner from './Spinner';
import TelegramLoginButton from './TelegramLoginButton';

const LoginPromptPage: React.FC = () => (
  <div className="text-center py-20 max-w-lg mx-auto">
    <h1 className="text-3xl font-bold text-white mb-4">Требуется авторизация</h1>
    <p className="text-base-content/70 mb-8">Пожалуйста, войдите в свой аккаунт, чтобы получить доступ к этой странице.</p>
    <div className="inline-block">
        <TelegramLoginButton />
    </div>
  </div>
);

const ProtectedRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
    const { user, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-96">
                <Spinner size="lg" />
            </div>
        );
    }

    if (!user) {
        return <LoginPromptPage />;
    }

    return children;
};

export default ProtectedRoute;