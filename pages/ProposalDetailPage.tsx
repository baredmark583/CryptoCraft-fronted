import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { apiService } from '../services/apiService';
import type { Proposal, VoteChoice } from '../types';
import Spinner from '../components/Spinner';
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
    return <span className="font-mono text-primary">{`${days}д ${hours}ч ${minutes}м до конца`}</span>;
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
        apiService.getProposalById(id)
            .then(data => setProposal(data))
            .catch(err => console.error(err))
            .finally(() => setIsLoading(false));
    }, [id]);
    
    const handleVote = async (choice: VoteChoice) => {
        if (!id || isVoting || proposal?.status !== 'ACTIVE') return;
        setIsVoting(true);
        try {
            const updatedProposal = await apiService.castVote(id, user.id, choice);
            setProposal(updatedProposal);
        } catch (error) {
            console.error("Failed to cast vote", error);
            alert("Не удалось проголосовать.");
        } finally {
            setIsVoting(false);
        }
    };
    
    const userVote = proposal?.voters[user.id];
    const canVote = user.verificationLevel === 'PRO' && proposal?.status === 'ACTIVE' && !userVote;

    if (isLoading) {
        return <div className="flex justify-center items-center h-96"><Spinner /></div>;
    }

    if (!proposal) {
        return <div className="text-center text-xl text-base-content/70">Предложение не найдено.</div>;
    }
    
    const totalVotes = proposal.votesFor + proposal.votesAgainst;
    const forPercentage = totalVotes > 0 ? (proposal.votesFor / totalVotes) * 100 : 0;
    const againstPercentage = totalVotes > 0 ? (proposal.votesAgainst / totalVotes) * 100 : 0;
    const status = statusMap[proposal.status];

    return (
        <div className="max-w-3xl mx-auto">
            <div className="mb-6">
                <Link to="/governance" className="text-sm text-secondary hover:text-primary mb-4 block">&larr; Вернуться к списку</Link>
                <div className="flex justify-between items-start mb-2">
                     <span className={`text-sm font-bold px-3 py-1 rounded-full ${status.color}`}>{status.text}</span>
                     {proposal.status === 'ACTIVE' && <CountdownTimer endDate={proposal.endsAt} />}
                </div>
                <h1 className="text-3xl font-bold text-white mt-2">{proposal.title}</h1>
                <div className="flex items-center gap-2 text-sm text-base-content/70 mt-2">
                    <img src={proposal.proposer.avatarUrl} alt={proposal.proposer.name} className="w-6 h-6 rounded-full"/>
                    <span>Предложено от <span className="font-semibold text-base-content">{proposal.proposer.name}</span></span>
                </div>
            </div>
            
            <div className="bg-base-100 p-6 rounded-lg mb-8">
                <h2 className="text-xl font-bold text-white mb-4">Описание предложения</h2>
                <p className="text-base-content/80 whitespace-pre-wrap leading-relaxed">{proposal.description}</p>
            </div>
            
            <div className="bg-base-100 p-6 rounded-lg">
                <h2 className="text-xl font-bold text-white mb-4">Голосование</h2>
                 <div className="w-full bg-base-200 rounded-full h-4 mb-2 overflow-hidden flex">
                    <div className="bg-green-500 h-4" style={{ width: `${forPercentage}%` }} title={`За: ${forPercentage.toFixed(1)}%`}></div>
                    <div className="bg-red-500 h-4" style={{ width: `${againstPercentage}%` }} title={`Против: ${againstPercentage.toFixed(1)}%`}></div>
                </div>
                 <div className="flex justify-between text-sm mb-4">
                    <div className="text-green-400">
                        <span className="font-bold">ЗА:</span> {proposal.votesFor.toLocaleString()}
                    </div>
                     <div className="text-red-400">
                        <span className="font-bold">ПРОТИВ:</span> {proposal.votesAgainst.toLocaleString()}
                    </div>
                </div>

                {userVote && (
                    <div className="text-center p-4 bg-base-200 rounded-lg">
                        <p className="text-base-content">Вы проголосовали: <span className={`font-bold ${userVote === 'FOR' ? 'text-green-400' : 'text-red-400'}`}>{userVote === 'FOR' ? 'ЗА' : 'ПРОТИВ'}</span></p>
                    </div>
                )}
                
                {canVote && (
                    <div className="flex gap-4 mt-6">
                        <button onClick={() => handleVote('FOR')} disabled={isVoting} className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg flex justify-center items-center disabled:bg-gray-500">
                           {isVoting ? <Spinner size="sm"/> : 'Голосовать ЗА'}
                        </button>
                         <button onClick={() => handleVote('AGAINST')} disabled={isVoting} className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg flex justify-center items-center disabled:bg-gray-500">
                           {isVoting ? <Spinner size="sm"/> : 'Голосовать ПРОТИВ'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProposalDetailPage;
