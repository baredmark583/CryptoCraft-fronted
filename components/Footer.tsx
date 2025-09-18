
import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-brand-surface">
      <div className="container mx-auto px-4 py-6 text-center text-brand-text-secondary">
        <p>&copy; {new Date().getFullYear()} CryptoCraft. Все права защищены.</p>
        <div className="mt-2 space-x-4">
          <a href="#" className="hover:text-brand-primary">О нас</a>
          <a href="#" className="hover:text-brand-primary">Политика</a>
          <a href="#" className="hover:text-brand-primary">Контакты</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
   