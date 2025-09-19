import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTelegramBackButton } from '../hooks/useTelegram';
import { apiService } from '../services/apiService';
import { geminiService } from '../services/geminiService';
import type { ImportItem, GeneratedListing } from '../types';
import Spinner from '../components/Spinner';
import * as cheerio from 'cheerio';


interface EditableListingProps {
    item: ImportItem;
    onUpdate: (id: string, updatedListing: Partial<GeneratedListing> & { imageUrls: string[] }) => void;
}

const EditableListingCard: React.FC<EditableListingProps> = ({ item, onUpdate }) => {
    if (!item.listing) return null;

    const [selectedImages, setSelectedImages] = useState<string[]>(item.listing.imageUrls || []);

    const handleFieldChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        onUpdate(item.id, { ...item.listing!, [e.target.name]: e.target.value });
    };

    const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onUpdate(item.id, { ...item.listing!, price: parseFloat(e.target.value) || 0 });
    };

    const toggleImageSelection = (url: string) => {
        const newSelection = selectedImages.includes(url)
            ? selectedImages.filter(imgUrl => imgUrl !== url)
            : [...selectedImages, url];
        setSelectedImages(newSelection);
        onUpdate(item.id, { ...item.listing!, imageUrls: newSelection });
    };


    return (
        <div className="bg-brand-background/50 p-4 rounded-lg space-y-3">
            <div>
                <label className="text-xs text-brand-text-secondary">Заголовок</label>
                <input name="title" value={item.listing.title} onChange={handleFieldChange} className="w-full bg-brand-surface border border-brand-border rounded p-2 text-sm" />
            </div>
            <div>
                <label className="text-xs text-brand-text-secondary">Описание</label>
                <textarea name="description" value={item.listing.description} onChange={handleFieldChange} rows={4} className="w-full bg-brand-surface border border-brand-border rounded p-2 text-sm" />
            </div>
             <div>
                <label className="text-xs text-brand-text-secondary">Цена (USDT)</label>
                <input name="price" type="number" value={item.listing.price} onChange={handlePriceChange} className="w-full bg-brand-surface border border-brand-border rounded p-2 text-sm" />
                {item.listing.originalPrice && item.listing.originalCurrency && (
                    <p className="text-xs text-brand-text-secondary mt-1">
                        Оригинал: {item.listing.originalPrice} {item.listing.originalCurrency}
                    </p>
                )}
            </div>
            <div>
                <label className="text-xs text-brand-text-secondary mb-2 block">Изображения ({selectedImages.length} / {item.listing.imageUrls?.length || 0} выбрано)</label>
                <div className="grid grid-cols-4 gap-2">
                    {item.listing.imageUrls?.map(url => (
                        <div key={url} className="relative cursor-pointer group" onClick={() => toggleImageSelection(url)}>
                            <img src={url} alt="Preview" className="w-full h-full object-cover rounded-md" />
                            <div className={`absolute inset-0 rounded-md transition-all ${selectedImages.includes(url) ? 'ring-2 ring-brand-primary bg-black/20' : 'bg-black/60 group-hover:bg-black/30'}`}>
                                {selectedImages.includes(url) && (
                                    <div className="absolute top-1 right-1 bg-brand-primary rounded-full w-5 h-5 flex items-center justify-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-white"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.052-.143z" clipRule="evenodd" /></svg>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};


const ImportPage: React.FC = () => {
    useTelegramBackButton(true);

    const [urls, setUrls] = useState('');
    const [items, setItems] = useState<ImportItem[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

    const handleStartImport = async () => {
        const urlList = urls.split('\n').map(u => u.trim()).filter(Boolean);
        if (urlList.length === 0) return;

        setIsProcessing(true);
        const initialItems: ImportItem[] = urlList.map(url => ({
            id: url + Date.now(),
            url,
            status: 'pending'
        }));
        setItems(initialItems);
        setSelectedItems(new Set()); // Reset selection

        for (const item of initialItems) {
            setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: 'scraping' } : i));
            try {
                const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(item.url)}`;
                const response = await fetch(proxyUrl);
                if (!response.ok) {
                    throw new Error(`Proxy fetch failed: ${response.statusText}`);
                }
                const html = await response.text();

                const $ = cheerio.load(html);
                $('script, style, link[rel="stylesheet"]').remove();
                const cleanHtml = $('body').html() || '';

                if (!cleanHtml.trim()) {
                    throw new Error("Could not extract meaningful HTML from the page.");
                }

                setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: 'parsing' } : i));
                const parsedData = await geminiService.extractListingFromHtml(cleanHtml);
                
                const convertedPrice = await apiService.convertCurrency(parsedData.price, parsedData.originalCurrency);

                const finalListingData = {
                    title: parsedData.title,
                    description: parsedData.description,
                    imageUrls: parsedData.imageUrls,
                    originalPrice: parsedData.price,
                    originalCurrency: parsedData.originalCurrency,
                    price: parseFloat(convertedPrice.toFixed(2)),
                    category: "Импортированные", // Default category
                    dynamicAttributes: {}
                };

                setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: 'success', listing: finalListingData } : i));
                setSelectedItems(prev => new Set(prev).add(item.id));

            } catch (error: any) {
                console.error(`Failed to process ${item.url}:`, error);
                setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: 'error', errorMessage: error.message || 'Unknown error' } : i));
            }
        }
        setIsProcessing(false);
    };

    const handleUpdateItem = (id: string, updatedListing: Partial<GeneratedListing> & { imageUrls: string[] }) => {
        setItems(prev => prev.map(item =>
            item.id === id ? { ...item, listing: { ...item.listing, ...updatedListing } as any } : item
        ));
    };

    const toggleItemSelection = (id: string) => {
        setSelectedItems(prev => {
            const newSelection = new Set(prev);
            if (newSelection.has(id)) {
                newSelection.delete(id);
            } else {
                newSelection.add(id);
            }
            return newSelection;
        });
    };

    const handlePublish = () => {
        const itemsToPublish = items.filter(i => selectedItems.has(i.id));
        alert(`Симуляция публикации ${itemsToPublish.length} товаров. Этот функционал будет подключен на следующем этапе.`);
    };

    const getStatusUI = (item: ImportItem) => {
        switch(item.status) {
            case 'pending': return <span className="text-xs text-brand-text-secondary">Ожидание</span>;
            case 'scraping': return <span className="text-xs text-sky-400 flex items-center gap-1"><Spinner size="sm" /> Сбор данных...</span>;
            case 'parsing': return <span className="text-xs text-purple-400 flex items-center gap-1"><Spinner size="sm" /> Анализ AI...</span>;
            case 'success': return <span className="text-xs text-green-400 font-bold">Готово</span>;
            case 'error': return <span className="text-xs text-red-400" title={item.errorMessage}>Ошибка</span>;
        }
    }

    return (
        <div className="max-w-4xl mx-auto">
            <div className="text-center">
                <h1 className="text-4xl font-bold text-white">Импорт с других платформ</h1>
                <p className="text-lg text-brand-text-secondary mt-2">Перенесите свой магазин в CryptoCraft за пару кликов.</p>
            </div>
            
            <div className="bg-brand-surface p-6 sm:p-8 rounded-lg shadow-xl my-8">
                <h2 className="text-xl font-semibold text-white mb-2">1. Вставьте ссылки на товары</h2>
                <p className="text-sm text-brand-text-secondary mb-4">Вставьте каждую ссылку на новой строке.</p>
                <textarea
                    value={urls}
                    onChange={e => setUrls(e.target.value)}
                    rows={6}
                    placeholder="https://www.olx.ua/d/obyavlenie/..."
                    className="w-full bg-brand-background border border-brand-border rounded-md p-3 font-mono text-sm"
                    disabled={isProcessing}
                />
                <button
                    onClick={handleStartImport}
                    disabled={isProcessing || !urls.trim()}
                    className="mt-4 w-full flex justify-center py-3 px-4 text-lg font-medium text-white bg-brand-primary hover:bg-brand-primary-hover disabled:bg-gray-500"
                >
                    {isProcessing ? <Spinner /> : 'Начать импорт'}
                </button>
            </div>
            
            {items.length > 0 && (
                 <div className="bg-brand-surface p-6 sm:p-8 rounded-lg shadow-xl my-8">
                     <h2 className="text-xl font-semibold text-white mb-4">2. Проверка и публикация</h2>
                    <div className="space-y-4">
                        {items.map(item => (
                            <div key={item.id} className="border border-brand-border rounded-lg">
                                <div className="p-3 bg-brand-background/30 flex justify-between items-center">
                                    <div className="flex items-center gap-4">
                                         {item.status === 'success' && (
                                            <input
                                                type="checkbox"
                                                checked={selectedItems.has(item.id)}
                                                onChange={() => toggleItemSelection(item.id)}
                                                className="h-5 w-5 rounded bg-brand-surface border-brand-border text-brand-primary focus:ring-brand-primary"
                                            />
                                        )}
                                        <p className="text-sm text-brand-text-primary truncate">{item.url}</p>
                                    </div>
                                    {getStatusUI(item)}
                                </div>
                                {item.status === 'success' && item.listing && (
                                    <EditableListingCard item={item} onUpdate={handleUpdateItem} />
                                )}
                            </div>
                        ))}
                    </div>
                    {items.some(i => i.status === 'success') && (
                        <div className="mt-6 border-t border-brand-border pt-6">
                            <button
                                onClick={handlePublish}
                                disabled={selectedItems.size === 0}
                                className="w-full flex justify-center py-3 px-4 text-lg font-medium text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-500"
                            >
                                Опубликовать выбранное ({selectedItems.size})
                            </button>
                             <p className="text-xs text-brand-text-secondary text-center mt-2">Примечание: Изображения будут скачаны и загружены на наши серверы. Это может занять некоторое время.</p>
                        </div>
                    )}
                </div>
            )}

        </div>
    );
};

export default ImportPage;