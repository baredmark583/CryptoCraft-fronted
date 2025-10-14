import React from 'react';
import { Link } from 'react-router-dom';

const categoryData: Record<string, string> = {
    'Недвижимость': 'lucide-home', 'Авто': 'lucide-car', 'Электроника': 'lucide-monitor',
    'Дом и сад': 'lucide-sofa', 'Услуги': 'lucide-wrench', 'Работа': 'lucide-briefcase',
    'Хобби': 'lucide-shapes', 'Животные': 'lucide-paw-print', 'Детям': 'lucide-baby',
    'Мода': 'lucide-shirt', 'Спорт': 'lucide-dumbbell', 'Запчасти': 'lucide-cog',
};

const CategoryGrid: React.FC = () => {
    return (
        <section className="w-full">
            <div className="mx-auto max-w-7xl px-6 py-8">
                <div className="flex items-end justify-between mb-5">
                    <h2 className="text-3xl font-manrope font-bold">Категории</h2>
                    <Link to="/products" className="text-sm font-medium hover:underline">Смотреть все</Link>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-4">
                    {Object.entries(categoryData).map(([name, icon]) => (
                        <Link 
                            key={name} 
                            to={`/products?category=${encodeURIComponent(name)}`} 
                            className="col-span-1 rounded-xl border border-amber-200/80 bg-white p-4 flex flex-col items-center gap-3 transition-colors hover:border-amber-300"
                        >
                            <img loading="lazy" decoding="async" alt={name} src={`https://api.iconify.design/${icon}.svg`} className="w-7 h-7 opacity-80" />
                            <span className="text-sm text-amber-900/90 text-center">{name}</span>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default CategoryGrid;