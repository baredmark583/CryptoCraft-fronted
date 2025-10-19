import React, { createContext, useContext, useState, ReactNode, useMemo, useCallback } from 'react';
import DynamicIcon from '../components/DynamicIcon';

export type Currency = 'USDT' | 'TON' | 'USDC';

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  getFormattedPrice: (price: number) => ReactNode;
  exchangeRates: Record<Currency, number>;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

// Mock exchange rates relative to USDT
const MOCK_EXCHANGE_RATES: Record<Currency, number> = {
  USDT: 1,
  USDC: 1.01,  // Assuming a slight variation for mock purposes
  TON: 0.15,   // 1 USDT = 6.67 TON -> 1 TON = 0.15 USDT
};

export const CurrencyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currency, setCurrency] = useState<Currency>('USDT');

  const getFormattedPrice = useCallback((price: number): ReactNode => {
    const rate = MOCK_EXCHANGE_RATES[currency];
    const convertedPrice = price / rate;
    
    const iconMap: Record<Currency, string> = {
        USDT: 'currency-usdt',
        TON: 'currency-ton',
        USDC: 'currency-usdc',
    };

    return (
        <span className="inline-flex items-center gap-1 align-middle">
            {convertedPrice.toFixed(2)}
            <DynamicIcon name={iconMap[currency]} className="w-4 h-4 inline-block" fallback={<span className="text-sm">{currency}</span>} />
        </span>
    );
  }, [currency]);

  const value = useMemo(() => ({
    currency,
    setCurrency,
    getFormattedPrice,
    exchangeRates: MOCK_EXCHANGE_RATES
  }), [currency, getFormattedPrice]);

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
