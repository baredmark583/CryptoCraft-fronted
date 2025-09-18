

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import type { GeneratedListing, Product } from '../types';
import type { CategoryField } from '../constants';

import { geminiService } from '../services/geminiService';
import { cloudinaryService } from '../services/cloudinaryService';
import { apiService } from '../services/apiService';
import { fileToBase64 } from '../lib/utils';
import Spinner from '../components/Spinner';
import { CATEGORIES, getCategoryNames } from '../constants';

const AIGenerateForm: React.FC<{ onGenerated: (data: GeneratedListing, file: File) => void }> = ({ onGenerated }) => {
    const [description, setDescription] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            setPreview(URL.createObjectURL(file));
        }
    };

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
        } catch (err: any) {
            setError(err.message || 'Произошла ошибка при генерации.');
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
             <div>
                <label className="block text-sm font-medium text-brand-text-secondary mb-2">1. Загрузите фото товара</label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-brand-border border-dashed rounded-md">
                    <div className="space-y-1 text-center">
                        {preview ? (
                            <img src={preview} alt="Preview" className="mx-auto h-48 w-auto rounded-md"/>
                        ) : (
                             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="mx-auto h-12 w-12 text-brand-text-secondary">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                            </svg>
                        )}
                        <div className="flex text-sm text-brand-text-secondary">
                            <label htmlFor="file-upload" className="relative cursor-pointer bg-brand-surface rounded-md font-medium text-brand-primary hover:text-brand-primary-hover focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-brand-primary focus-within:ring-offset-brand-background px-1">
                                <span>Выберите файл</span>
                                <input id="file-upload" name="file-upload" type="file" className="sr-only" accept="image/*" onChange={handleImageChange} />
                            </label>
                            <p className="pl-1">или перетащите сюда</p>
                        </div>
                        <p className="text-xs text-brand-text-secondary">PNG, JPG, GIF до 10MB</p>
                    </div>
                </div>
            </div>

            <div>
                <label htmlFor="description" className="block text-sm font-medium text-brand-text-secondary">2. Кратко опишите товар</label>
                <textarea
                    id="description"
                    rows={3}
                    className="mt-1 block w-full bg-brand-background border border-brand-border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm"
                    placeholder="Например: 'керамическая ваза ручной работы, бежевая'"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <div>
                <button type="submit" disabled={isLoading} className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-brand-primary hover:bg-brand-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary disabled:bg-gray-500">
                    {isLoading ? <Spinner size="sm" /> : 'Сгенерировать объявление с ИИ'}
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
        className: "mt-1 block w-full bg-brand-background border border-brand-border rounded-md shadow-sm py-2 px-3",
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


type FormData = Omit<Product, 'id' | 'seller' | 'imageUrls'> & { saleType: 'FIXED_PRICE' | 'AUCTION', auctionDurationDays?: 1 | 3 | 7 };

const ListingReviewForm: React.FC<{ listingData: GeneratedListing & { productType: Product['productType']; saleType: string; }; imageFile: File }> = ({ listingData, imageFile }) => {
    const [formData, setFormData] = useState<Partial<FormData>>({
        ...listingData,
        productType: 'PHYSICAL',
        saleType: 'FIXED_PRICE',
    });
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const { user } = useAuth();
    const [preview, setPreview] = useState<string | null>(null);

    const categorySchema = useMemo(() => {
        return CATEGORIES.find(c => c.name === formData.category);
    }, [formData.category]);

    useEffect(() => {
        if (imageFile) {
            const objectUrl = URL.createObjectURL(imageFile);
            setPreview(objectUrl);
            return () => URL.revokeObjectURL(objectUrl);
        }
    }, [imageFile]);
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;

        if (type === 'checkbox') {
            const { checked } = e.target as HTMLInputElement;
            setFormData({ ...formData, [name]: checked });
            if(name === 'giftWrapAvailable' && !checked) {
                setFormData(prev => ({ ...prev, giftWrapPrice: undefined, [name]: checked }));
            }
        } else if (name === 'productType' || name === 'saleType') {
            const newFormData = { ...formData, [name]: value };
            if (name === 'saleType') {
                if (value === 'AUCTION') {
                    newFormData.salePrice = undefined; // No sale price for auctions
                    if (!newFormData.auctionDurationDays) newFormData.auctionDurationDays = 3; // Default duration
                } else {
                    newFormData.startingBid = undefined;
                    newFormData.auctionDurationDays = undefined;
                }
            }
            setFormData(newFormData);
        } else if (name === 'auctionDurationDays') {
            setFormData({ ...formData, [name]: parseInt(value) as 1 | 3 | 7 });
        } else {
            const isNumberField = [
                'price', 'salePrice', 'startingBid', 'purchaseCost', 'weight', 'giftWrapPrice'
            ].includes(name);

            setFormData({ 
                ...formData, 
                [name]: isNumberField ? (value === '' ? undefined : parseFloat(value)) : value 
            });
        }
    };

    const handleDynamicAttrChange = (name: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            dynamicAttributes: {
                ...prev.dynamicAttributes,
                [name]: value,
            }
        }));
    };

    const handlePublish = async () => {
        setIsLoading(true);
        try {
            const imageUrl = await cloudinaryService.uploadImage(imageFile);
            let videoUrl: string | undefined = undefined;
            if (videoFile) {
                videoUrl = await cloudinaryService.uploadVideo(videoFile);
            }
            
            const finalData = {
                ...formData,
                dynamicAttributes: categorySchema?.fields.reduce((acc, field) => {
                    const value = formData.dynamicAttributes?.[field.label];
                    if (value !== undefined) {
                        acc[field.label] = value;
                    }
                    return acc;
                }, {} as Record<string, any>)
            };

            const newProduct = await apiService.createListing(finalData, imageUrl, videoUrl, user);
            alert("Объявление успешно опубликовано!");
            navigate(`/product/${newProduct.id}`);
        } catch (error) {
            console.error(error);
            alert("Не удалось опубликовать объявление.");
            setIsLoading(false);
        }
    };
    
    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">3. Проверьте и опубликуйте</h2>
            <p className="text-brand-text-secondary">ИИ сгенерировал данные. Вы можете их отредактировать перед публикацией.</p>

            {preview && (
                <div className="my-4">
                    <img src={preview} alt="Preview" className="w-full h-auto max-h-64 object-contain rounded-lg shadow-md" />
                </div>
            )}

            <div>
                <label className="block text-sm font-medium text-brand-text-secondary">Заголовок</label>
                <input type="text" name="title" value={formData.title} onChange={handleChange} className="mt-1 block w-full bg-brand-background border border-brand-border rounded-md shadow-sm py-2 px-3"/>
            </div>
            <div>
                <label className="block text-sm font-medium text-brand-text-secondary">Описание</label>
                <textarea name="description" value={formData.description} onChange={handleChange} rows={6} className="mt-1 block w-full bg-brand-background border border-brand-border rounded-md shadow-sm py-2 px-3"/>
            </div>
            
            <div className="border-t border-b border-brand-border/50 py-6 space-y-4">
                <label className="block text-sm font-medium text-brand-text-secondary mb-2">Тип продажи</label>
                <div className="flex gap-2 p-1 bg-brand-background rounded-lg">
                    <label className={`flex-1 text-center cursor-pointer p-2 rounded-md transition-colors ${formData.saleType === 'FIXED_PRICE' ? 'bg-brand-primary text-white' : 'hover:bg-brand-surface'}`}>
                        <input type="radio" name="saleType" value="FIXED_PRICE" checked={formData.saleType === 'FIXED_PRICE'} onChange={handleChange} className="hidden"/>
                        <span>Фиксированная цена</span>
                    </label>
                    <label className={`flex-1 text-center cursor-pointer p-2 rounded-md transition-colors ${formData.saleType === 'AUCTION' ? 'bg-brand-primary text-white' : 'hover:bg-brand-surface'}`}>
                        <input type="radio" name="saleType" value="AUCTION" checked={formData.saleType === 'AUCTION'} onChange={handleChange} className="hidden"/>
                        <span>Аукцион</span>
                    </label>
                </div>

                {formData.saleType === 'AUCTION' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 animate-fade-in-down">
                        <div>
                            <label className="block text-sm font-medium text-brand-text-secondary">Стартовая цена (USDT)</label>
                            <input type="number" name="startingBid" value={formData.startingBid || ''} onChange={handleChange} className="mt-1 block w-full bg-brand-background border border-brand-border rounded-md shadow-sm py-2 px-3"/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-brand-text-secondary">Длительность аукциона</label>
                            <select name="auctionDurationDays" value={formData.auctionDurationDays || 3} onChange={handleChange} className="mt-1 block w-full bg-brand-background border border-brand-border rounded-md shadow-sm py-2 px-3">
                                <option value={1}>1 день</option>
                                <option value={3}>3 дня</option>
                                <option value={7}>7 дней</option>
                            </select>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 animate-fade-in-down">
                        <div>
                            <label className="block text-sm font-medium text-brand-text-secondary">Цена (USDT)</label>
                            <input type="number" name="price" value={formData.price} onChange={handleChange} className="mt-1 block w-full bg-brand-background border border-brand-border rounded-md shadow-sm py-2 px-3"/>
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-brand-text-secondary">Цена со скидкой (USDT)</label>
                             <input type="number" name="salePrice" placeholder="Не обязательно" value={formData.salePrice || ''} onChange={handleChange} className="mt-1 block w-full bg-brand-background border border-brand-border rounded-md shadow-sm py-2 px-3"/>
                        </div>
                    </div>
                )}
            </div>
            
            <div className="bg-brand-background/50 p-4 rounded-lg">
                <label htmlFor="video-upload" className="block text-sm font-medium text-brand-text-secondary mb-2">Видеообзор (необязательно)</label>
                <input 
                    id="video-upload" 
                    type="file" 
                    onChange={(e) => setVideoFile(e.target.files ? e.target.files[0] : null)}
                    className="block w-full text-sm text-brand-text-secondary file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-primary/20 file:text-brand-primary hover:file:bg-brand-primary/30"
                    accept="video/*"
                />
                <p className="text-xs text-brand-text-secondary mt-1">Добавьте короткое видео, чтобы лучше показать товар.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-brand-text-secondary">Категория</label>
                    <select name="category" value={formData.category} onChange={handleChange} className="mt-1 block w-full bg-brand-background border border-brand-border rounded-md shadow-sm py-2 px-3">
                         {getCategoryNames().map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                </div>
            </div>

            {categorySchema && categorySchema.fields.length > 0 && (
                <div className="border-t border-brand-border/50 pt-6 space-y-4">
                     <h3 className="text-lg font-semibold text-white">Характеристики категории "{formData.category}"</h3>
                     {categorySchema.fields.map(field => (
                         <div key={field.name}>
                             <label htmlFor={field.name} className="block text-sm font-medium text-brand-text-secondary">{field.label}</label>
                             <DynamicField field={field} value={formData.dynamicAttributes?.[field.label]} onChange={(name, value) => handleDynamicAttrChange(field.label, value)} />
                         </div>
                     ))}
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-brand-text-secondary">Закупочная стоимость (USDT)</label>
                    <input type="number" name="purchaseCost" value={formData.purchaseCost || ''} onChange={handleChange} className="mt-1 block w-full bg-brand-background border border-brand-border rounded-md shadow-sm py-2 px-3" placeholder="Для вашей аналитики"/>
                </div>
                 {formData.productType !== 'SERVICE' && (
                     <div>
                        <label className="block text-sm font-medium text-brand-text-secondary">Вес в упаковке (г)</label>
                         <input type="number" name="weight" value={formData.weight || ''} onChange={handleChange} className="mt-1 block w-full bg-brand-background border border-brand-border rounded-md shadow-sm py-2 px-3" placeholder="Например: 500"/>
                    </div>
                 )}
            </div>

            <div>
                <label className="block text-sm font-medium text-brand-text-secondary mb-2">Тип товара</label>
                <div className="flex gap-4">
                    <label className="flex items-center space-x-2 cursor-pointer">
                        <input type="radio" name="productType" value="PHYSICAL" checked={formData.productType === 'PHYSICAL' || !formData.productType} onChange={handleChange} className="h-4 w-4 text-brand-primary border-brand-border focus:ring-brand-primary"/>
                        <span>Физический</span>
                    </label>
                     <label className="flex items-center space-x-2 cursor-pointer">
                        <input type="radio" name="productType" value="DIGITAL" checked={formData.productType === 'DIGITAL'} onChange={handleChange} className="h-4 w-4 text-brand-primary border-brand-border focus:ring-brand-primary"/>
                        <span>Цифровой</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                        <input type="radio" name="productType" value="SERVICE" checked={formData.productType === 'SERVICE'} onChange={handleChange} className="h-4 w-4 text-brand-primary border-brand-border focus:ring-brand-primary"/>
                        <span>Услуга</span>
                    </label>
                </div>
            </div>
            
            {formData.productType === 'SERVICE' && (
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 animate-fade-in-down">
                    <div>
                        <label className="block text-sm font-medium text-brand-text-secondary">Срок выполнения</label>
                        <input type="text" name="turnaroundTime" value={formData.turnaroundTime || ''} onChange={handleChange} className="mt-1 block w-full bg-brand-background border border-brand-border rounded-md shadow-sm py-2 px-3" placeholder="Напр., 3-5 дней"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-brand-text-secondary">Место оказания</label>
                        <select name="serviceLocation" value={formData.serviceLocation || 'REMOTE'} onChange={handleChange} className="mt-1 block w-full bg-brand-background border border-brand-border rounded-md shadow-sm py-2 px-3">
                            <option value="REMOTE">Удаленно</option>
                            <option value="ON-SITE">На месте</option>
                        </select>
                    </div>
                </div>
            )}

            {formData.productType === 'DIGITAL' && (
                <div className="bg-brand-background/50 p-4 rounded-lg">
                    <label htmlFor="digital-file-upload" className="block text-sm font-medium text-brand-text-secondary mb-2">Загрузите файл товара</label>
                    <input id="digital-file-upload" type="file" className="block w-full text-sm text-brand-text-secondary file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-primary/20 file:text-brand-primary hover:file:bg-brand-primary/30" />
                    <p className="text-xs text-brand-text-secondary mt-1">Покупатель получит доступ к файлу сразу после оплаты.</p>
                </div>
            )}
            
            {(formData.productType === 'PHYSICAL' || !formData.productType) && (
                 <div className="space-y-4 bg-brand-background/50 p-4 rounded-lg">
                    <label className="flex items-center space-x-3 cursor-pointer">
                        <input type="checkbox" name="giftWrapAvailable" checked={!!formData.giftWrapAvailable} onChange={handleChange} className="h-4 w-4 rounded bg-brand-background border-brand-border text-brand-primary focus:ring-brand-primary"/>
                        <span className="font-medium text-white">Доступна подарочная упаковка</span>
                    </label>
                    {formData.giftWrapAvailable && (
                        <div className="pl-7">
                            <label className="block text-sm font-medium text-brand-text-secondary">Стоимость упаковки (USDT)</label>
                            <input type="number" name="giftWrapPrice" value={formData.giftWrapPrice || ''} onChange={handleChange} placeholder="Например: 5" className="mt-1 block w-full bg-brand-surface border border-brand-border rounded-md shadow-sm py-2 px-3"/>
                        </div>
                    )}
                </div>
            )}

            <button onClick={handlePublish} disabled={isLoading} className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-500">
                {isLoading ? <Spinner size="sm"/> : 'Опубликовать'}
            </button>
        </div>
    );
};


const CreateListingPage: React.FC = () => {
    const [step, setStep] = useState<'generate' | 'review'>('generate');
    const [generatedData, setGeneratedData] = useState<(GeneratedListing & { productType: Product['productType']; saleType: string; }) | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);

    const handleGenerated = (data: GeneratedListing, file: File) => {
        setGeneratedData({...data, productType: 'PHYSICAL', saleType: 'FIXED_PRICE' }); // Default to physical & fixed price
        setImageFile(file);
        setStep('review');
    };

    return (
        <div className="max-w-2xl mx-auto bg-brand-surface p-6 sm:p-8 rounded-lg shadow-xl">
            {step === 'generate' ? (
                <>
                    <h1 className="text-3xl font-bold text-center mb-2 text-white">Создайте объявление с помощью ИИ</h1>
                    <p className="text-center text-brand-text-secondary mb-8">Загрузите фото и опишите товар. Наш ИИ автоматически определит категорию, заполнит характеристики и создаст продающее описание.</p>
                    <AIGenerateForm onGenerated={handleGenerated} />
                </>
            ) : generatedData && imageFile ? (
                <ListingReviewForm listingData={generatedData} imageFile={imageFile} />
            ) : null}
        </div>
    );
};

export default CreateListingPage;