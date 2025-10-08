import React from 'react';
import ShowcaseHeader from '../components/ShowcaseHeader';
import ShowcaseFooter from '../components/ShowcaseFooter';
import DynamicIcon from '../components/DynamicIcon';

const FeatureCard: React.FC<{ icon: string; title: string; children: React.ReactNode }> = ({ icon, title, children }) => (
  <div className="bg-base-100 p-6 rounded-lg text-center">
    <div className="text-4xl mb-4">{icon}</div>
    <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
    <p className="text-base-content/70">{children}</p>
  </div>
);

const LandingPage: React.FC = () => {
  return (
    <div className="bg-base-200 min-h-screen flex flex-col font-sans text-base-content">
      <ShowcaseHeader />
      <main className="flex-grow container mx-auto px-4 py-16 text-center flex flex-col items-center justify-center">
        <h1 className="text-5xl md:text-6xl font-extrabold text-white leading-tight">
          CryptoCraft
        </h1>
        <p className="mt-4 text-xl md:text-2xl text-primary font-semibold">
          The AI-Powered Marketplace for Creators
        </p>
        <p className="mt-4 max-w-2xl text-lg text-base-content/80">
          Buy and sell unique goods using cryptocurrency, with listings created in seconds by our powerful AI assistant.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-md">
          <a 
            href="https://t.me/crypcraft_bot" // From useTonConnect.tsx
            target="_blank" 
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-3 bg-sky-500 hover:bg-sky-600 text-white font-bold py-4 px-6 rounded-lg text-lg transition-transform hover:scale-105"
          >
            <DynamicIcon name="telegram-logo" className="w-7 h-7" fallback={
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
                    <path d="M9.78 18.65l.28-4.23l7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3L3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.57c-.28 1.13-1.04 1.4-1.74.88l-4.98-3.9z" />
                </svg>
            }/>
            Open in Telegram
          </a>
        </div>
        <p className="mt-4 text-sm text-base-content/60">
          CryptoCraft is designed for the Telegram ecosystem.
        </p>
      </main>
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <FeatureCard icon="🤖" title="AI-Powered Listings">
            Just upload a photo and a short description. Our AI will write a compelling title, description, and even suggest a price.
          </FeatureCard>
          <FeatureCard icon="🛡️" title="Secure Escrow">
            Buyer funds are held securely by the platform and only released to the seller once the item is confirmed as received.
          </FeatureCard>
          <FeatureCard icon="💎" title="Crypto-Only Payments">
            All transactions are handled in cryptocurrency (USDT) using the fast and secure TON blockchain, integrated with Telegram Wallet.
          </FeatureCard>
        </div>
      </div>
      <ShowcaseFooter />
    </div>
  );
};

export default LandingPage;
