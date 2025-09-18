import React from 'react';

const ShowcaseFooter: React.FC = () => {
  return (
    <footer className="bg-brand-surface">
      <div className="container mx-auto px-4 py-6 text-center text-brand-text-secondary">
        <p>&copy; {new Date().getFullYear()} CryptoCraft. Все права защищены.</p>
      </div>
    </footer>
  );
};

export default ShowcaseFooter;
