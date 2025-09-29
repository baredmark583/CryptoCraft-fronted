import React, { useState } from 'react';
import { useTelegramBackButton } from '../hooks/useTelegram';
import { apiService } from '../services/apiService';
import { geminiService } from '../services/geminiService';
// FIX: Import ImportedListingData from types.ts where it is defined and exported.
import type { ImportItem, Product, ImportedListingData } from '../types';
import Spinner from '../components/Spinner';
import { useAuth } from '../hooks/useAuth';

type EditableListing = Omit<ImportedListingData, 'price'> & { price?: number };

// A 2-second delay between processing each URL to avoid hitting API rate limits.
const DELAY_BETWEEN_REQUESTS_MS = 2000;


interface EditableListingProps {
    item: ImportItem;
    onUpdate: (id: string, updatedListing: EditableListing) => void;
    disabled: boolean;
}

const EditableListingCard: React.FC<EditableListingProps> = ({ item, onUpdate, disabled }) => {
    if (!item.listing) return null;

    const [selectedImages, setSelectedImages] = useState<string[]>(item.listing.imageUrls || []);

    const handleFieldChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        onUpdate(item.id, { ...item.listing!, [e.target.name]: e.target.value });
    };

    const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onUpdate(item.id, { ...item.listing!, price: parseFloat(e.target.value) || undefined });
    };

    const toggleImageSelection = (url: string) => {
        if (disabled) return;
        const newSelection = selectedImages.includes(url)
            ? selectedImages.filter(imgUrl => imgUrl !== url)
            : [...selectedImages, url];
        setSelectedImages(newSelection);
        onUpdate(item.id, { ...item.listing!, imageUrls: newSelection });
    };


    return (
        <div className={`bg-base-200/50 p-4 rounded-lg space-y-3 ${disabled ? 'opacity-50' : ''}`}>
            <div>
                <label className="text-xs text-base-content/70">Заголовок</label>
                <input name="title" value={item.listing.title} onChange={handleFieldChange} disabled={disabled} className="w-full bg-base-100 border border-base-300 rounded p-2 text-sm disabled:cursor-not-allowed" />
            </div>
            <div>
                <label className="text-xs text-base-content/70">Описание</label>
                <textarea name="description" value={item.listing.description} onChange={handleFieldChange} disabled={disabled} rows={4} className="w-full bg-base-100 border border-base-300 rounded p-2 text-sm disabled:cursor-not-allowed" />
            </div>
             <div>
                <label className="text-xs text-base-content/70">Цена (USDT)</label>
                <input name="price" type="number" value={item.listing.price} onChange={handlePriceChange} disabled={disabled} className="w-full bg-base-100 border border-base-300 rounded p-2 text-sm disabled:cursor-not-allowed" />
                {item.listing.originalPrice && item.listing.originalCurrency && (
                    <p className="text-xs text-base-content/70 mt-1">
                        Оригинал: {item.listing.originalPrice} {item.listing.originalCurrency}
                    </p>
                )}
            </div>
            <div>
                <label className="text-xs text-base-content/70 mb-2 block">Изображения ({selectedImages.length} / {item.listing.imageUrls?.length || 0} выбрано)</label>
                <div className="grid grid-cols-4 gap-2">
                    {item.listing.imageUrls?.map(url => (
                        <div key={url} className={`relative group ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`} onClick={() => toggleImageSelection(url)}>
                            <img src={url} alt="Preview" className="w-full h-full object-cover rounded-md" />
                            <div className={`absolute inset-0 rounded-md transition-all ${selectedImages.includes(url) ? 'ring-2 ring-primary bg-black/20' : 'bg-black/60 group-hover:bg-black/30'}`}>
                                {selectedImages.includes(url) && (
                                    <div className="absolute top-1 right-1 bg-primary rounded-full w-5 h-5 flex items-center justify-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-primary-content"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.052-.143z" clipRule="evenodd" /></svg>
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
    const { user } = useAuth();

    const [urls, setUrls] = useState('');
    const [items, setItems] = useState<ImportItem[]>([]);
    const [isImporting, setIsImporting] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

    const handleStartImport = async () => {
        const urlList = urls.split('\n').map(u => u.trim()).filter(Boolean);
        if (urlList.length === 0) return;

        setIsImporting(true);
        const initialItems: ImportItem[] = urlList.map(url => ({
            id: url + Date.now(),
            url,
            status: 'pending'
        }));
        setItems(initialItems);
        setSelectedItems(new Set());

        for (const item of initialItems) {
            setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: 'scraping' } : i));
            try {
                // Step 1: Frontend scrapes HTML via a CORS proxy
                const { html } = await apiService.scrapeUrlFromClient(item.url);

                // Step 2: Frontend sends HTML to backend for AI processing
                setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: 'parsing' } : i));
                const aiData = await geminiService.processImportedHtml(html);
                
                // Step 3: Frontend asks backend to convert currency
                const convertedPrice = await apiService.convertCurrency(aiData.originalPrice, aiData.originalCurrency);

                // Step 4: Combine all data into the final listing object
                const finalListingData: EditableListing = {
                    ...aiData,
                    price: parseFloat(convertedPrice.toFixed(2)),
                };
                
                setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: 'success', listing: finalListingData as ImportedListingData } : i));
                setSelectedItems(prev => new Set(prev).add(item.id));

            } catch (error: any) {
                console.error(`Failed to process ${item.url}:`, error);
                setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: 'error', errorMessage: error.message || 'Unknown error' } : i));
            }
            
            if (initialItems.indexOf(item) < initialItems.length - 1) {
                await new Promise(res => setTimeout(res, DELAY_BETWEEN_REQUESTS_MS));
            }
        }
        setIsImporting(false);
    };

    const handleUpdateItem = (id: string, updatedListing: EditableListing) => {
        setItems(prev => prev.map(item =>
            item.id === id ? { ...item, listing: { ...item.listing, ...updatedListing } as any } : item
        ));
    };

    const toggleItemSelection = (id: string) => {
        const item = items.find(i => i.id === id);
        if (!item || item.status === 'published' || item.status === 'publishing') return;

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

    const handlePublish = async () => {
        const itemsToPublish = items.filter(i => selectedItems.has(i.id) && i.status === 'success');
        if (itemsToPublish.length === 0) return;
    
        setIsPublishing(true);
    
        for (const item of itemsToPublish) {
            setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: 'publishing' } : i));
            try {
                if (!item.listing?.imageUrls || item.listing.imageUrls.length === 0) {
                    throw new Error("Нет изображений для загрузки.");
                }
    
                const uploadedUrls = await Promise.all(
                    item.listing.imageUrls.map(async (url) => {
                        const result = await apiService.uploadFileFromUrl(url);
                        return result.url;
                    })
                );
                
                const listingData: Partial<Product> = {
                    title: item.listing.title,
                    description: item.listing.description,
                    price: item.listing.price,
                    category: item.listing.category,
                    dynamicAttributes: item.listing.dynamicAttributes || {},
                    isAuction: item.listing.saleType === 'AUCTION',
                    giftWrapAvailable: item.listing.giftWrapAvailable,
                };
    
                await apiService.createListing(listingData, uploadedUrls, undefined, user);
    
                setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: 'published' } : i));
            } catch (error) {
                console.error(`Не удалось опубликовать ${item.url}:`, error);
                const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
                setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: 'publish_error', errorMessage } : i));
            }
        }
    
        setIsPublishing(false);
    };

    const getStatusUI = (item: ImportItem) => {
        switch(item.status) {
            case 'pending': return <span className="text-xs text-base-content/70">Ожидание</span>;
            case 'scraping': return <span className="text-xs text-sky-400 flex items-center gap-1"><Spinner size="sm" /> Сбор HTML...</span>;
            case 'parsing': 
            case 'enriching': return <span className="text-xs text-purple-400 flex items-center gap-1"><Spinner size="sm" /> Анализ AI...</span>;
            case 'success': return <span className="text-xs text-green-400 font-bold">Готово к публикации</span>;
            case 'publishing': return <span className="text-xs text-yellow-400 flex items-center gap-1"><Spinner size="sm" /> Публикация...</span>;
            case 'published': return <span className="text-xs text-green-400 font-bold flex items-center gap-1">✅ Опубликовано</span>;
            case 'error': return <span className="text-xs text-red-400" title={item.errorMessage}>Ошибка импорта</span>;
            case 'publish_error': return <span className="text-xs text-red-400" title={item.errorMessage}>Ошибка публикации</span>;
        }
    }

    const isProcessing = isImporting || isPublishing;

    return (
        <div className="max-w-4xl mx-auto">
            <div className="text-center">
                <h1 className="text-4xl font-bold text-white">Импорт с других платформ</h1>
                <p className="text-lg text-base-content/70 mt-2">Перенесите свой магазин в CryptoCraft за пару кликов.</p>
            </div>
            
            <div className="bg-base-100 p-6 sm:p-8 rounded-lg shadow-xl my-8">
                <h2 className="text-xl font-semibold text-white mb-2">1. Вставьте ссылки на товары</h2>
                <p className="text-sm text-base-content/70 mb-4">Вставьте каждую ссылку на новой строке.</p>
                <textarea
                    value={urls}
                    onChange={e => setUrls(e.target.value)}
                    rows={6}
                    placeholder="https://www.olx.ua/d/obyavlenie/..."
                    className="w-full bg-base-200 border border-base-300 rounded-md p-3 font-mono text-sm"
                    disabled={isProcessing}
                />
                <button
                    onClick={handleStartImport}
                    disabled={isProcessing || !urls.trim()}
                    className="mt-4 w-full flex justify-center py-3 px-4 text-lg font-medium text-primary-content bg-primary hover:bg-primary-focus disabled:bg-gray-500"
                >
                    {isImporting ? <Spinner /> : 'Начать импорт'}
                </button>
            </div>
            
            {items.length > 0 && (
                 <div className="bg-base-100 p-6 sm:p-8 rounded-lg shadow-xl my-8">
                     <h2 className="text-xl font-semibold text-white mb-4">2. Проверка и публикация</h2>
                    <div className="space-y-4">
                        {items.map(item => (
                            <div key={item.id} className="border border-base-300 rounded-lg">
                                <div className="p-3 bg-base-200/30 flex justify-between items-center gap-4">
                                    <div className="flex items-center gap-4 min-w-0">
                                         {(item.status === 'success' || item.status === 'published') && (
                                            <input
                                                type="checkbox"
                                                checked={selectedItems.has(item.id) || item.status === 'published'}
                                                onChange={() => toggleItemSelection(item.id)}
                                                disabled={isProcessing || item.status === 'published'}
                                                className="flex-shrink-0 h-5 w-5 rounded bg-base-100 border-base-300 text-primary focus:ring-primary disabled:cursor-not-allowed"
                                            />
                                        )}
                                        <p className="text-sm text-base-content truncate">{item.url}</p>
                                    </div>
                                    <div className="flex-shrink-0">{getStatusUI(item)}</div>
                                </div>
                                {item.status === 'success' && item.listing && (
                                    <EditableListingCard item={item} onUpdate={handleUpdateItem} disabled={isProcessing} />
                                )}
                            </div>
                        ))}
                    </div>
                    {items.some(i => i.status === 'success' || i.status === 'published') && (
                        <div className="mt-6 border-t border-base-300 pt-6">
                            <button
                                onClick={handlePublish}
                                disabled={isProcessing || selectedItems.size === 0}
                                className="w-full flex justify-center py-3 px-4 text-lg font-medium text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-500"
                            >
                                {isPublishing ? <Spinner /> : `Опубликовать выбранное (${selectedItems.size})`}
                            </button>
                             <p className="text-xs text-base-content/70 text-center mt-2">Примечание: Изображения будут скачаны и загружены на наши серверы. Это может занять некоторое время.</p>
                        </div>
                    )}
                </div>
            )}

        </div>
    );
};

export default ImportPage;
