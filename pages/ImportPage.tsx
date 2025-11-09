
import React, { useState, useCallback } from 'react';
import { useTelegramBackButton } from '../hooks/useTelegram';
import { apiService } from '../services/apiService';
import { geminiService } from '../services/geminiService';
import type { ImportItem, Product, ImportedListingData, AiResponseMeta } from '../types';
import Spinner from '../components/Spinner';
import { useAuth } from '../hooks/useAuth';
import * as cheerio from 'cheerio';
import DynamicIcon from '../components/DynamicIcon';

type EditableListing = Omit<ImportedListingData, 'price'> & { price?: number };

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
                                    <div className="absolute top-1 right-1 w-5 h-5 bg-primary text-white rounded-full flex items-center justify-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
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

// FIX: Changed to a named export to resolve module resolution issues.
export const ImportPage: React.FC = () => {
    useTelegramBackButton(true);
    const { user } = useAuth();
    const [urls, setUrls] = useState('');
    const [importItems, setImportItems] = useState<ImportItem[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);

    const updateItemStatus = useCallback((
        id: string,
        status: ImportItem['status'],
        data: { listing?: ImportedListingData; errorMessage?: string; aiMeta?: AiResponseMeta } = {},
    ) => {
        setImportItems(prev =>
            prev.map(item =>
                item.id === id
                    ? {
                        ...item,
                        status,
                        listing: data.listing || item.listing,
                        errorMessage: data.errorMessage,
                        aiMeta: data.aiMeta || item.aiMeta,
                    }
                    : item,
            ),
        );
    }, []);

    const handleAddUrls = () => {
        const urlArray = urls.split('\n').map(u => u.trim()).filter(Boolean);
        const newItems: ImportItem[] = urlArray.map(url => ({
            id: `${Date.now()}-${Math.random()}`,
            url,
            status: 'pending'
        }));
        setImportItems(prev => [...newItems, ...prev]);
        setUrls('');
    };

    const processUrl = async (itemToProcess: ImportItem) => {
        try {
            // 1. Scrape directly from frontend as requested
            updateItemStatus(itemToProcess.id, 'scraping');
            
            // This fetch call is likely to be blocked by CORS policy on many websites.
            // This implementation follows the user's direct request.
            const response = await fetch(itemToProcess.url);
    
            if (!response.ok) {
                throw new Error(`Ошибка сети: ${response.status} ${response.statusText}`);
            }
            
            const html = await response.text();

            // 2. Clean HTML on frontend
            updateItemStatus(itemToProcess.id, 'parsing');
            const $ = cheerio.load(html);
            const body = $('body');
            body.find('script, style, link[rel="stylesheet"], noscript, iframe, footer, header, nav, svg, path, aside, form').remove();
            
            body.find('*').each(function () {
                const element = $(this);
                const preservedAttrs: { [key: string]: string } = {};
                if (element.is('img')) {
                    const src = element.attr('src');
                    if(src) preservedAttrs.src = new URL(src, itemToProcess.url).href;
                } else if (element.is('a')) {
                     const href = element.attr('href');
                     if(href) preservedAttrs.href = new URL(href, itemToProcess.url).href;
                }
                const currentAttrs = { ...element.attr() };
                Object.keys(currentAttrs).forEach(attrName => element.removeAttr(attrName));
                element.attr(preservedAttrs);
            });

            const cleanHtml = body.html();
            if (!cleanHtml || cleanHtml.trim().length < 100) {
              throw new Error('Очищенный HTML слишком короткий. Страница может быть пустой или заблокированной.');
            }

            // 3. Send clean HTML to AI for processing
            updateItemStatus(itemToProcess.id, 'enriching');
            const aiResult = await geminiService.processImportedHtml(cleanHtml);
            console.debug('AI import meta:', aiResult.meta);
            updateItemStatus(itemToProcess.id, 'success', { listing: aiResult.data, aiMeta: aiResult.meta });

        } catch (error: any) {
            updateItemStatus(itemToProcess.id, 'error', { errorMessage: `Не удалось загрузить страницу напрямую. Ошибка: ${error.message}. Вероятнее всего, сайт блокирует прямые запросы из браузера (CORS).` });
        }
    };

    const handleProcessAll = async () => {
        const delay = (ms: number) => new Promise(res => setTimeout(res, ms));
        setIsProcessing(true);
        const itemsToProcess = importItems.filter(item => item.status === 'pending' || item.status === 'error');
        for (const item of itemsToProcess) {
            await processUrl(item);
            await delay(5000); // Add a 5-second delay to avoid rate limiting
        }
        setIsProcessing(false);
    };

    const handleUpdateListing = useCallback((id: string, updatedListing: ImportedListingData) => {
        setImportItems(prev => prev.map(item => item.id === id ? { ...item, listing: updatedListing } : item));
    }, []);

    const handlePublish = async (item: ImportItem) => {
        if (!item.listing) return;
        updateItemStatus(item.id, 'publishing');
        try {
            // Upload images from external URLs to our Cloudinary
            const uploadedImageUrls = await Promise.all(
                item.listing.imageUrls.slice(0, 5).map(url => 
                    apiService.uploadFileFromUrl(url).then(res => res.url)
                )
            );
            
            const finalData: Partial<Product> = {
                title: item.listing.title,
                description: item.listing.description,
                price: item.listing.price,
                category: item.listing.category,
                dynamicAttributes: item.listing.dynamicAttributes,
                giftWrapAvailable: item.listing.giftWrapAvailable,
                productType: 'PHYSICAL',
            };

            await apiService.createListing(finalData, uploadedImageUrls, undefined, user);
            updateItemStatus(item.id, 'published');
        } catch (error: any) {
            updateItemStatus(item.id, 'publish_error', { errorMessage: error.message || 'Ошибка публикации.' });
        }
    };

    const handlePublishAll = async () => {
        setIsPublishing(true);
        const itemsToPublish = importItems.filter(item => item.status === 'success');
        for (const item of itemsToPublish) {
            await handlePublish(item);
        }
        setIsPublishing(false);
    };
    
    const removeItem = (id: string) => {
        setImportItems(prev => prev.filter(item => item.id !== id));
    };

    const getStatusComponent = (item: ImportItem) => {
        switch (item.status) {
            case 'pending': return <span className="text-xs text-base-content/70">Ожидание</span>;
            case 'scraping': return <div className="flex items-center gap-2 text-xs text-sky-400"><Spinner size="sm" /> <span>Получение HTML...</span></div>;
            case 'parsing': return <div className="flex items-center gap-2 text-xs text-sky-400"><Spinner size="sm" /> <span>Очистка...</span></div>;
            case 'enriching': return <div className="flex items-center gap-2 text-xs text-sky-400"><Spinner size="sm" /> <span>Анализ AI...</span></div>;
            case 'success': return <span className="text-xs text-green-400 font-semibold">Готово к публикации</span>;
            case 'publishing': return <div className="flex items-center gap-2 text-xs text-purple-400"><Spinner size="sm" /> <span>Публикация...</span></div>;
            case 'published': return <span className="text-xs text-green-400 font-semibold">✅ Опубликовано</span>;
            case 'error': return <span className="text-xs text-red-500 tooltip" data-tip={item.errorMessage}>Ошибка</span>;
            case 'publish_error': return <span className="text-xs text-red-500 tooltip" data-tip={item.errorMessage}>Ошибка публикации</span>;
            default: return null;
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="bg-base-100 p-6 sm:p-8 rounded-lg shadow-xl">
                <h1 className="text-3xl font-bold text-white mb-2">Импорт товаров</h1>
                <p className="text-base-content/70 mb-6">Вставьте ссылки на товары с других площадок. Каждая ссылка с новой строки.</p>
                <textarea
                    value={urls}
                    onChange={e => setUrls(e.target.value)}
                    rows={5}
                    placeholder="https://...
https://..."
                    className="w-full bg-base-200 border border-base-300 rounded-md p-3 font-mono text-sm"
                />
                <button
                    onClick={handleAddUrls}
                    disabled={!urls.trim()}
                    className="mt-4 w-full bg-secondary hover:bg-primary-focus text-white font-bold py-3 rounded-lg disabled:bg-gray-500"
                >
                    Добавить в очередь
                </button>
            </div>
            {importItems.length > 0 && (
                <div className="bg-base-100 p-6 sm:p-8 rounded-lg shadow-xl">
                    <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
                        <h2 className="text-2xl font-bold text-white">Очередь импорта ({importItems.length})</h2>
                        <div className="flex gap-2">
                             <button
                                onClick={handleProcessAll}
                                disabled={isProcessing || isPublishing}
                                className="bg-sky-600 hover:bg-sky-700 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center min-w-[120px] disabled:bg-gray-500"
                            >
                                {isProcessing ? <Spinner size="sm" /> : 'Обработать все'}
                            </button>
                             <button
                                onClick={handlePublishAll}
                                disabled={isPublishing || isProcessing || !importItems.some(i => i.status === 'success')}
                                className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center min-w-[120px] disabled:bg-gray-500"
                            >
                               {isPublishing ? <Spinner size="sm"/> : 'Опубликовать все'}
                            </button>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {importItems.map(item => (
                            <details key={item.id} className="border border-base-300 rounded-lg overflow-hidden group">
                                <summary className="p-4 flex items-center justify-between cursor-pointer bg-base-100 hover:bg-base-300/50">
                                    <div className="flex-1 overflow-hidden">
                                        <p className="font-mono text-sm text-base-content/80 truncate" title={item.url}>{item.url}</p>
                                        <div className="mt-1">{getStatusComponent(item)}</div>
                                    </div>
                                    <div className="flex items-center gap-2 ml-4">
                                        <button onClick={(e) => { e.preventDefault(); removeItem(item.id); }} className="text-red-500 hover:text-red-400 p-1 disabled:opacity-50" disabled={isProcessing || isPublishing}>
                                            <DynamicIcon name="delete-item" className="w-5 h-5" fallback={
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 4.8108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                                            }/>
                                        </button>
                                        <span className="transform transition-transform group-open:rotate-180 text-base-content/70">▼</span>
                                    </div>
                                </summary>
                                {item.listing && (
                                    <div className="p-4 border-t border-base-300">
                                        <EditableListingCard item={item} onUpdate={handleUpdateListing} disabled={item.status !== 'success'} />
                                         <button
                                            onClick={() => handlePublish(item)}
                                            disabled={isPublishing || isProcessing || item.status !== 'success'}
                                            className="mt-4 w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded-lg flex items-center justify-center disabled:bg-gray-500"
                                        >
                                            {item.status === 'publishing' ? <Spinner size="sm" /> : (item.status === 'published' ? 'Опубликовано' : 'Опубликовать этот товар')}
                                        </button>
                                    </div>
                                )}
                            </details>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
 
