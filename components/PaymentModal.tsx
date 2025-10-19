import React, { useState } from 'react';
import { useTonConnectUI } from '../hooks/useTonConnect';
// FIX: toNano is not exported from @tonconnect/ui-react. A local implementation is provided below.
import Spinner from './Spinner';
import { TREASURY_WALLET_ADDRESS } from '../constants';
import { useCurrency } from '../hooks/useCurrency';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  recipientAddress: string;
  onSuccess: (txHash: string) => void;
}

// FIX: toNano is not exported from @tonconnect/ui-react. Implementing a simple version locally.
const toNano = (value: number) => {
  // A simple implementation of toNano, as it's not exported from @tonconnect/ui-react.
  // It converts a number of TON-like currency to nanotons as a BigInt.
  // Note: This assumes the 'amount' is in the main currency unit (e.g., TON, not nanoTON).
  return BigInt(Math.round(value * 1e9));
};

const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, amount, recipientAddress, onSuccess }) => {
  const { getFormattedPrice } = useCurrency();
  const [tonConnectUI] = useTonConnectUI();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handlePay = async () => {
    setIsProcessing(true);
    setError('');
    
    const transaction = {
      validUntil: Math.floor(Date.now() / 1000) + 600, // 10 minutes
      messages: [
        {
          address: recipientAddress,
          amount: toNano(amount).toString(),
        },
      ],
    };

    try {
      const result = await tonConnectUI.sendTransaction(transaction);
      // You can get transaction hash from result
      // const txHash = result.boc; // This is not the hash, but you can parse it on backend if needed
      // For simplicity, we'll pass a mock hash
      onSuccess('mock_tx_hash_' + Date.now()); 
    } catch (e: any) {
      console.error(e);
      setError(e.message || 'Транзакция отменена или не удалась.');
      setIsProcessing(false);
    }
  };
  
  const recipientName = recipientAddress === TREASURY_WALLET_ADDRESS ? 'Платформа CryptoCraft (Безопасная сделка)' : 'Продавец (Напрямую)';

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-base-100 rounded-2xl shadow-2xl w-full max-w-md border border-base-300" onClick={e => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-white">Подтверждение платежа</h2>
            <button type="button" onClick={onClose} disabled={isProcessing} className="text-base-content/70 hover:text-white text-3xl leading-none disabled:opacity-50">&times;</button>
          </div>
          
          <div className="text-center bg-base-200 p-4 rounded-lg mb-6">
              <p className="text-sm text-base-content/70">Сумма к оплате</p>
              <p className="text-4xl font-bold text-primary">{getFormattedPrice(amount)}</p>
          </div>
           <div className="text-sm space-y-2 mb-6">
              <div className="flex justify-between">
                <span className="text-base-content/70">Получатель:</span>
                <span className="font-semibold text-white">{recipientName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-base-content/70">Адрес:</span>
                <span className="font-mono text-white text-xs truncate" title={recipientAddress}>
                    {`${recipientAddress.slice(0, 6)}...${recipientAddress.slice(-4)}`}
                </span>
              </div>
          </div>


          {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}
          
          <button
            onClick={handlePay}
            disabled={isProcessing}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center disabled:bg-gray-500 disabled:cursor-not-allowed"
          >
            {isProcessing ? <Spinner size="sm" /> : 'Оплатить через кошелек'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;