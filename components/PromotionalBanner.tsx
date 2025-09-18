import React from 'react';
import { Link } from 'react-router-dom';

const PromotionalBanner: React.FC = () => {
    return (
        <section className="relative bg-brand-surface rounded-lg overflow-hidden text-white p-8 md:p-12 flex items-center min-h-[300px]">
            <div 
                className="absolute inset-0 bg-cover bg-center opacity-20" 
                style={{backgroundImage: "url('https://picsum.photos/seed/banner/1200/400')"}}
            ></div>
            <div className="absolute inset-0 bg-gradient-to-r from-brand-background via-brand-background/70 to-transparent"></div>
            
            <div className="relative z-10 max-w-xl">
                <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-4">
                    Откройте мир <span className="text-brand-primary">уникальных</span> вещей
                </h1>
                <p className="text-lg text-brand-text-secondary mb-6">
                    Маркетплейс для творцов и ценителей, работающий на криптовалюте.
                </p>
                <Link 
                    to="/products"
                    className="bg-brand-primary hover:bg-brand-primary-hover text-white font-bold py-3 px-8 rounded-lg transition-colors text-lg"
                >
                    Смотреть все товары
                </Link>
            </div>
        </section>
    );
};

export default PromotionalBanner;
