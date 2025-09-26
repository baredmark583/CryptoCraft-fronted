import React, { useState, useEffect, useMemo, useCallback } from 'react';
// FIX: Replaced v6 hooks with v5 equivalents for compatibility.
import { useParams, useNavigate, Link } from 'react-router-dom';
import { apiService } from '../services/apiService';
// FIX: Add missing import for cloudinaryService.
import { cloudinaryService } from '../services/cloudinaryService';
import { useAuth } from '../hooks/useAuth';
import type { Product, VariantAttribute, ProductVariant } from '../types';
// FIX: Correctly import types from constants file
import type { CategoryField, CategorySchema } from '../constants';
import Spinner from '../components/Spinner';
// FIX: Correctly import constants
import { useTelegramBackButton } from '../hooks/useTelegram';
import DynamicIcon from '../components/DynamicIcon';

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


type FormData = Omit<Product, 'id' | 'seller'> & { saleType: 'FIXED_PRICE' | 'AUCTION', auctionDurationDays?: 1 | 3 | 7, hasVariants: boolean };


const VariantEditor: React.FC<{
    attributes: VariantAttribute[];
    variants: ProductVariant[];
    onAttributesChange: (attributes: VariantAttribute[]) => void;
    onVariantsChange: (variants: ProductVariant[]) => void;
}> = ({ attributes, variants, onAttributesChange, onVariantsChange }) => {
    
    const [newAttributeName, setNewAttributeName] = useState('');
    const [newOptionInputs, setNewOptionInputs] = useState<Record<string, string>>({});

    const addAttribute = () => {
        if (newAttributeName.trim() && !attributes.find(a => a.name === newAttributeName.trim())) {
            onAttributesChange([...attributes, { name: newAttributeName.trim(), options: [] }]);
            setNewAttributeName('');
        }
    };

    const removeAttribute = (attrNameToRemove: string) => {
        onAttributesChange(attributes.filter(a => a.name !== attrNameToRemove));
    };

    const addOption = (attrName: string) => {
        const option = newOptionInputs[attrName]?.trim();
        if (!option) return;
        
        const newAttributes = attributes.map(attr => {
            if (attr.name === attrName && !attr.options.includes(option)) {
                return { ...attr, options: [...attr.options, option] };
            }
            return attr;
        });
        onAttributesChange(newAttributes);
        setNewOptionInputs(prev => ({ ...prev, [attrName]: '' }));
    };

    const removeOption = (attrName: string, optionToRemove: string) => {
        const newAttributes = attributes.map(attr => {
             if (attr.name === attrName) {
                return { ...attr, options: attr.options.filter(o => o !== optionToRemove) };
            }
            return attr;
        });
        onAttributesChange(newAttributes);
    };

    const handleVariantChange = (variantId: string, field: keyof ProductVariant, value: any) => {
        const newVariants = variants.map(v => {
            if (v.id === variantId) {
                const updatedValue = (field === 'price' || field === 'stock') ? (value === '' ? 0 : parseFloat(value)) : value;
                return { ...v, [field]: updatedValue };
            }
            return v;
        });
        onVariantsChange(newVariants);
    };

    // Auto-generate variants whenever attributes change
    useEffect(() => {
        const generateCombinations = (attrs: VariantAttribute[]): Record<string, string>[] => {
            if (attrs.length === 0 || attrs.some(a => a.options.length === 0)) {
                return [];
            }
        
            let combinations: Record<string, string>[] = [{}];
        
            for (const attr of attrs) {
                const newCombinations: Record<string, string>[] = [];
                for (const combination of combinations) {
                    for (const option of attr.options) {
                        newCombinations.push({ ...combination, [attr.name]: option });
                    }
                }
                combinations = newCombinations;
            }
            return combinations;
        };

        const combinations = generateCombinations(attributes);
        
        const newVariants = combinations.map((combo, index) => {
            // Try to find an existing variant to preserve its data
            const existingVariant = variants.find(v => {
                return Object.entries(combo).every(([key, value]) => v.attributes[key] === value);
            });
            return {
                id: existingVariant?.id || `variant-${Date.now()}-${index}`,
                attributes: combo,
                price: existingVariant?.price || 0,
                stock: existingVariant?.stock || 0,
                sku: existingVariant?.sku || '',
            };
        });
        
        onVariantsChange(newVariants);

    }, [attributes, onVariantsChange]);


    return (
        <div className="space-y-6">
            <div>
                <h4 className="font-semibold text-white mb-2">1. Определите атрибуты</h4>
                <div className="space-y-4">
                    {attributes.map(attr => (
                        <div key={attr.name} className="bg-base-200/50 p-3 rounded-md">
                            <div className="flex justify-between items-center mb-2">
                                <h5 className="font-medium text-base-content">{attr.name}</h5>
                                <button type="button" onClick={() => removeAttribute(attr.name)} className="text-red-500 hover:text-red-400 text-xs font-bold">Удалить</button>
                            </div>
                            <div className="flex flex-wrap gap-2 mb-2">
                                {attr.options.map(opt => (
                                    <span key={opt} className="bg-secondary/80 text-white text-sm px-2 py-1 rounded-md flex items-center gap-1">
                                        {opt}
                                        <button type="button" onClick={() => removeOption(attr.name, opt)} className="font-bold text-white/70 hover:text-white">&times;</button>
                                    </span>
                                ))}
                            </div>
                             <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Новая опция (напр., Синий)"
                                    value={newOptionInputs[attr.name] || ''}
                                    onChange={(e) => setNewOptionInputs(prev => ({...prev, [attr.name]: e.target.value}))}
                                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addOption(attr.name); } }}
                                    className="flex-grow bg-base-100 border border-base-300 rounded-md p-1.5 text-sm"
                                />
                                <button type="button" onClick={() => addOption(attr.name)} className="bg-secondary text-white px-3 text-sm rounded-md">+</button>
                            </div>
                        </div>
                    ))}
                </div>
                 <div className="flex gap-2 mt-4">
                    <input
                        type="text"
                        placeholder="Новый атрибут (напр., Размер)"
                        value={newAttributeName}
                        onChange={(e) => setNewAttributeName(e.target.value)}
                         onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addAttribute(); } }}
                        className="flex-grow bg-base-100 border border-base-300 rounded-md p-2"
                    />
                    <button type="button" onClick={addAttribute} className="bg-primary hover:bg-primary-focus text-white font-bold py-2 px-4 rounded-lg">Добавить атрибут</button>
                </div>
            </div>

            {variants.length > 0 && (
                <div>
                    <h4 className="font-semibold text-white mb-2">2. Настройте варианты</h4>
                    <div className="overflow-x-auto scrollbar-hide">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-base-200 text-xs text-base-content/70 uppercase">
                                <tr>
                                    <th scope="col" className="px-4 py-3">Вариант</th>
                                    <th scope="col" className="px-4 py-3">Цена (USDT)</th>
                                    <th scope="col" className="px-4 py-3">Кол-во</th>
                                    <th scope="col" className="px-4 py-3">SKU</th>
                                </tr>
                            </thead>
                            <tbody>
                                {variants.map(variant => (
                                    <tr key={variant.id} className="border-b border-base-300">
                                        <td className="px-4 py-3 font-medium text-white whitespace-nowrap">{Object.values(variant.attributes).join(' / ')}</td>
                                        <td className="px-4 py-3">
                                            <input type="number" value={variant.price} onChange={e => handleVariantChange(variant.id, 'price', e.target.value)} className="w-24 bg-base-100 border border-base-300 rounded-md p-1.5" />
                                        </td>
                                        <td className="px-4 py-3">
                                            <input type="number" value={variant.stock} onChange={e => handleVariantChange(variant.id, 'stock', e.target.value)} className="w-20 bg-base-100 border border-base-300 rounded-md p-1.5" />
                                        </td>
                                        <td className="px-4 py-3">
                                            <input type="text" value={variant.sku} onChange={e => handleVariantChange(variant.id, 'sku', e.target.value)} className="w-28 bg-base-100 border border-base-300 rounded-md p-1.5" />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    )
};


const EditListingPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    // FIX: Upgraded react-router-dom to v6. Replaced useHistory with useNavigate.
    const navigate = useNavigate();
    const { user } = useAuth();
    const [product, setProduct] = useState<Product | null>(null);
    const [formData, setFormData] = useState<Partial<FormData> | null>(null);
    const [imageUrls, setImageUrls] = useState<string[]>([]);
    const [newImageFiles, setNewImageFiles] = useState<File[]>([]);
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);
    const [categories, setCategories] = useState<CategorySchema[]>([]);

    useTelegramBackButton(true);
    
    const categorySchema = useMemo(() => {
        if (!formData?.category) return null;
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
    }, [formData?.category, categories]);


    useEffect(() => {
        if (!id) {
            navigate('/profile');
            return;
        }
        const fetchProduct = async () => {
            setIsLoading(true);
            const [data, fetchedCategories] = await Promise.all([
                apiService.getProductById(id),
                apiService.getCategories()
            ]);
            setCategories(fetchedCategories);
            if (data && data.seller.id === user.id) {
                setProduct(data);
                setImageUrls(data.imageUrls);
                setFormData({
                    title: data.title,
                    description: data.description,
                    price: data.price,
                    salePrice: data.salePrice,
                    category: data.category,
                    videoUrl: data.videoUrl,
                    dynamicAttributes: data.dynamicAttributes,
                    giftWrapAvailable: data.giftWrapAvailable,
                    giftWrapPrice: data.giftWrapPrice,
                    productType: data.productType || 'PHYSICAL',
                    saleType: data.isAuction ? 'AUCTION' : 'FIXED_PRICE',
                    startingBid: data.startingBid,
                    purchaseCost: data.purchaseCost,
                    weight: data.weight,
                    isAuthenticationAvailable: data.isAuthenticationAvailable,
                    hasVariants: !!data.variants && data.variants.length > 0,
                    variantAttributes: data.variantAttributes || [],
                    variants: data.variants || [],
                    isB2BEnabled: data.isB2BEnabled,
                    b2bMinQuantity: data.b2bMinQuantity,
                    b2bPrice: data.b2bPrice,
                });
            } else {
                alert("Товар не найден или у вас нет прав на его редактирование.");
                navigate('/profile');
            }
            setIsLoading(false);
        };
        fetchProduct();
    }, [id, user.id, navigate]);
    
    const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setNewImageFiles(prev => [...prev, ...Array.from(e.target.files!)]);
        }
    };

    const handleRemoveImage = (index: number) => {
        setImageUrls(prev => prev.filter((_, i) => i !== index));
    };

    const handleRemoveNewImage = (index: number) => {
        setNewImageFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        if (!formData) return;
        const { name, value, type } = e.target;
        
        if (type === 'checkbox') {
            const { checked } = e.target as HTMLInputElement;
            let newFormData: Partial<FormData> = { ...formData, [name]: checked };
            if(name === 'giftWrapAvailable' && !checked) {
               newFormData.giftWrapPrice = undefined;
            }
            if (name === 'hasVariants' && !checked) {
                newFormData.variants = [];
                newFormData.variantAttributes = [];
            }
            if (name === 'isB2BEnabled' && !checked) {
                newFormData.b2bMinQuantity = undefined;
                newFormData.b2bPrice = undefined;
            }
            setFormData(newFormData);

        } else if (name === 'productType' || name === 'saleType') {
             const newFormData = { ...formData, [name]: value };
            if (name === 'saleType') {
                if (value === 'AUCTION') {
                    newFormData.salePrice = undefined;
                    if (!newFormData.auctionDurationDays) newFormData.auctionDurationDays = 3;
                } else {
                    newFormData.startingBid = undefined;
                    newFormData.auctionDurationDays = undefined;
                }
            }
            setFormData(newFormData);
        } else if (name === 'auctionDurationDays') {
            setFormData({ ...formData, [name]: parseInt(value) as 1 | 3 | 7 });
        } else {
            setFormData({ 
                ...formData, 
                [name]: (name === 'price' || name === 'salePrice' || name === 'giftWrapPrice' || name === 'startingBid' || name === 'purchaseCost' || name === 'weight' || name === 'b2bMinQuantity' || name === 'b2bPrice') 
                        ? (value === '' ? undefined : parseFloat(value)) 
                        : value 
            });
        }
    };

     const handleDynamicAttrChange = (name: string, value: any) => {
        setFormData(prev => ({
            ...prev!,
            dynamicAttributes: {
                ...prev!.dynamicAttributes,
                [name]: value,
            }
        }));
    };

    const handleUpdate = async () => {
        if (!formData || !id) return;
        setIsUpdating(true);
        try {
            const dataToUpdate: Partial<Product> = { ...formData };
            
            // Handle image uploads
            const uploadedImageUrls = await Promise.all(
                newImageFiles.map(file => cloudinaryService.uploadImage(file))
            );
            dataToUpdate.imageUrls = [...imageUrls, ...uploadedImageUrls];
            
            if (videoFile) {
                dataToUpdate.videoUrl = await cloudinaryService.uploadVideo(videoFile);
            }

            if (!formData.hasVariants) {
                dataToUpdate.variants = [];
                dataToUpdate.variantAttributes = [];
            }
            delete (dataToUpdate as any).hasVariants;
            
            await apiService.updateListing(id, dataToUpdate);
            alert("Объявление успешно обновлено!");
            navigate(`/product/${id}`);
        } catch (error) {
            console.error(error);
            alert("Не удалось обновить объявление.");
        } finally {
            setIsUpdating(false);
        }
    };

    if (isLoading) {
        return <div className="flex justify-center items-center h-96"><Spinner /></div>;
    }

    if (!product || !formData) {
        return null; 
    }
    
    const categoryOptions = useMemo(() => flattenCategoriesForSelect(categories), [categories]);

    return (
        <div className="max-w-4xl mx-auto bg-base-100 p-6 sm:p-8 rounded-lg shadow-xl">
            <h1 className="text-3xl font-bold text-center mb-2 text-white">Редактировать объявление</h1>
            <div className="space-y-6 mt-8">
                {/* Image Management */}
                <div>
                    <label className="block text-sm font-medium text-base-content/70 mb-2">Изображения</label>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                        {imageUrls.map((url, index) => (
                            <div key={index} className="relative group">
                                <img src={url} alt={`Image ${index + 1}`} className="w-full aspect-square object-cover rounded-lg"/>
                                <button onClick={() => handleRemoveImage(index)} className="absolute top-1 right-1 bg-red-600/80 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">&times;</button>
                            </div>
                        ))}
                        {newImageFiles.map((file, index) => (
                             <div key={index} className="relative group">
                                <img src={URL.createObjectURL(file)} alt={`New Image ${index + 1}`} className="w-full aspect-square object-cover rounded-lg"/>
                                <button onClick={() => handleRemoveNewImage(index)} className="absolute top-1 right-1 bg-red-600/80 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">&times;</button>
                            </div>
                        ))}
                         <label htmlFor="image-upload" className="cursor-pointer w-full aspect-square bg-base-200 border-2 border-dashed border-base-300 rounded-lg flex flex-col items-center justify-center text-base-content/70 hover:border-primary hover:text-primary transition-colors">
                            <DynamicIcon name="add-image" className="h-8 w-8" fallback={
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                            }/>
                            <span className="text-xs mt-1">Добавить</span>
                            <input id="image-upload" type="file" multiple onChange={handleImageFileChange} className="hidden" accept="image/*" />
                        </label>
                    </div>
                     <Link to={`/studio/${product.id}`} className="mt-4 inline-flex items-center gap-2 text-sm text-secondary hover:text-primary">
                        <DynamicIcon name="ai-studio-link" className="h-5 w-5" fallback={
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" /></svg>
                        }/>
                        Улучшить фото в AI Студии
                    </Link>
                </div>

                <div>
                    <label className="block text-sm font-medium text-base-content/70">Заголовок</label>
                    <input type="text" name="title" value={formData.title} onChange={handleChange} className="mt-1 block w-full bg-base-200 border border-base-300 rounded-md shadow-sm py-2 px-3"/>
                </div>
                <div>
                    <label className="block text-sm font-medium text-base-content/70">Описание</label>
                    <textarea name="description" value={formData.description} onChange={handleChange} rows={6} className="mt-1 block w-full bg-base-200 border border-base-300 rounded-md shadow-sm py-2 px-3"/>
                </div>

                <div className="border-t border-b border-base-300/50 py-6 space-y-4">
                    <label className="block text-sm font-medium text-base-content/70 mb-2">Тип продажи</label>
                    <div className="flex gap-2 p-1 bg-base-200 rounded-lg">
                        <label className={`flex-1 text-center cursor-pointer p-2 rounded-md transition-colors ${formData.saleType === 'FIXED_PRICE' ? 'bg-primary text-white' : 'hover:bg-base-100'}`}>
                            <input type="radio" name="saleType" value="FIXED_PRICE" checked={formData.saleType === 'FIXED_PRICE'} onChange={handleChange} className="hidden"/>
                            <span>Фиксированная цена</span>
                        </label>
                        <label className={`flex-1 text-center cursor-pointer p-2 rounded-md transition-colors ${formData.saleType === 'AUCTION' ? 'bg-primary text-white' : 'hover:bg-base-100'}`}>
                            <input type="radio" name="saleType" value="AUCTION" checked={formData.saleType === 'AUCTION'} onChange={handleChange} className="hidden"/>
                            <span>Аукцион</span>
                        </label>
                    </div>

                    {formData.saleType === 'AUCTION' ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 animate-fade-in-down">
                            <div>
                                <label className="block text-sm font-medium text-base-content/70">Стартовая цена (USDT)</label>
                                <input type="number" name="startingBid" value={formData.startingBid || ''} onChange={handleChange} className="mt-1 block w-full bg-base-200 border border-base-300 rounded-md shadow-sm py-2 px-3"/>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-base-content/70">Длительность аукциона</label>
                                <p className="text-xs text-base-content/70">Изменение сбросит таймер</p>
                                <select name="auctionDurationDays" value={formData.auctionDurationDays || ''} onChange={handleChange} className="mt-1 block w-full bg-base-200 border border-base-300 rounded-md shadow-sm py-2 px-3">
                                    <option value="" disabled>Выберите длительность</option>
                                    <option value={1}>1 день</option>
                                    <option value={3}>3 дня</option>
                                    <option value={7}>7 дней</option>
                                </select>
                            </div>
                        </div>
                    ) : (
                         <div className={`grid grid-cols-1 sm:grid-cols-2 gap-6 animate-fade-in-down ${formData.hasVariants ? 'opacity-50' : ''}`}>
                            <div>
                                <label className="block text-sm font-medium text-base-content/70">Цена (USDT)</label>
                                <input type="number" name="price" value={formData.price || ''} onChange={handleChange} disabled={formData.hasVariants} className="mt-1 block w-full bg-base-200 border border-base-300 rounded-md shadow-sm py-2 px-3 disabled:cursor-not-allowed"/>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-base-content/70">Цена со скидкой (USDT)</label>
                                <input type="number" name="salePrice" placeholder="Не обязательно" value={formData.salePrice || ''} onChange={handleChange} disabled={formData.hasVariants} className="mt-1 block w-full bg-base-200 border border-base-300 rounded-md shadow-sm py-2 px-3 disabled:cursor-not-allowed"/>
                            </div>
                        </div>
                    )}
                </div>

                 <div className="bg-base-200/50 p-4 rounded-lg">
                    <label htmlFor="video-upload" className="block text-sm font-medium text-base-content/70 mb-2">Видеообзор (необязательно)</label>
                    {formData.videoUrl && !videoFile && (
                        <div className="mb-2 text-sm">
                            <span className="text-base-content/70">Текущее видео: </span>
                            <a href={formData.videoUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate">{formData.videoUrl}</a>
                        </div>
                    )}
                    <input 
                        id="video-upload" 
                        type="file" 
                        onChange={(e) => setVideoFile(e.target.files ? e.target.files[0] : null)}
                        className="block w-full text-sm text-base-content/70 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/20 file:text-primary hover:file:bg-primary/30"
                        accept="video/*"
                    />
                    <p className="text-xs text-base-content/70 mt-1">Загрузите новое видео, чтобы заменить текущее.</p>
                </div>

                {/* Variant Section */}
                <div className="border-t border-base-300/50 pt-6 space-y-4">
                    <label className="flex items-center space-x-3 cursor-pointer">
                        <input type="checkbox" name="hasVariants" checked={!!formData.hasVariants} onChange={handleChange} className="h-5 w-5 rounded bg-base-200 border-base-300 text-primary focus:ring-primary"/>
                        <span className="font-semibold text-lg text-white">У товара есть несколько вариантов (размер, цвет и т.д.)</span>
                    </label>
                    {formData.hasVariants && (
                        <div className="p-4 bg-base-200 rounded-lg animate-fade-in-down">
                            <VariantEditor
                                attributes={formData.variantAttributes || []}
                                variants={formData.variants || []}
                                onAttributesChange={(attrs) => setFormData(prev => ({...prev!, variantAttributes: attrs}))}
                                onVariantsChange={(vars) => setFormData(prev => ({...prev!, variants: vars}))}
                            />
                        </div>
                    )}
                </div>
                
                {/* B2B Section */}
                <div className="border-t border-base-300/50 pt-6 space-y-4">
                    <label className="flex items-center space-x-3 cursor-pointer">
                        <input type="checkbox" name="isB2BEnabled" checked={!!formData.isB2BEnabled} onChange={handleChange} className="h-5 w-5 rounded bg-base-200 border-base-300 text-primary focus:ring-primary"/>
                        <span className="font-semibold text-lg text-white">Включить оптовые продажи (B2B)</span>
                    </label>
                    {formData.isB2BEnabled && (
                        <div className="p-4 bg-base-200 rounded-lg animate-fade-in-down grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-base-content/70">Минимальное кол-во для опта</label>
                                <input type="number" name="b2bMinQuantity" value={formData.b2bMinQuantity || ''} onChange={handleChange} placeholder="Например: 10" className="mt-1 block w-full bg-base-100 border border-base-300 rounded-md shadow-sm py-2 px-3"/>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-base-content/70">Оптовая цена за шт. (USDT)</label>
                                <input type="number" name="b2bPrice" value={formData.b2bPrice || ''} onChange={handleChange} placeholder="Например: 25.00" className="mt-1 block w-full bg-base-100 border border-base-300 rounded-md shadow-sm py-2 px-3"/>
                            </div>
                        </div>
                    )}
                </div>


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

                {categorySchema?.name === 'Электроника' && (
                    <div className="bg-base-200/50 p-4 rounded-lg">
                        <label className="flex items-center space-x-3 cursor-pointer">
                            <input 
                                type="checkbox"
                                name="isAuthenticationAvailable"
                                checked={!!formData.isAuthenticationAvailable}
                                onChange={handleChange}
                                className="h-4 w-4 rounded bg-base-200 border-base-300 text-primary focus:ring-primary"
                            />
                            <span className="font-medium text-white">Предложить проверку подлинности для этого товара</span>
                        </label>
                        <p className="text-xs text-base-content/70 mt-2 pl-7">
                            Позволяет покупателям быть уверенными в вашем товаре. Услуга платная. Вы сможете запросить ее после сохранения.
                        </p>
                    </div>
                )}

                {categorySchema && categorySchema.fields.length > 0 && (
                <div className="border-t border-base-300/50 pt-6 space-y-4">
                     <h3 className="text-lg font-semibold text-white">Характеристики категории "{formData.category}"</h3>
                     {categorySchema.fields.map(field => (
                         <div key={field.name}>
                             <label htmlFor={field.name} className="block text-sm font-medium text-base-content/70">{field.label}</label>
                             <DynamicField field={field} value={formData.dynamicAttributes?.[field.label]} onChange={(name, value) => handleDynamicAttrChange(field.label, value)} />
                         </div>
                     ))}
                </div>
                )}

                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-base-content/70">Закупочная стоимость (USDT)</label>
                        <input type="number" name="purchaseCost" value={formData.purchaseCost || ''} onChange={handleChange} className="mt-1 block w-full bg-base-200 border border-base-300 rounded-md shadow-sm py-2 px-3" placeholder="Для вашей аналитики"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-base-content/70">Вес в упаковке (г)</label>
                        <input type="number" name="weight" value={formData.weight || ''} onChange={handleChange} className="mt-1 block w-full bg-base-200 border border-base-300 rounded-md shadow-sm py-2 px-3" placeholder="Например: 500"/>
                    </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-base-content/70 mb-2">Тип товара</label>
                  <div className="flex gap-4">
                      <label className="flex items-center space-x-2 cursor-pointer">
                          <input type="radio" name="productType" value="PHYSICAL" checked={formData.productType === 'PHYSICAL'} onChange={handleChange} className="h-4 w-4 text-primary border-base-300 focus:ring-primary"/>
                          <span>Физический</span>
                      </label>
                       <label className="flex items-center space-x-2 cursor-pointer">
                          <input type="radio" name="productType" value="DIGITAL" checked={formData.productType === 'DIGITAL'} onChange={handleChange} className="h-4 w-4 text-primary border-base-300 focus:ring-primary"/>
                          <span>Цифровой</span>
                      </label>
                  </div>
                </div>

                {formData.productType === 'DIGITAL' && (
                  <div className="bg-base-200/50 p-4 rounded-lg">
                      <p className="text-sm text-base-content/70">Текущий файл: <span className="font-mono text-primary">{product.digitalFileUrl || 'Не загружен'}</span></p>
                      <label htmlFor="digital-file-upload" className="block text-sm font-medium text-base-content/70 mt-2 mb-2">Загрузить новый файл</label>
                      <input id="digital-file-upload" type="file" className="block w-full text-sm text-base-content/70 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/20 file:text-primary hover:file:bg-primary/30" />
                  </div>
                )}
            
                {formData.productType === 'PHYSICAL' && (
                    <div className="space-y-4 bg-base-200/50 p-4 rounded-lg">
                      <label className="flex items-center space-x-3 cursor-pointer">
                          <input type="checkbox" name="giftWrapAvailable" checked={!!formData.giftWrapAvailable} onChange={handleChange} className="h-4 w-4 rounded bg-base-200 border-base-300 text-primary focus:ring-primary"/>
                          <span className="font-medium text-white">Доступна подарочная упаковка</span>
                      </label>
                      {formData.giftWrapAvailable && (
                          <div className="pl-7">
                              <label className="block text-sm font-medium text-base-content/70">Стоимость упаковки (USDT)</label>
                              <input type="number" name="giftWrapPrice" value={formData.giftWrapPrice || ''} onChange={handleChange} placeholder="Например: 5" className="mt-1 block w-full bg-base-100 border border-base-300 rounded-md shadow-sm py-2 px-3"/>
                          </div>
                      )}
                  </div>
                )}

                <button onClick={handleUpdate} disabled={isUpdating} className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-500">
                    {isUpdating ? <Spinner size="sm"/> : 'Сохранить изменения'}
                </button>
            </div>
        </div>
    );
};

export default EditListingPage;
