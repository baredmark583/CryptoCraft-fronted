import React from 'react';
import ShowcaseHeader from '../components/ShowcaseHeader';
import ShowcaseFooter from '../components/ShowcaseFooter';
import TelegramLoginButton from '../components/TelegramLoginButton';

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
        <div className="mt-10 flex flex-col items-center justify-center gap-4 w-full max-w-md">
          <h2 className="text-lg font-semibold text-white">Войдите, чтобы начать</h2>
          <TelegramLoginButton />
        </div>
        <p className="mt-4 text-sm text-base-content/60">
          CryptoCraft is also available as a Mini App inside Telegram.
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
