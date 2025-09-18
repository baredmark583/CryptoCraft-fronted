
import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';

// Mock types and interfaces that would come from the library
interface TonWallet {
  address: string;
}

interface TonConnectUI {
  sendTransaction: (transaction: any) => Promise<void>;
}

// Mock context state
interface TonConnectContextType {
  tonConnectUI: TonConnectUI;
  wallet: TonWallet | null;
  userFriendlyAddress: string;
  connected: boolean;
  connectWallet: () => void;
}

const TonConnectContext = createContext<TonConnectContextType | undefined>(undefined);

// The mock provider
export const TonConnectUIProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [connected, setConnected] = useState(false);
  const [wallet, setWallet] = useState<TonWallet | null>(null);

  const connectWallet = useCallback(() => {
    setConnected(true);
    setWallet({ address: 'UQARnCdfRw0VcT86ApqHJEdMGzQU3T_MnPbNs71A6nOXcF91' });
  }, []);

  const tonConnectUI: TonConnectUI = {
    sendTransaction: async (transaction) => {
      console.log('Mock transaction sent:', transaction);
      // Simulate a successful transaction after a delay
      return new Promise(resolve => setTimeout(() => {
        alert('Mock-транзакция успешно отправлена!');
        resolve();
      }, 2000));
    },
  };
  
  const userFriendlyAddress = wallet ? '0QAR...cF91' : '';

  const value = { tonConnectUI, wallet, userFriendlyAddress, connected, connectWallet };

  return (
    <TonConnectContext.Provider value={value}>
      {children}
    </TonConnectContext.Provider>
  );
};

// Mock hooks
export const useTonConnectUI = (): [TonConnectUI, (ui: any) => void] => {
  const context = useContext(TonConnectContext);
  if (!context) throw new Error('useTonConnectUI must be used within a TonConnectUIProvider');
  return [context.tonConnectUI, () => {}];
};

export const useTonWallet = (): TonWallet | null => {
  const context = useContext(TonConnectContext);
  if (!context) throw new Error('useTonWallet must be used within a TonConnectUIProvider');
  return context.wallet;
};

export const useTonAddress = (): string => {
  const context = useContext(TonConnectContext);
  if (!context) throw new Error('useTonAddress must be used within a TonConnectUIProvider');
  return context.userFriendlyAddress;
};

// Mock Button Component
export const TonConnectButton: React.FC = () => {
  const context = useContext(TonConnectContext);
  if (!context) throw new Error('TonConnectButton must be used within a TonConnectUIProvider');

  const { connected, connectWallet, userFriendlyAddress } = context;

  if (connected) {
    return (
      <div className="bg-green-500/20 text-green-300 text-sm font-mono px-4 py-2 rounded-lg">
        {userFriendlyAddress}
      </div>
    );
  }

  return (
    <button
      onClick={connectWallet}
      className="bg-brand-primary hover:bg-brand-primary-hover text-white font-bold py-2 px-4 rounded-lg transition-colors"
    >
      Подключить кошелек
    </button>
  );
};
   