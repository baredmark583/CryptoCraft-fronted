


import React, { useState, useMemo, useCallback, useEffect } from 'react';
// FIX: Upgraded react-router-dom to v6. Replaced useHistory with useNavigate.
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import type { GeneratedListing, Product } from '../types';
// FIX: Correctly import types from constants file
import type { CategoryField, CategorySchema } from '../constants';

import { geminiService } from '../services/geminiService';
import { cloudinaryService } from '../services/cloudinaryService';
import { apiService } from '../services/apiService';
import { fileToBase64 } from '../lib/utils';
import Spinner from '../components/Spinner';
import { useTelegramBackButton } from '../hooks/useTelegram';
import DynamicIcon from '../components/DynamicIcon';


// --- TYPES ---
type FormData = Omit<Product, 'id' | 'seller' | 'imageUrls'> & { saleType: 'FIXED_PRICE' | 'AUCTION', auctionDurationDays?: 1 | 3 | 7 };

interface BatchItem {
    id: string;
    formData: Partial<FormData>;
    imageFile: File;
    previewUrl: string;
    status: 'review' | 'publishing' | 'published' | 'error';
    publishError?: string;
}

// --- HELPERS ---
const flattenCategoriesForSelect = (categories: CategorySchema[], level = 0): { label: string, value: string }[] => {
    let options: { label: string, value: string }[] = [];
    const indent = '\u00A0\u00A0'.repeat(level); // Use non-breaking spaces for indentation

    for (const category of categories) {
        options.push({ label: `${indent}${category.name}`, value: category.name });
        if (category.subcategories && category.subcategories.length > 0) {
            options = options.concat(flattenCategoriesForSelect(category.subcategories, level + 1));
        }
    }
    return options;
};


// --- COMPONENTS ---

const AIGenerateForm: React.FC<{ onGenerated: (data: GeneratedListing, file: File) => void, disabled: boolean }> = ({ onGenerated, disabled }) => {
    const [description, setDescription] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            const objectUrl = URL.createObjectURL(file);
            setPreview(objectUrl);
        }
    };
    
    const resetForm = () => {
        setDescription('');
        setImageFile(null);
        if (preview) {
             URL.revokeObjectURL(preview);
        }
        setPreview(null);
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!imageFile || !description) {
            setError('Пожалуйста, загрузите фото и добавьте краткое описание.');
            return;
        }
        setIsLoading(true);
        setError('');
        try {
            const base64Image = await fileToBase64(imageFile);
            const generatedData = await geminiService.generateListingDetails(base64Image, description);
            onGenerated(generatedData, imageFile);
            resetForm(); // Reset form after successful generation and addition
        } catch (err: any) {
            setError(err.message || 'Произошла ошибка при генерации.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
             <div>
                <label className="block text-sm font-medium text-base-content/70 mb-2">1. Загрузите фото товара</label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-base-300 border-dashed rounded-md">
                    <div className="space-y-1 text-center">
                        {preview ? (
                            <img src={preview} alt="Preview" className="mx-auto h-48 w-auto rounded-md"/>
                        ) : (
                            <DynamicIcon name="upload-image" className="mx-auto h-12 w-12 text-base-content/70" fallback={
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                   <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                                </svg>
                            }/>
                        )}
                        <div className="flex text-sm text-base-content/70">
                            <label htmlFor="file-upload" className="relative cursor-pointer bg-base-100 rounded-md font-medium text-primary hover:text-primary-focus focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary focus-within:ring-offset-base-200 px-1">
                                <span>Выберите файл</span>
                                <input id="file-upload" name="file-upload" type="file" className="sr-only" accept="image/*" onChange={handleImageChange} />
                            </label>
                            <p className="pl-1">или перетащите сюда</p>
                        </div>
                        <p className="text-xs text-base-content/70">PNG, JPG, GIF до 10MB</p>
                    </div>
                </div>
            </div>

            <div>
                <label htmlFor="description" className="block text-sm font-medium text-base-content/70">2. Кратко опишите товар</label>
                <textarea
                    id="description"
                    rows={3}
                    className="mt-1 block w-full bg-base-200 border border-base-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                    placeholder="Например: 'керамическая ваза ручной работы, бежевая'"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={disabled}
                />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <div>
                <button type="submit" disabled={isLoading || disabled} className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-primary hover:bg-primary-focus focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:bg-gray-500">
                    {isLoading ? <Spinner size="sm" /> : 'Добавить товар в пакет'}
                </button>
            </div>
        </form>
    )
};

