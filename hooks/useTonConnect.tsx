import React, { ReactNode } from 'react';
import {
    TonConnectUIProvider as RealTonConnectUIProvider,
    TonConnectButton as RealTonConnectButton,
    useTonConnectUI as useRealTonConnectUI,
    useTonWallet as useRealTonWallet,
    useTonAddress as useRealTonAddress
} from '@tonconnect/ui-react';

// The manifest is now served from the backend to handle CORS correctly.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
const manifestUrl = `${API_BASE_URL}/tonconnect-manifest.json`;


/**
 * A custom provider component that wraps the real TonConnectUIProvider
 * with our application's specific configuration, such as the manifest URL.
 */
export const TonConnectUIProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <RealTonConnectUIProvider
        manifestUrl={manifestUrl}
        actionsConfiguration={{
            // This URL is used to return to the Telegram Web App after a wallet action.
            // You might need to change 'cryptocraft_bot' to your actual bot's name.
            twaReturnUrl: 'https://t.me/crypcraft_bot'
        }}
    >
      {children}
    </RealTonConnectUIProvider>
  );
};

// Re-export the real button and hooks from the library.
// This acts as a "drop-in" replacement, so no other files need to change their imports.
export const TonConnectButton = RealTonConnectButton;
export const useTonConnectUI = useRealTonConnectUI;
export const useTonWallet = useRealTonWallet;
export const useTonAddress = useRealTonAddress;