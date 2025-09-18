import React from 'react';
import { Link } from 'react-router-dom';

const ShowcaseHeader: React.FC = () => {
  return (
    <header className="bg-brand-surface border-b border-brand-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="text-2xl font-bold text-white">
            Crypto<span className="text-brand-primary">Craft</span>
          </Link>
        </div>
      </div>
    </header>
  );
};

export default ShowcaseHeader;