const DynamicField: React.FC<{ field: CategoryField, value: any, onChange: (name: string, value: any) => void }> = ({ field, value, onChange }) => {
    const commonProps = {
        name: field.name,
        id: field.name,
        value: value || '',
        onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => onChange(field.name, e.target.value),
        className: "mt-1 block w-full bg-base-200 border border-base-300 rounded-md shadow-sm py-2 px-3",
        required: field.required,
    };

    switch (field.type) {
        case 'text':
            return <input type="text" {...commonProps} />;
        case 'number':
            return <input type="number" {...commonProps} />;
        case 'select':
            return (
                <select {...commonProps}>
                    <option value="">Выберите...</option>
                    {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
            );
        default:
            return null;
    }
};

const ListingReviewCard: React.FC<{ item: BatchItem; onUpdate: (id: string, data: Partial<FormData>) => void; onRemove: (id: string) => void; isPublishing: boolean; categories: CategorySchema[] }> = ({ item, onUpdate, onRemove, isPublishing, categories }) => {
    const { formData } = item;

    const categorySchema = useMemo(() => {
        const findCategory = (cats: CategorySchema[], name: string): CategorySchema | null => {
            for (const cat of cats) {
                if (cat.name === name) return cat;
                if (cat.subcategories) {
                    const found = findCategory(cat.subcategories, name);
                    if (found) return found;
                }
            }
            return null;
        }
        return findCategory(categories, formData.category);
    }, [formData.category, categories]);


    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        
        let newFormData = { ...formData };
        
        if (type === 'checkbox') {
            const { checked } = e.target as HTMLInputElement;
            newFormData = { ...newFormData, [name]: checked };
            if(name === 'giftWrapAvailable' && !checked) {
                newFormData.giftWrapPrice = undefined;
            }
        } else {
             const isNumberField = ['price', 'salePrice', 'startingBid', 'purchaseCost', 'weight', 'giftWrapPrice'].includes(name);
             newFormData = { ...newFormData, [name]: isNumberField ? (value === '' ? undefined : parseFloat(value)) : value };
        }
        onUpdate(item.id, newFormData);
    };

    const handleDynamicAttrChange = (name: string, value: any) => {
        const newFormData = {
            ...formData,
            dynamicAttributes: {
                ...formData.dynamicAttributes,
                [name]: value,
            }
        };
        onUpdate(item.id, newFormData);
    };
    
    const statusOverlay = useMemo(() => {
        if (item.status === 'review' && !isPublishing) return null;
        
        let content;
        switch (item.status) {
            case 'publishing':
                content = <><Spinner size="sm" /><span className="ml-2">Публикация...</span></>;
                break;
            case 'published':
                content = <>✅<span className="ml-2">Опубликовано</span></>;
                break;
            case 'error':
                 content = <>❌<span className="ml-2">Ошибка</span></>;
                 break;
            default:
                return null;
        }
        
        return (
             <div className="absolute inset-0 bg-base-200/80 backdrop-blur-sm flex items-center justify-center text-white font-bold rounded-lg z-10">
                {content}
            </div>
        );
    }, [item.status, isPublishing]);

    const categoryOptions = useMemo(() => flattenCategoriesForSelect(categories), [categories]);

    return (
        <details className="border border-base-300 rounded-lg overflow-hidden group">
            <summary className="p-4 flex items-center justify-between cursor-pointer bg-base-100 group-hover:bg-base-300/50">
                <div className="flex items-center gap-4">
                    <img src={item.previewUrl} alt="Preview" className="w-12 h-12 rounded-md object-cover"/>
                    <span className="font-semibold text-white">{formData.title || "Новый товар"}</span>
                </div>
                <div className="flex items-center gap-2">
                    <button type="button" onClick={(e) => { e.preventDefault(); onRemove(item.id); }} disabled={isPublishing} className="text-red-500 hover:text-red-400 p-1 disabled:opacity-50">
                         <DynamicIcon name="delete-item" className="w-5 h-5" fallback={
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 4.8108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                         }/>
                    </button>
                    <span className="transform transition-transform group-open:rotate-180 text-base-content/70">▼</span>
                </div>
            </summary>
            <div className="p-4 space-y-4 relative">
                {statusOverlay}
                 <div>
                    <label className="block text-sm font-medium text-base-content/70">Заголовок</label>
                    <input type="text" name="title" value={formData.title} onChange={handleChange} className="mt-1 block w-full bg-base-200 border border-base-300 rounded-md shadow-sm py-2 px-3"/>
                </div>
                <div>
                    <label className="block text-sm font-medium text-base-content/70">Описание</label>
                    <textarea name="description" value={formData.description} onChange={handleChange} rows={6} className="mt-1 block w-full bg-base-200 border border-base-300 rounded-md shadow-sm py-2 px-3"/>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-base-content/70">Цена (USDT)</label>
                        <input type="number" name="price" value={formData.price} onChange={handleChange} className="mt-1 block w-full bg-base-200 border border-base-300 rounded-md shadow-sm py-2 px-3"/>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-base-content/70">Цена со скидкой (USDT)</label>
                         <input type="number" name="salePrice" placeholder="Не обязательно" value={formData.salePrice || ''} onChange={handleChange} className="mt-1 block w-full bg-base-200 border border-base-300 rounded-md shadow-sm py-2 px-3"/>
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-base-content/70">Категория</label>
                        <select name="category" value={formData.category} onChange={handleChange} className="mt-1 block w-full bg-base-200 border border-base-300 rounded-md shadow-sm py-2 px-3">
                            <option value="">- Выберите категорию -</option>
                            {categoryOptions.map(opt => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {categorySchema && categorySchema.fields.length > 0 && (
                    <div className="border-t border-base-300/50 pt-6 space-y-4">
                         <h3 className="text-lg font-semibold text-white">Характеристики категории "{formData.category}"</h3>
                         {categorySchema.fields.map(field => (
                             <div key={field.name}>
                                 <label htmlFor={`${item.id}-${field.name}`} className="block text-sm font-medium text-base-content/70">{field.label}</label>
                                 <DynamicField field={{...field, name: `${item.id}-${field.name}`}} value={formData.dynamicAttributes?.[field.label]} onChange={(name, value) => handleDynamicAttrChange(field.label, value)} />
                             </div>
                         ))}
                    </div>
                )}
            </div>
        </details>
    );
};

const CreateListingPage: React.FC = () => {
    const { user } = useAuth();
    // FIX: Upgraded react-router-dom to v6. Replaced useHistory with useNavigate.
    const navigate = useNavigate();
    const [batchItems, setBatchItems] = useState<BatchItem[]>([]);
    const [isPublishing, setIsPublishing] = useState(false);
    const [categories, setCategories] = useState<CategorySchema[]>([]);
    const [isLoadingCategories, setIsLoadingCategories] = useState(true);

    useTelegramBackButton(true);
    
    useEffect(() => {
        apiService.getCategories()
            .then(setCategories)
            .finally(() => setIsLoadingCategories(false));
    }, []);

    const handleAddItemToBatch = (generatedData: GeneratedListing, imageFile: File) => {
        const previewUrl = URL.createObjectURL(imageFile);
        const newItem: BatchItem = {
            id: `${Date.now()}-${Math.random()}`,
            formData: {
                ...generatedData,
                productType: 'PHYSICAL',
                saleType: 'FIXED_PRICE',
            },
            imageFile,
            previewUrl,
            status: 'review',
        };
        setBatchItems(prev => [newItem, ...prev]);
    };

    const handleUpdateBatchItem = useCallback((id: string, updatedData: Partial<FormData>) => {
        setBatchItems(prev =>
            prev.map(item => item.id === id ? { ...item, formData: { ...item.formData, ...updatedData } } : item)
        );
    }, []);

    const handleRemoveBatchItem = useCallback((id: string) => {
        setBatchItems(prev => {
            const itemToRemove = prev.find(item => item.id === id);
            if (itemToRemove) {
                URL.revokeObjectURL(itemToRemove.previewUrl);
            }
            return prev.filter(item => item.id !== id);
        });
    }, []);

    const handlePublishBatch = async () => {
        setIsPublishing(true);
        const itemsToPublish = batchItems.filter(item => item.status === 'review');
    
        for (const item of itemsToPublish) {
            setBatchItems(prev => prev.map(i => i.id === item.id ? { ...i, status: 'publishing' } : i));
            try {
                const imageUrl = await cloudinaryService.uploadImage(item.imageFile);
                const finalData = item.formData;
                
                const newProduct = await apiService.createListing(finalData, [imageUrl], undefined, user);
                
                setBatchItems(prev => prev.map(i => i.id === item.id ? { ...i, status: 'published' } : i));
            } catch (error) {
                console.error(`Failed to publish item ${item.formData.title}:`, error);
                const errorMessage = error instanceof Error ? error.message : "Неизвестная ошибка";
                setBatchItems(prev => prev.map(i => i.id === item.id ? { ...i, status: 'error', publishError: errorMessage } : i));
            }
        }
    
        alert("Публикация завершена!");
        // We can leave published items on the screen for review or clear them.
        // Let's clear them after a delay for better UX
        setTimeout(() => {
            setBatchItems(prev => prev.filter(item => item.status !== 'published'));
            setIsPublishing(false);
        }, 3000);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="card bg-base-100 shadow-xl border border-base-300">
              <div className="card-body p-6 sm:p-8">
                <h1 className="text-3xl font-bold text-center mb-2 text-white">Групповое создание объявлений</h1>
                <p className="text-center text-base-content/70 mb-8">Подготовьте несколько товаров и опубликуйте их все разом.</p>
                <AIGenerateForm onGenerated={handleAddItemToBatch} disabled={isPublishing} />
              </div>
            </div>

            {batchItems.length > 0 && (
                <div className="card bg-base-100 shadow-xl border border-base-300">
                  <div className="card-body p-6 sm:p-8">
                    <h2 className="text-2xl font-bold text-white mb-4">Пакет для публикации ({batchItems.length})</h2>
                    {isLoadingCategories ? <Spinner /> : (
                        <div className="space-y-4 mb-6">
                            {batchItems.map(item => (
                                <ListingReviewCard 
                                    key={item.id} 
                                    item={item}
                                    onUpdate={handleUpdateBatchItem}
                                    onRemove={handleRemoveBatchItem}
                                    isPublishing={isPublishing}
                                    categories={categories}
                                />
                            ))}
                        </div>
                    )}
                    <button 
                        onClick={handlePublishBatch} 
                        disabled={isPublishing || batchItems.every(i => i.status !== 'review')}
                        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-500"
                    >
                        {isPublishing ? <Spinner size="sm"/> : `Опубликовать пакет (${batchItems.filter(i => i.status === 'review').length})`}
                    </button>
                  </div>
                </div>
            )}
        </div>
    );
};

export default CreateListingPage;