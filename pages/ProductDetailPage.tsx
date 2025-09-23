import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiService } from '../services/apiService';
import type { Proposal, VoteChoice } from '../types';
import Spinner from '../components/Spinner';
import { useAuth } from '../hooks/useAuth';
import { useCountdown } from '../hooks/useCountdown';
import { useTelegramBackButton } from '../hooks/useTelegram';

const statusMap: Record<Proposal['status'], { text: string; color: string }> = {
    ACTIVE: { text: 'Активно', color: 'bg-sky-500/20 text-sky-300' },
    PASSED: { text: 'Принято', color: 'bg-green-500/20 text-green-300' },
    REJECTED: { text: 'Отклонено', color: 'bg-red-500/20 text-red-300' },
    EXECUTED: { text: 'Исполнено', color: 'bg-purple-500/20 text-purple-300' },
};

const CountdownTimer: React.FC<{ endDate: number }> = ({ endDate }) => {
    const { days, hours, minutes, isFinished } = useCountdown(endDate);
    if (isFinished) {
        return <span className="text-base-content/70">Голосование завершено</span>;
    }
    return <span className="font-mono text-primary">{`${days}д ${hours}ч ${minutes}м`}</span>;
};


const ProposalDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();
    const [proposal, setProposal] = useState<Proposal | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isVoting, setIsVoting] = useState(false);

    useTelegramBackButton(true);

    useEffect(() => {
        if (!id) return;
        const fetchProposal = async () => {
            setIsLoading(true);
            try {
                const data = await apiService.getProposalById(id);
                setProposal(data);
            } catch (error) {
                console.error("Failed to fetch proposal:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchProposal();
    }, [id]);

    const userVote = useMemo(() => {
        if (!proposal) return null;
        return proposal.voters[user.id];
    }, [proposal, user.id]);

    const handleVote = async (choice: VoteChoice) => {
        if (!id || !proposal || proposal.status !== 'ACTIVE' || userVote) return;
        setIsVoting(true);

        const originalProposal = { ...proposal };

        // Optimistic update
        const newProposal = { ...proposal, voters: { ...proposal.voters, [user.id]: choice } };
        if (!originalProposal.voters[user.id]) { // Only update counts if user hasn't voted before
            if (choice === 'FOR') newProposal.votesFor += 1;
            if (choice === 'AGAINST') newProposal.votesAgainst += 1;
        }
        setProposal(newProposal);

        try {
            await apiService.castVote(id, user.id, choice);
        } catch (error) {
            console.error("Failed to cast vote:", error);
            alert("Не удалось проголосовать.");
            setProposal(originalProposal); // Revert on failure
        } finally {
            setIsVoting(false);
        }
    };
    
    if (isLoading) {
        return <div className="flex justify-center items-center h-96"><Spinner /></div>;
    }

    if (!proposal) {
        return <div className="text-center text-xl text-base-content/70">Предложение не найдено.</div>;
    }

    const totalVotes = proposal.votesFor + proposal.votesAgainst;
    const forPercentage = totalVotes > 0 ? (proposal.votesFor / totalVotes) * 100 : 0;
    const againstPercentage = totalVotes > 0 ? 100 - forPercentage : 0;
    const status = statusMap[proposal.status];

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-6">
                <Link to="/governance" className="text-sm text-secondary hover:text-primary mb-4 block">&larr; Вернуться к управлению</Link>
                <div className="flex justify-between items-start">
                    <div>
                        <span className={`text-sm font-bold px-3 py-1.5 rounded-full ${status.color}`}>{status.text}</span>
                        <h1 className="text-3xl font-bold text-white mt-3">{proposal.title}</h1>
                    </div>
                    {proposal.status === 'ACTIVE' && (
                        <div className="text-right">
                             <p className="text-sm text-base-content/70">Завершится через:</p>
                             <CountdownTimer endDate={proposal.endsAt} />
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-base-100 p-6 rounded-lg space-y-6">
                    <div>
                        <h2 className="text-xl font-bold text-white mb-2">Описание предложения</h2>
                        <p className="text-base-content/80 whitespace-pre-wrap leading-relaxed">{proposal.description}</p>
                    </div>
                </div>

                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-base-100 p-6 rounded-lg">
                        <h3 className="text-lg font-bold text-white mb-4">Предложено от</h3>
                        <div className="flex items-center gap-3">
                            <img src={proposal.proposer.avatarUrl} alt={proposal.proposer.name} className="w-12 h-12 rounded-full"/>
                            <div>
                                <p className="font-semibold text-white">{proposal.proposer.name}</p>
                                <p className="text-xs text-base-content/70">Создано: {new Date(proposal.createdAt).toLocaleDateString()}</p>
                            </div>
                        </div>
                    </div>
                     <div className="bg-base-100 p-6 rounded-lg">
                        <h3 className="text-lg font-bold text-white mb-4">Текущие результаты</h3>
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
                         <div className="w-full bg-base-200 rounded-full h-2.5 mt-3">
                            <div className="bg-green-500 h-2.5 rounded-l-full" style={{ width: `${forPercentage}%` }}></div>
                         </div>
                    </div>
                    {proposal.status === 'ACTIVE' && (
                         <div className="bg-base-100 p-6 rounded-lg">
                            <h3 className="text-lg font-bold text-white mb-4">Ваш голос</h3>
                            {userVote ? (
                                <p className="text-center text-base-content">Вы проголосовали: <span className={`font-bold ${userVote === 'FOR' ? 'text-green-400' : 'text-red-400'}`}>{userVote === 'FOR' ? 'ЗА' : 'ПРОТИВ'}</span></p>
                            ) : (
                                <div className="flex gap-4">
                                    <button onClick={() => handleVote('FOR')} disabled={isVoting} className="w-full flex justify-center py-3 px-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg disabled:bg-gray-500">
                                        {isVoting ? <Spinner size="sm"/> : 'За'}
                                    </button>
                                     <button onClick={() => handleVote('AGAINST')} disabled={isVoting} className="w-full flex justify-center py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg disabled:bg-gray-500">
                                        {isVoting ? <Spinner size="sm"/> : 'Против'}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProposalDetailPage;
