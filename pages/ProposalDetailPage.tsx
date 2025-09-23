import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { apiService } from '../services/apiService';
import type { Proposal, ProposalStatus, VoteChoice } from '../types';
import Spinner from '../components/Spinner';
import { useCountdown } from '../hooks/useCountdown';

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
    return <span className="font-mono text-primary">{`${days}д ${hours}ч ${minutes}м ${seconds}с`}</span>;
};

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
        if (!id || isVoting || proposal?.voters[user.id]) return;
        setIsVoting(true);
        try {
            const updatedProposal = await apiService.castVote(id, user.id, choice);
            setProposal(updatedProposal);
        } catch (error) {
            console.error("Failed to cast vote:", error);
            alert("Не удалось проголосовать.");
        } finally {
            setIsVoting(false);
        }
    };
    
    if (isLoading) {
        return <div className="flex justify-center items-center h-96"><Spinner /></div>;
    }

    if (!proposal) {
        return <div className="text-center text-2xl text-base-content/70 mt-16">Предложение не найдено</div>;
    }
    
    if (user.verificationLevel !== 'PRO') {
         return (
             <div className="text-center py-20 bg-base-100 rounded-lg">
                <h1 className="text-3xl font-bold text-white mb-4">Доступ для Pro-продавцов</h1>
                <p className="text-base-content/70 mb-8">Просмотр и голосование по предложениям доступны только для пользователей со статусом PRO.</p>
                <Link to="/verify" className="bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 px-6 rounded-lg transition-colors">
                    Стать Pro-продавцом
                </Link>
            </div>
        );
    }

    const totalVotes = proposal.votesFor + proposal.votesAgainst;
    const forPercentage = totalVotes > 0 ? (proposal.votesFor / totalVotes) * 100 : 0;
    const againstPercentage = totalVotes > 0 ? (proposal.votesAgainst / totalVotes) * 100 : 0;
    const status = statusMap[proposal.status];
    const userVote = proposal.voters[user.id];

    return (
        <div>
            <div className="mb-8">
                <Link to="/governance" className="text-sm text-secondary hover:text-primary mb-4 block">&larr; Вернуться ко всем предложениям</Link>
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                    <div>
                        <span className={`text-sm font-bold px-3 py-1 rounded-full ${status.color}`}>{status.text}</span>
                        <h1 className="text-3xl font-bold text-white mt-2">{proposal.title}</h1>
                        <div className="flex items-center gap-2 text-sm text-base-content/70 mt-2">
                            <img src={proposal.proposer.avatarUrl} alt={proposal.proposer.name} className="w-6 h-6 rounded-full"/>
                            <span>Предложено от <span className="font-semibold text-base-content">{proposal.proposer.name}</span></span>
                            <span>&bull;</span>
                            <span>{new Date(proposal.createdAt).toLocaleDateString()}</span>
                        </div>
                    </div>
                     {proposal.status === 'ACTIVE' && (
                        <div className="text-center bg-base-100 p-3 rounded-lg flex-shrink-0">
                             <p className="text-xs text-base-content/70">Осталось времени:</p>
                             <CountdownTimer endDate={proposal.endsAt} />
                        </div>
                     )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-base-100 p-6 rounded-lg">
                    <h2 className="text-xl font-bold text-white mb-4">Описание предложения</h2>
                    <p className="text-base-content whitespace-pre-wrap leading-relaxed">{proposal.description}</p>
                </div>
                <div className="lg:col-span-1 space-y-6">
                     <div className="bg-base-100 p-6 rounded-lg">
                         <h2 className="text-xl font-bold text-white mb-4">Текущие результаты</h2>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between items-center text-green-400">
                                <span>За</span>
                                <span className="font-mono">{proposal.votesFor.toLocaleString()} ({forPercentage.toFixed(1)}%)</span>
                            </div>
                             <div className="flex justify-between items-center text-red-400">
                                <span>Против</span>
                                <span className="font-mono">{proposal.votesAgainst.toLocaleString()} ({againstPercentage.toFixed(1)}%)</span>
                            </div>
                        </div>
                         <div className="w-full bg-base-200 rounded-full h-2.5 mt-3 overflow-hidden">
                            <div className="bg-green-500 h-2.5 rounded-l-full" style={{ width: `${forPercentage}%` }}></div>
                             <div className="bg-red-500 h-2.5 rounded-r-full" style={{ width: `${againstPercentage}%`, marginLeft: `${forPercentage}%`, marginTop: "-10px" }}></div>
                        </div>
                        <p className="text-xs text-base-content/70 text-center mt-2">Всего голосов: {totalVotes.toLocaleString()}</p>
                    </div>

                     <div className="bg-base-100 p-6 rounded-lg">
                         <h2 className="text-xl font-bold text-white mb-4">Ваш голос</h2>
                         {proposal.status !== 'ACTIVE' ? (
                              <p className="text-base-content/70 text-center">Голосование по этому предложению завершено.</p>
                         ) : userVote ? (
                             <div className={`text-center p-4 rounded-lg font-bold text-lg ${userVote === 'FOR' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                                Вы проголосовали: {userVote === 'FOR' ? 'За' : 'Против'}
                             </div>
                         ) : (
                            <div className="flex gap-4">
                                <button onClick={() => handleVote('FOR')} disabled={isVoting} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg flex items-center justify-center disabled:bg-gray-500">
                                    {isVoting ? <Spinner size="sm" /> : 'За'}
                                </button>
                                <button onClick={() => handleVote('AGAINST')} disabled={isVoting} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg flex items-center justify-center disabled:bg-gray-500">
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