import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-amber-200/80 bg-white">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="flex flex-col sm:flex-row items-start justify-between gap-8">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-300 flex items-center justify-center">
              <img loading="lazy" decoding="async" alt="Лого" src="https://api.iconify.design/lucide-sparkles.svg" className="w-5 h-5" />
            </div>
            <strong className="font-manrope font-semibold text-lg text-amber-900">SandBoard</strong>
          </div>
          <ul className="flex items-center flex-wrap gap-x-5 gap-y-2">
            <li><Link to="/products" className="text-sm font-medium">Категории</Link></li>
            <li><Link to="/products" className="text-sm font-medium">VIP</Link></li>
            <li><Link to="/products" className="text-sm font-medium">Объявления</Link></li>
            <li><Link to="/" className="text-sm font-medium">Акции</Link></li>
          </ul>
        </div>
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between border-t border-amber-200/80 pt-6">
          <small className="text-amber-900/70 text-xs">© 2025 SandBoard. Все права защищены.</small>
          <div className="flex items-center gap-3 mt-4 sm:mt-0">
            <a href="#top">
              <img loading="lazy" decoding="async" alt="VK" src="https://api.iconify.design/lucide-link.svg" className="w-5 h-5" />
            </a>
            <a href="#top">
              <img loading="lazy" decoding="async" alt="Telegram" src="https://api.iconify.design/lucide-send.svg" className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;