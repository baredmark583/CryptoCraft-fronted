


import React, { useState, useMemo, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { Product } from '../types';
// FIX: Correctly import type from constants
import type { CategorySchema } from '../constants';
import DynamicIcon from './DynamicIcon';

// Accordion component defined locally to avoid creating new files.
const Accordion: React.FC<{ title: string; children: ReactNode; defaultOpen?: boolean; }> = ({ title, children, defaultOpen = true }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-base-300 last:border-b-0 py-2">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center py-2 text-left font-semibold text-white text-lg"
      >
        <span>{title}</span>
        <DynamicIcon name="accordion-arrow" className={`w-5 h-5 transform transition-transform text-base-content/70 ${isOpen ? 'rotate-180' : ''}`} fallback={
            <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
            >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
        }/>
      </button>
      {isOpen && (
        <div className="pt-2 pb-1 animate-fade-in-down">
          {children}
        </div>
      )}
    </div>
  );
};

interface DynamicFilters {
    [key: string]: string[];
}
export interface Filters {
    category: string;
    priceMin?: number;
    priceMax?: number;
    dynamic: DynamicFilters;
}

interface FilterBarProps {
    filters: Filters;
    setFilters: React.Dispatch<React.SetStateAction<any>>; // Use `any` to avoid complex type intersection issues
    products: Product[];
    categories: CategorySchema[];
}

const CategoryFilterItem: React.FC<{ category: CategorySchema; level: number; activeCategory: string; }> = ({ category, level, activeCategory }) => {
    const isParent = level === 0;
    const isActive = activeCategory === category.name;
    const baseClasses = 'block p-1 rounded transition-colors text-sm';
    const activeClasses = 'text-primary font-bold';
    const inactiveClasses = isParent ? 'text-white hover:text-primary font-semibold' : 'text-base-content/70 hover:text-white';

    return (
        <li>
            <Link 
                to={`/products?category=${encodeURIComponent(category.name)}`} 
                className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}
                style={{ paddingLeft: `${8 + level * 16}px` }}
            >
                {category.name}
            </Link>
            {category.subcategories && category.subcategories.length > 0 && (
                <ul className="space-y-1">
                    {category.subcategories.map(sub => (
                        <CategoryFilterItem key={sub.id || sub.name} category={sub} level={level + 1} activeCategory={activeCategory} />
                    ))}
                </ul>
            )}
        </li>
    );
};


const FilterBar: React.FC<FilterBarProps> = ({ filters, setFilters, products, categories }) => {
    const [localPriceMin, setLocalPriceMin] = useState(filters.priceMin || '');
    const [localPriceMax, setLocalPriceMax] = useState(filters.priceMax || '');

    const dynamicFilterOptions = useMemo(() => {
        const options: { [key: string]: { [value: string]: number } } = {};
        if (!products) return options;
        
        products.forEach(product => {
            Object.entries(product.dynamicAttributes).forEach(([key, value]) => {
                if (!options[key]) {
                    options[key] = {};
                }
                const stringValue = String(value);
                if (!options[key][stringValue]) {
                    options[key][stringValue] = 0;
                }
                options[key][stringValue]++;
            });
        });
        return options;
    }, [products]);

    const handleApplyPriceFilter = () => {
        setFilters(prev => ({
            ...prev,
            priceMin: localPriceMin ? Number(localPriceMin) : undefined,
            priceMax: localPriceMax ? Number(localPriceMax) : undefined,
        }));
    };
    
    const handleDynamicFilterChange = (key: string, value: string, isChecked: boolean) => {
        setFilters(prev => {
            const currentValues = prev.dynamic[key] || [];
            const newValues = isChecked
                ? [...currentValues, value]
                : currentValues.filter(v => v !== value);
            
            const newDynamicFilters = { ...prev.dynamic, [key]: newValues };
            if (newValues.length === 0) {
                delete newDynamicFilters[key];
            }

            return { ...prev, dynamic: newDynamicFilters };
        });
    };

    return (
        <div className="bg-base-100 p-4 rounded-lg">
            <Accordion title="Категории" defaultOpen={true}>
                <ul className="space-y-1 text-sm max-h-96 overflow-y-auto pr-2">
                    <li>
                         <Link to="/products?category=Все" className={`block p-2 rounded text-sm ${filters.category === 'Все' ? 'text-primary font-bold' : 'text-base-content/70 hover:text-white'}`}>
                            Все категории
                        </Link>
                    </li>
                    {categories.map(cat => (
                         <CategoryFilterItem key={cat.id || cat.name} category={cat} level={0} activeCategory={filters.category} />
                    ))}
                </ul>
            </Accordion>

            <Accordion title="Цена">
                <div className="flex items-center gap-2">
                    <input type="number" placeholder="От" value={localPriceMin} onChange={e => setLocalPriceMin(e.target.value)} className="w-full bg-base-200 border border-base-300 rounded-md p-2" />
                    <span className="text-base-content/70">-</span>
                    <input type="number" placeholder="До" value={localPriceMax} onChange={e => setLocalPriceMax(e.target.value)} className="w-full bg-base-200 border border-base-300 rounded-md p-2" />
                </div>
                <button onClick={handleApplyPriceFilter} className="text-sm w-full mt-2 bg-primary hover:bg-primary-focus text-white py-2 rounded">Применить</button>
            </Accordion>

            {Object.entries(dynamicFilterOptions).map(([key, values]) => (
                <Accordion key={key} title={key}>
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                        {Object.entries(values).sort().map(([value, count]) => (
                            <label key={value} className="flex items-center space-x-2 cursor-pointer p-1 rounded hover:bg-base-200">
                                <input
                                    type="checkbox"
                                    checked={(filters.dynamic[key] || []).includes(value)}
                                    onChange={(e) => handleDynamicFilterChange(key, value, e.target.checked)}
                                    className="h-4 w-4 rounded bg-base-200 border-base-300 text-primary focus:ring-primary"
                                />
                                <span className="text-base-content text-sm">{value}</span>
                                <span className="text-base-content/70 text-xs ml-auto">({count})</span>
                            </label>
                        ))}
                    </div>
                </Accordion>
            ))}
        </div>
    );
};

export default FilterBar;
