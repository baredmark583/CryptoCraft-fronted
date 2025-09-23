

import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-base-300">
      <div className="container mx-auto px-4 py-6 text-center text-base-content/70">
        <p>&copy; {new Date().getFullYear()} CryptoCraft. Все права защищены.</p>
        <div className="mt-2 space-x-4">
          <a href="#" className="hover:text-primary">О нас</a>
          <a href="#" className="hover:text-primary">Политика</a>
          <a href="#" className="hover:text-primary">Контакты</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;