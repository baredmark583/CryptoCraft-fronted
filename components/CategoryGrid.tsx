import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiService } from '../services/apiService';
import type { CategorySchema } from '../constants';

// A simple mapping for icons, you can replace these with more specific SVGs
const categoryIcons: Record<string, JSX.Element> = {
  "Искусство и коллекционирование": <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-8 h-8"><path d="M10 3.5a.75.75 0 01.75.75v2.502a.75.75 0 01-1.5 0V4.25A.75.75 0 0110 3.5zM8.328 6.022a.75.75 0 011.06 0l.75.75a.75.75 0 01-1.06 1.06l-.75-.75a.75.75 0 010-1.06zM5.25 8.5a.75.75 0 000 1.5h.563a.75.75 0 000-1.5H5.25zM15.25 9.25a.75.75 0 01-.75-.75h-.563a.75.75 0 010-1.5h.563a.75.75 0 01.75.75v.75zM11.672 6.022a.75.75 0 011.06 0l.75.75a.75.75 0 01-1.06 1.06l-.75-.75a.75.75 0 010-1.06zM10 15.5a.75.75 0 01.75.75v.563a.75.75 0 01-1.5 0v-.563a.75.75 0 01.75-.75zM8.328 12.478a.75.75 0 011.06 0l.75.75a.75.75 0 01-1.06 1.06l-.75-.75a.75.75 0 010-1.06zM5.25 10.75a.75.75 0 000 1.5h.563a.75.75 0 000-1.5H5.25zM15.25 11.5a.75.75 0 01-.75-.75h-.563a.75.75 0 010-1.5h.563a.75.75 0 01.75.75v.75zM11.672 12.478a.75.75 0 011.06 0l.75.75a.75.75 0 01-1.06 1.06l-.75-.75a.75.75 0 010-1.06z" /><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-2a6 6 0 100-12 6 6 0 000 12z" clipRule="evenodd" /></svg>,
  "Товары ручной работы": <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-8 h-8"><path d="M5.433 13.917l1.262-3.155A4 4 0 017.58 9.42l6.92-6.918a2.121 2.121 0 013 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 01-.65-.65z" /><path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0010 3H4.75A2.75 2.75 0 002 5.75v9.5A2.75 2.75 0 004.75 18h9.5A2.75 2.75 0 0017 15.25V10a.75.75 0 00-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5z" /></svg>,
  "Ювелирные изделия": <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-8 h-8"><path fillRule="evenodd" d="M5.5 2.5a3.5 3.5 0 100 7 3.5 3.5 0 000-7zM2 5.5a3.5 3.5 0 115.528 2.912.75.75 0 00-.528.528A3.5 3.5 0 012 5.5zm1.082 8.35a3.5 3.5 0 006.836 0c-.41-.124-.83.024-1.168.363l-1.68 1.68a.75.75 0 01-1.06 0l-1.68-1.68c-.338-.339-.758-.487-1.168-.363zM14.5 2.5a3.5 3.5 0 100 7 3.5 3.5 0 000-7zm-3.5 3.5a3.5 3.5 0 117 0 3.5 3.5 0 01-7 0z" clipRule="evenodd" /></svg>,
  "Одежда и аксессуары": <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-8 h-8"><path d="M8 7a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 018 7z" /><path fillRule="evenodd" d="M3 5a2 2 0 012-2h10a2 2 0 012 2v2.75a.75.75 0 01-1.5 0V5.5a.5.5 0 00-.5-.5H5a.5.5 0 00-.5.5v10a.5.5 0 00.5.5h1.75a.75.75 0 010 1.5H5a2 2 0 01-2-2V5z" clipRule="evenodd" /></svg>,
  "Электроника": <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-8 h-8"><path d="M3.25 4A2.25 2.25 0 001 6.25v7.5A2.25 2.25 0 003.25 16h13.5A2.25 2.25 0 0019 13.75v-7.5A2.25 2.25 0 0016.75 4H3.25zM10 8a.75.75 0 01.75.75v2.5a.75.75 0 01-1.5 0v-2.5A.75.75 0 0110 8zM5.75 9.5a.75.75 0 00-1.5 0v1a.75.75 0 001.5 0v-1zM14.25 9.5a.75.75 0 00-1.5 0v1a.75.75 0 001.5 0v-1z" /></svg>,
  "Автомобили": <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-8 h-8"><path fillRule="evenodd" d="M12.5 2.75a.75.75 0 00-1.5 0V4h-2V2.75a.75.75 0 00-1.5 0V4H6V2.75a.75.75 0 00-1.5 0V4H3.75A2.25 2.25 0 001.5 6.25v8.5A2.25 2.25 0 003.75 17h12.5A2.25 2.25 0 0018.5 14.75v-8.5A2.25 2.25 0 0016.25 4H15V2.75a.75.75 0 00-1.5 0V4h-1V2.75zM4.75 10a.75.75 0 000 1.5h.5a.75.75 0 000-1.5h-.5zM6.5 10.75a.75.75 0 01.75-.75h5a.75.75 0 010 1.5h-5a.75.75 0 01-.75-.75zM14.75 10a.75.75 0 000 1.5h.5a.75.75 0 000-1.5h-.5z" clipRule="evenodd" /></svg>,
  // Add other categories here...
  "Дом и быт": <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-8 h-8"><path d="M11.25 3.25a.75.75 0 10-1.5 0v1.282a.75.75 0 01-.264.577l-4.22 4.22a.75.75 0 000 1.06l4.22 4.22a.75.75 0 01.264.577v1.282a.75.75 0 101.5 0v-1.282a.75.75 0 01.264-.577l4.22-4.22a.75.75 0 000-1.06l-4.22-4.22a.75.75 0 01-.264-.577V3.25z" /><path d="M5.22 5.22a.75.75 0 011.06 0l4.22 4.22a.75.75 0 010 1.06l-4.22 4.22a.75.75 0 01-1.06-1.06L8.94 10 5.22 6.28a.75.75 0 010-1.06z" /></svg>,
  "Цифровые товары": <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-8 h-8"><path fillRule="evenodd" d="M15.5 2A1.5 1.5 0 0014 3.5v13A1.5 1.5 0 0015.5 18h-11A1.5 1.5 0 013 16.5v-13A1.5 1.5 0 014.5 2h11zM10 5a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 5zM10 9a.75.75 0 01.75.75v5.5a.75.75 0 01-1.5 0v-5.5A.75.75 0 0110 9z" clipRule="evenodd" /></svg>,
  "Винтаж": <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-8 h-8"><path fillRule="evenodd" d="M10 1a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 1zM5.05 3.636a.75.75 0 011.06 0l1.061 1.06a.75.75 0 01-1.06 1.061L5.05 4.697a.75.75 0 010-1.06zm9.9 0a.75.75 0 010 1.06l-1.06 1.061a.75.75 0 01-1.061-1.06l1.06-1.06a.75.75 0 011.061 0zM3 10a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5h-1.5A.75.75 0 013 10zm12 0a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5h-1.5a.75.75 0 01-.75-.75zM5.05 14.95a.75.75 0 010-1.06l1.06-1.061a.75.75 0 011.061 1.06l-1.06 1.06a.75.75 0 01-1.06 0zm9.9 0a.75.75 0 01-1.06 0l-1.061-1.06a.75.75 0 011.06-1.061l1.06 1.06a.75.75 0 010 1.06zM10 15a.75.75 0 01.75-.75h.008a.75.75 0 010 1.5h-.008A.75.75 0 0110 15z" clipRule="evenodd" /></svg>,
};


const CategoryGrid: React.FC = () => {
    const [categories, setCategories] = useState<CategorySchema[]>([]);

    useEffect(() => {
        apiService.getCategories().then(data => setCategories(data));
    }, []);

    return (
        <section>
            <h2 className="text-3xl font-bold text-base-content mb-4">Категории</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {categories.slice(0, 10).map(category => (
                    <Link 
                        key={category.name} 
                        to={`/products?category=${encodeURIComponent(category.name)}`}
                        className="group relative block bg-base-200 rounded-lg p-6 text-center transition-all duration-300 hover:shadow-2xl hover:shadow-primary/20 hover:-translate-y-1"
                    >
                        <div className="text-primary group-hover:text-secondary transition-colors duration-300 mb-2">
                           {categoryIcons[category.name] || categoryIcons['Товары ручной работы']}
                        </div>
                        <h3 className="font-semibold text-base-content">{category.name}</h3>
                    </Link>
                ))}
            </div>
        </section>
    );
};

export default CategoryGrid;