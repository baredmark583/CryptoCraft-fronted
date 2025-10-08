import React from 'react';
import { Link } from 'react-router-dom';

const ShowcaseHeader: React.FC = () => {
  return (
    <header className="bg-base-100 border-b border-base-300">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="text-2xl font-bold text-white">
            Crypto<span className="text-primary">Craft</span>
          </Link>
        </div>
      </div>
    </header>
  );
};

export default ShowcaseHeader;
