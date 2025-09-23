import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { apiService } from '../services/apiService';
import type { Proposal, ProposalStatus, VoteChoice } from '../types';
import Spinner from '../components/Spinner';
import { useCountdown } from '../hooks/useCountdown';

// --- Вспомогательные компоненты и константы ---

const statusMap: Record<ProposalStatus, { text: string; color: string }> = {
    ACTIVE: { text: 'Активно', color: 'bg-sky-500/20 text-sky-300' },
    PASSED: { text: 'Принято', color: 'bg-green-500/20 text-green-300' },
    REJECTED: { text: 'Отклонено', color: 'bg-red-500/20 text-red-300' },
    EXECUTED: { text: 'Исполнено', color: 'bg-purple-500/20 text-purple-300' },
};

const CountdownTimer: React.FC<{ endDate: number }> = ({ endDate }) => {
    const { days, hours, minutes, seconds, isFinished } = useCountdown(endDate);
    if (isFinished) {
        return <span className="text-base-content/70">Голосование завершено</span>;
    }
    return <span className="font-mono text-lg text-primary">{`${days}д ${hours}ч ${minutes}м ${seconds}с`}</span>;
};


// --- Основной компонент страницы ---

const ProposalDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();
    const [proposal, setProposal] = useState<Proposal | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isVoting, setIsVoting] = useState(false);

    const fetchProposal = useCallback(async () => {
        if (!id) return;
        setIsLoading(true);
        try {
            const data = await apiService.getProposalById(id);
            setProposal(data);
        } catch (error) {
            console.error("Failed to fetch proposal:", error);
        } finally {
            setIsLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchProposal();
    }, [fetchProposal]);

    const handleVote = async (choice: VoteChoice) => {
        if (!id || isVoting || (proposal && user && proposal.voters[user.id])) return;
        setIsVoting(true);
        try {
            if (user) {
                const updatedProposal = await apiService.castVote(id, user.id, choice);
                setProposal(updatedProposal);
            }
        } catch (error) {
            console.error("Failed to cast vote:", error);
            alert("Не удалось проголосовать.");
        } finally {
            setIsVoting(false);
        }
    };
    
    // --- Состояния загрузки и ошибок ---

    if (isLoading) {
        return <div className="flex justify-center items-center h-96"><Spinner /></div>;
    }

    if (!proposal) {
        return <div className="text-center text-2xl text-base-content/70 mt-16">Предложение не найдено</div>;
    }
    
    // --- Проверка доступа для PRO пользователей ---

    if (user.verificationLevel !== 'PRO') {
        return (
            <div className="text-center p-8 bg-base-100 rounded-lg max-w-2xl mx-auto mt-10">
                <h1 className="text-3xl font-bold text-white mb-4">Доступ для Pro-продавцов</h1>
                <p className="text-base-content/70 mb-8">Просмотр и голосование по предложениям доступны только для пользователей со статусом PRO.</p>
                <Link to="/verify" className="bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 px-6 rounded-lg transition-colors">
                    Стать Pro-продавцом
                </Link>
            </div>
        );
    }

    // --- Подготовка данных для рендеринга ---

    const totalVotes = proposal.votesFor + proposal.votesAgainst;
    const forPercentage = totalVotes > 0 ? (proposal.votesFor / totalVotes) * 100 : 0;
    const againstPercentage = totalVotes > 0 ? (proposal.votesAgainst / totalVotes) * 100 : 0;
    const status = statusMap[proposal.status];
    const userVote = user ? proposal.voters[user.id] : undefined;
    
    const forClass = forPercentage === 100 ? 'rounded-full' : 'rounded-l-full';
    const againstClass = againstPercentage === 100 ? 'rounded-full' : 'rounded-r-full';

    return (
        <div className="container mx-auto px-4 py-8">
            {/* -- Шапка страницы -- */}
            <div className="mb-8">
                <Link to="/governance" className="text-sm text-secondary hover:text-primary mb-4 block">&larr; Вернуться ко всем предложениям</Link>
                
                {/* Адаптивный flex-контейнер для заголовка и таймера */}
                <div className="flex flex-wrap items-start justify-between gap-6">
                    <div className="flex-grow">
                        <span className={`text-sm font-bold px-3 py-1 rounded-full ${status.color}`}>{status.text}</span>
                        <h1 className="text-3xl md:text-4xl font-bold text-white mt-2">{proposal.title}</h1>
                        <div className="flex items-center gap-2 text-sm text-base-content/70 mt-3">
                            <img src={proposal.proposer.avatarUrl} alt={proposal.proposer.name} className="w-6 h-6 rounded-full"/>
                            <span>Предложено от <span className="font-semibold text-base-content">{proposal.proposer.name}</span></span>
                            <span>&bull;</span>
                            <span>{new Date(proposal.createdAt).toLocaleDateString()}</span>
                        </div>
                    </div>

                    {proposal.status === 'ACTIVE' && (
                        <div className="text-center bg-base-100 p-4 rounded-lg w-full sm:w-auto">
                            <p className="text-xs text-base-content/70 mb-1">Осталось времени:</p>
                            <CountdownTimer endDate={proposal.endsAt} />
                        </div>
                    )}
                </div>
            </div>

            {/* -- Основная сетка: Описание и Сайдбар -- */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* -- Левая колонка: Описание -- */}
                <div className="lg:col-span-2 bg-base-100 p-6 rounded-lg">
                    <h2 className="text-xl font-bold text-white mb-4">Описание предложения</h2>
                    <div className="prose prose-invert max-w-none text-base-content whitespace-pre-wrap leading-relaxed">
                        {proposal.description}
                    </div>
                </div>

                {/* -- Правая колонка (Сайдбар): Результаты и Голосование -- */}
                <div className="lg:col-span-1 space-y-6">
                    
                    {/* -- Блок с результатами -- */}
                    <div className="bg-base-100 p-6 rounded-lg">
                        <h2 className="text-xl font-bold text-white mb-4">Текущие результаты</h2>
                        <div className="space-y-2 text-sm mb-4">
                            <div className="flex justify-between items-center text-green-400">
                                <span>За</span>
                                <span className="font-mono font-semibold">{proposal.votesFor.toLocaleString()} ({forPercentage.toFixed(1)}%)</span>
                            </div>
                            <div className="flex justify-between items-center text-red-400">
                                <span>Против</span>
                                <span className="font-mono font-semibold">{proposal.votesAgainst.toLocaleString()} ({againstPercentage.toFixed(1)}%)</span>
                            </div>
                        </div>

                        {/* Улучшенный Progress Bar с использованием Flexbox */}
                        <div className="flex w-full bg-base-300 rounded-full h-2.5 overflow-hidden">
                            <div className={`bg-green-500 h-2.5 ${forClass}`} style={{ width: `${forPercentage}%` }}></div>
                            <div className={`bg-red-500 h-2.5 ${againstClass}`} style={{ width: `${againstPercentage}%` }}></div>
                        </div>

                        <p className="text-xs text-base-content/70 text-center mt-3">Всего голосов: {totalVotes.toLocaleString()}</p>
                    </div>

                    {/* -- Блок голосования -- */}
                    <div className="bg-base-100 p-6 rounded-lg">
                        <h2 className="text-xl font-bold text-white mb-4">Ваш голос</h2>
                        {proposal.status !== 'ACTIVE' ? (
                            <p className="text-base-content/70 text-center">Голосование по этому предложению завершено.</p>
                        ) : userVote ? (
                            <div className={`text-center p-4 rounded-lg font-bold text-lg ${userVote === 'FOR' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                                Вы проголосовали: {userVote === 'FOR' ? 'За' : 'Против'}
                            </div>
                        ) : (
                            // Адаптивные кнопки: столбец на мобильных, ряд на ПК
                            <div className="flex flex-col sm:flex-row gap-4">
                                <button onClick={() => handleVote('FOR')} disabled={isVoting} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                                    {isVoting ? <Spinner size="sm" /> : 'За'}
                                </button>
                                <button onClick={() => handleVote('AGAINST')} disabled={isVoting} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                                    {isVoting ? <Spinner size="sm" /> : 'Против'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProposalDetailPage;