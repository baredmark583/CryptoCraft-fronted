import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import Spinner from './Spinner';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  modalType: 'deposit' | 'withdraw';
}

const WalletModal: React.FC<WalletModalProps> = ({ isOpen, onClose, modalType }) => {
  const { user } = useAuth();
  const [amount, setAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;
  
  const title = modalType === 'deposit' ? 'Пополнить баланс' : 'Вывести средства';
  const buttonText = modalType === 'deposit' ? 'Пополнить' : 'Вывести';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    // Mock processing
    setTimeout(() => {
        alert(`${title} на сумму ${amount} USDT в обработке!`);
        setIsProcessing(false);
        onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-base-100 rounded-2xl shadow-2xl w-full max-w-md border border-base-300" onClick={e => e.stopPropagation()}>
        <form onSubmit={handleSubmit} className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-white">{title}</h2>
            <button type="button" onClick={onClose} className="text-base-content/70 hover:text-white text-3xl leading-none">&times;</button>
          </div>
          <p className="text-base-content/70 mb-4">Текущий баланс: <span className="font-bold text-green-400">{user.balance.toFixed(2)} USDT</span></p>

          <div>
             <label htmlFor="amount" className="block text-sm font-medium text-base-content/70 mb-2">Сумма (USDT)</label>
             <input 
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-base-200 border border-base-300 rounded-md p-3"
                placeholder="0.00"
                required
             />
          </div>
          
           <button
            type="submit"
            disabled={isProcessing || !amount}
            className="w-full mt-6 bg-primary hover:bg-primary-focus text-white font-bold py-3 rounded-lg flex items-center justify-center disabled:bg-gray-500"
          >
            {isProcessing ? <Spinner size="sm" /> : buttonText}
          </button>
        </form>
      </div>
    </div>
  );
};

export default WalletModal;