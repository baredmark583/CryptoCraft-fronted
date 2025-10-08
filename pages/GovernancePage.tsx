import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { apiService } from '../services/apiService';
import type { Proposal, ProposalStatus } from '../types';
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
    return <span className="font-mono text-primary">{`${days}д ${hours}ч ${minutes}м`}</span>;
};

const ProposalCard: React.FC<{ proposal: Proposal }> = ({ proposal }) => {
    const totalVotes = proposal.votesFor + proposal.votesAgainst;
    const forPercentage = totalVotes > 0 ? (proposal.votesFor / totalVotes) * 100 : 0;
    const againstPercentage = totalVotes > 0 ? (proposal.votesAgainst / totalVotes) * 100 : 0;
    const status = statusMap[proposal.status];

    return (
        <Link to={`/proposal/${proposal.id}`} className="block bg-base-100 p-6 rounded-lg hover:bg-base-300/50 transition-colors shadow-lg">
            <div className="flex justify-between items-start mb-3">
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${status.color}`}>{status.text}</span>
                {proposal.status === 'ACTIVE' && <CountdownTimer endDate={proposal.endsAt} />}
            </div>
            <h3 className="text-xl font-bold text-white mb-2">{proposal.title}</h3>
            <div className="flex items-center gap-2 text-sm text-base-content/70 mb-4">
                <img src={proposal.proposer.avatarUrl} alt={proposal.proposer.name} className="w-6 h-6 rounded-full"/>
                <span>Предложено от <span className="font-semibold text-base-content">{proposal.proposer.name}</span></span>
            </div>
            
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
             <div className="w-full bg-base-200 rounded-full h-2.5 mt-2 overflow-hidden">
                <div className="bg-green-500 h-2.5 rounded-l-full" style={{ width: `${forPercentage}%` }}></div>
                <div className="bg-red-500 h-2.5 rounded-r-full" style={{ width: `${againstPercentage}%`, marginLeft: `${forPercentage}%`, marginTop: "-10px" }}></div>
            </div>
        </Link>
    );
};


const GovernancePage: React.FC = () => {
    const { user } = useAuth();
    const [proposals, setProposals] = useState<Proposal[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchProposals = async () => {
            try {
                const data = await apiService.getProposals();
                setProposals(data);
            } catch (error) {
                console.error("Failed to fetch proposals", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchProposals();
    }, []);
    
    if (isLoading) {
        return <div className="flex justify-center items-center h-96"><Spinner /></div>;
    }
    
    return (
        <div>
            <div className="text-center mb-10">
                <h1 className="text-4xl font-bold text-white">Управление DAO</h1>
                <p className="text-lg text-base-content/70 mt-2">Принимайте участие в развитии CryptoCraft, голосуя за ключевые предложения.</p>
            </div>
            {proposals.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {proposals.map(p => <ProposalCard key={p.id} proposal={p} />)}
                </div>
            ) : (
                <div className="text-center py-16 bg-base-100 rounded-lg">
                    <p className="text-base-content/70">Активных предложений для голосования нет.</p>
                </div>
            )}
        </div>
    );
};

export default GovernancePage;