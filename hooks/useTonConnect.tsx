import React, { ReactNode } from 'react';
import {
    TonConnectUIProvider as RealTonConnectUIProvider,
    TonConnectButton as RealTonConnectButton,
    useTonConnectUI as useRealTonConnectUI,
    useTonWallet as useRealTonWallet,
    useTonAddress as useRealTonAddress
} from '@tonconnect/ui-react';

// Dynamically create the absolute URL for the manifest file.
// This ensures it works correctly in any environment (local, preview, production).
const manifestUrl = new URL('/tonconnect-manifest.json', window.location.origin).href;

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
