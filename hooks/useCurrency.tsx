import React, { createContext, useContext, useState, ReactNode, useMemo } from 'react';

export type Currency = 'USDT' | 'TON' | 'USDC';

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  getFormattedPrice: (price: number) => string;
  exchangeRates: Record<Currency, number>;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

// Mock exchange rates relative to USDT
const MOCK_EXCHANGE_RATES: Record<Currency, number> = {
  USDT: 1,
  USDC: 1.01, // Assuming a slight variation for mock purposes
  TON: 0.15,  // 1 USDT = 6.67 TON -> 1 TON = 0.15 USDT
};

export const CurrencyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currency, setCurrency] = useState<Currency>('USDT');

  const getFormattedPrice = (price: number): string => {
    const rate = MOCK_EXCHANGE_RATES[currency];
    const convertedPrice = price / rate;
    
    switch (currency) {
        case 'TON':
            return `${convertedPrice.toFixed(2)} TON`;
        case 'USDC':
            return `${convertedPrice.toFixed(2)} USDC`;
        case 'USDT':
        default:
            return `${price.toFixed(2)} USDT`;
    }
  };

  const value = useMemo(() => ({
    currency,
    setCurrency,
    getFormattedPrice,
    exchangeRates: MOCK_EXCHANGE_RATES
  }), [currency]);

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};