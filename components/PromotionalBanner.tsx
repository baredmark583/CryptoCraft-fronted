import React from 'react';
import { Link } from 'react-router-dom';

const PromotionalBanner: React.FC = () => {
    return (
        <section className="w-full bg-amber-50 border-b border-amber-200/80">
            <div className="mx-auto max-w-7xl px-6 py-4">
                <Link to="/products" className="block">
                    <div className="relative w-full overflow-hidden rounded-2xl border border-amber-200 bg-white">
                        <img loading="lazy" decoding="async" alt="Рекламный баннер" src="https://app.grapesjs.com/api/assets/random-image?query=%22warm%20sand%20ad%20banner%20minimal%22&w=1200&h=160" className="w-full h-32 object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-r from-amber-800/10 to-transparent"></div>
                        <div className="absolute inset-0 flex items-center justify-between px-6">
                            <p className="text-amber-900/90 font-semibold tracking-tight text-lg">Теплые предложения недели — скидки до 30%</p>
                            <span className="btn btn-primary btn-sm hidden sm:inline-flex">Подробнее</span>
                        </div>
                    </div>
                </Link>
            </div>
        </section>
    );
};

export default PromotionalBanner;