import React from 'react';
import { Link } from 'react-router-dom';

const PromotionalBanner: React.FC = () => {
    return (
        <section className="relative bg-base-100 rounded-lg overflow-hidden text-neutral p-8 md:p-12 flex items-center min-h-[300px]">
            <div 
                className="absolute inset-0 bg-cover bg-center opacity-10" 
                style={{backgroundImage: "url('https://picsum.photos/seed/banner/1200/400')"}}
            ></div>
            <div className="absolute inset-0 bg-gradient-to-r from-base-200 via-base-200/70 to-transparent"></div>
            
            <div className="relative z-10 max-w-xl">
                <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-4">
                    Откройте мир <span className="text-primary">уникальных</span> вещей
                </h1>
                <p className="text-lg text-neutral/70 mb-6">
                    Маркетплейс для творцов и ценителей, работающий на криптовалюте.
                </p>
                <Link 
                    to="/products"
                    className="btn btn-primary text-white text-lg h-auto py-3 px-8"
                >
                    Смотреть все товары
                </Link>
            </div>
        </section>
    );
};

export default PromotionalBanner;