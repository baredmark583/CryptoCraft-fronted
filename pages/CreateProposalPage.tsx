import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { apiService } from '../services/apiService';
import Spinner from '../components/Spinner';
import { useTelegramBackButton } from '../hooks/useTelegram';

const CreateProposalPage: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    useTelegramBackButton(true);

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [durationDays, setDurationDays] = useState(7);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    
    if (!user) {
        return null; // Should be handled by ProtectedRoute
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !description.trim()) {
            setError('Заголовок и описание не могут быть пустыми.');
            return;
        }

        setIsSubmitting(true);
        setError('');
        
        try {
            const endsAt = Date.now() + durationDays * 24 * 60 * 60 * 1000;
            await apiService.createProposal(title, description, endsAt);
            alert('Предложение успешно создано!');
            navigate('/governance');
        } catch (err: any) {
            setError(err.message || 'Не удалось создать предложение.');
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto bg-base-100 p-6 sm:p-8 rounded-lg shadow-xl">
            <h1 className="text-3xl font-bold text-center mb-6 text-white">Новое предложение DAO</h1>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label htmlFor="title" className="block text-sm font-medium text-base-content/70">Заголовок</label>
                    <input
                        id="title"
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="mt-1 block w-full bg-base-200 border border-base-300 rounded-md p-3"
                        placeholder="Например, 'Увеличить комиссию платформы до 3%'"
                        required
                    />
                </div>
                 <div>
                    <label htmlFor="description" className="block text-sm font-medium text-base-content/70">Подробное описание</label>
                    <textarea
                        id="description"
                        rows={8}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="mt-1 block w-full bg-base-200 border border-base-300 rounded-md p-3"
                        placeholder="Опишите суть вашего предложения, его цели и ожидаемые результаты..."
                        required
                    />
                </div>
                 <div>
                    <label htmlFor="duration" className="block text-sm font-medium text-base-content/70">Длительность голосования</label>
                    <select
                        id="duration"
                        value={durationDays}
                        onChange={(e) => setDurationDays(Number(e.target.value))}
                        className="mt-1 block w-full bg-base-200 border border-base-300 rounded-md p-3"
                    >
                        <option value={3}>3 дня</option>
                        <option value={7}>7 дней</option>
                        <option value={14}>14 дней</option>
                    </select>
                </div>
                {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                <div>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full flex justify-center py-3 px-4 bg-primary hover:bg-primary-focus text-white font-bold rounded-lg text-lg disabled:bg-gray-500"
                    >
                        {isSubmitting ? <Spinner size="sm" /> : 'Опубликовать предложение'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CreateProposalPage;
