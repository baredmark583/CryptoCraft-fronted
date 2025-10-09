import React from 'react';
import TelegramLoginButton from './TelegramLoginButton';

interface LoginModalProps {
    onClose: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ onClose }) => {
    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-base-100 rounded-2xl shadow-2xl w-full max-w-sm border border-base-300 text-center" onClick={e => e.stopPropagation()}>
                <div className="p-8">
                    <h2 className="text-2xl font-bold text-white mb-4">Вход в CryptoCraft</h2>
                    <p className="text-base-content/70 mb-6">Войдите через Telegram, чтобы получить доступ ко всем функциям.</p>
                    <div className="flex justify-center">
                         <TelegramLoginButton />
                    </div>
                    <p className="text-xs text-base-content/50 mt-4">
                        Видите ошибку "Bot domain invalid"? Убедитесь, что домен этого сайта добавлен в настройках вашего бота через @BotFather.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginModal;