import React from 'react';
import { Link } from 'react-router-dom';
import { CATEGORIES } from '../constants';

const categoryIcons: Record<string, string> = {
    'Электроника': 'lucide-monitor-smartphone',
    'Автомобили': 'lucide-car',
    'Товары ручной работы': 'lucide-gem',
    'Ювелирные изделия': 'lucide-diamond',
    'Одежда и аксессуары': 'lucide-shirt',
    'Дом и быт': 'lucide-sofa',
    'Цифровые товары': 'lucide-download-cloud',
    'Винтаж': 'lucide-clock',
    'Искусство и коллекционирование': 'lucide-palette',
};

const CategoryGrid: React.FC = () => {
    return (
        <section className="w-full">
            <div className="mx-auto max-w-7xl px-6 py-8">
                <div className="flex items-end justify-between mb-5">
                    <h2 className="text-3xl font-manrope font-bold text-base-content">Категории</h2>
                    <Link to="/products" className="text-sm font-medium text-base-content/80 hover:underline">Смотреть все</Link>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-9 gap-4">
                    {CATEGORIES.map(({ name }) => (
                        <Link 
                            key={name} 
                            to={`/products?category=${encodeURIComponent(name)}`} 
                            className="col-span-1 rounded-xl border border-amber-200/80 bg-white p-4 flex flex-col items-center justify-center gap-3 transition-colors hover:border-amber-300 aspect-square"
                        >
                            <img loading="lazy" decoding="async" alt={name} src={`https://api.iconify.design/${categoryIcons[name] || 'lucide-tag'}.svg`} className="w-7 h-7 opacity-80" />
                            <span className="text-sm text-amber-900/90 text-center">{name}</span>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default CategoryGrid;