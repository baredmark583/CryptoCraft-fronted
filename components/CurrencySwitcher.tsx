import React, { useState, useRef, useEffect } from 'react';
import { useCurrency, Currency } from '../hooks/useCurrency';

const CurrencySwitcher: React.FC = () => {
  const { currency, setCurrency } = useCurrency();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currencies: Currency[] = ['USDT', 'TON', 'USDC'];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  const handleSelect = (selectedCurrency: Currency) => {
    setCurrency(selectedCurrency);
    setIsOpen(false);
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center w-20 h-10 bg-brand-surface border border-brand-border rounded-lg text-sm font-semibold"
      >
        {currency}
        <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ml-1 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-28 bg-brand-surface rounded-lg shadow-2xl border border-brand-border z-50 animate-fade-in-down">
          <ul className="py-1">
            {currencies.map(c => (
              <li key={c}>
                <button
                  onClick={() => handleSelect(c)}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-brand-primary/20 ${currency === c ? 'text-brand-primary' : 'text-brand-text-primary'}`}
                >
                  {c}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default CurrencySwitcher;