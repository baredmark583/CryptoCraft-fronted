import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  return (
    <footer className="footer-primary">
      <div className="footer-container">
        <div className="footer-top">
          <div className="footer-brand-block">
            <div className="footer-brand-mark">
              <img loading="lazy" decoding="async" alt="Лого" src="https://api.iconify.design/lucide-sparkles.svg" className="footer-brand-icon" />
            </div>
            <strong className="footer-brand-name">SandBoard</strong>
          </div>
          <ul className="footer-links">
            <li><Link to="/products" className="gjs-t-link footer-link">Категории</Link></li>
            <li><Link to="/products" className="gjs-t-link footer-link">VIP</Link></li>
            <li><Link to="/products" className="gjs-t-link footer-link">Объявления</Link></li>
            <li><Link to="/" className="gjs-t-link footer-link">Акции</Link></li>
          </ul>
        </div>
        <div className="footer-bottom">
          <small className="footer-copyright">© 2025 SandBoard. Все права защищены.</small>
          <div className="footer-socials">
            <a href="#top" className="gjs-t-link">
              <img loading="lazy" decoding="async" alt="VK" src="https://api.iconify.design/lucide-link.svg" className="social-icon" />
            </a>
            <a href="#top" className="gjs-t-link">
              <img loading="lazy" decoding="async" alt="Telegram" src="https://api.iconify.design/lucide-send.svg" className="social-icon" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;