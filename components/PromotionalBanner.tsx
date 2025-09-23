import React from 'react';
import { Link } from 'react-router-dom';

const PromotionalBanner: React.FC = () => {
    return (
        <section className="relative bg-base-200 rounded-lg overflow-hidden text-base-content p-8 md:p-12 flex items-center min-h-[300px]">
            <div 
                className="absolute inset-0 bg-cover bg-center opacity-10" 
                style={{backgroundImage: "url('https://picsum.photos/seed/banner/1200/400')"}}
            ></div>
            <div className="absolute inset-0 bg-gradient-to-r from-base-100 via-base-100/70 to-transparent"></div>
            
            <div className="relative z-10 max-w-xl">
                <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-4">
                    Откройте мир <span className="text-primary">уникальных</span> вещей
                </h1>
                <p className="text-lg text-base-content/70 mb-6">
                    Маркетплейс для творцов и ценителей, работающий на криптовалюте.
                </p>
                <Link 
                    to="/products"
                    className="bg-primary hover:bg-primary-focus text-primary-content font-bold text-lg h-auto py-3 px-8 rounded-lg"
                >
                    Смотреть все товары
                </Link>
            </div>
        </section>
    );
};

export default PromotionalBanner;