import React, { useState, useEffect, useMemo, useCallback } from 'react';
// FIX: Replaced v6 hooks with v5 equivalents for compatibility.
import { useParams, useNavigate, Link } from 'react-router-dom';
import { apiService } from '../services/apiService';
// FIX: Add missing import for cloudinaryService.
import { cloudinaryService } from '../services/cloudinaryService';
import { useAuth } from '../hooks/useAuth';
import type { Product, VariantAttribute, ProductVariant, ProductRevision } from '../types';
// FIX: Correctly import types from constants file
import type { CategorySchema, CategoryFieldWithMeta } from '../constants';
import Spinner from '../components/Spinner';
// FIX: Correctly import constants
import { useTelegramBackButton } from '../hooks/useTelegram';
import DynamicIcon from '../components/DynamicIcon';
import {
    findCategoryByName,
    normalizeDynamicAttributesForCategory,
    resolveFieldsForCategory,
} from '../lib/categoryUtils';

const revisionSourceLabels: Record<ProductRevision['source'], string> = {
    CREATE: 'Создание',
    UPDATE: 'Редактирование',
    RESTORE: 'Восстановление',
};

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


const DynamicField: React.FC<{ field: CategoryFieldWithMeta, value: any, onChange: (value: any) => void }> = ({ field, value, onChange }) => {
    const commonProps = {
        name: field.name,
        id: field.name,
        value: value ?? '',
        onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => onChange(e.target.value),
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

const PreviewShell: React.FC<{ title: string; subtitle?: string; onClose: () => void; children: React.ReactNode }> = ({ title, subtitle, onClose, children }) => (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
        <div className="bg-base-100 rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-base-300 flex justify-between items-center gap-4">
                <div>
                    <h2 className="text-xl font-bold text-white">{title}</h2>
                    {subtitle && <p className="text-sm text-base-content/60">{subtitle}</p>}
                </div>
                <button onClick={onClose} className="btn btn-sm btn-ghost text-white">Закрыть</button>
            </div>
            <div className="p-6 overflow-y-auto space-y-5">{children}</div>
        </div>
    </div>
);

const PreviewContent: React.FC<{
    title: string;
    category?: string;
    price?: number;
    salePrice?: number;
    description?: string;
    imageUrls: string[];
    dynamicAttributes?: Record<string, string | number>;
}> = ({ title, category, price, salePrice, description, imageUrls, dynamicAttributes }) => (
    <>
        <div>
            <p className="text-2xl font-bold text-white">{title}</p>
            {category && <p className="text-sm text-base-content/70 mt-1">{category}</p>}
            {(price || salePrice) && (
                <div className="mt-2 flex items-baseline gap-2 text-xl font-semibold text-primary">
                    {price && <span>{price} USDT</span>}
                    {salePrice && <span className="text-sm line-through text-base-content/60">{salePrice} USDT</span>}
                </div>
            )}
        </div>
        {description && (
            <div className="prose prose-invert max-w-none text-base-content/80" dangerouslySetInnerHTML={{ __html: description }} />
        )}
        {imageUrls?.length > 0 && (
            <div className="grid grid-cols-2 gap-3">
                {imageUrls.map((url) => (
                    <img key={url} src={url} alt="Предпросмотр изображения" className="w-full aspect-square object-cover rounded-lg border border-base-300" />
                ))}
            </div>
        )}
        {dynamicAttributes && Object.keys(dynamicAttributes).length > 0 && (
            <div className="bg-base-200/40 rounded-lg p-4 space-y-1 text-sm">
                {Object.entries(dynamicAttributes).map(([key, value]) => (
                    <div key={key} className="flex justify-between gap-4">
                        <span className="text-base-content/60">{key}</span>
                        <span className="text-base-content font-medium">{String(value)}</span>
                    </div>
                ))}
            </div>
        )}
    </>
);

const RevisionPreviewModal: React.FC<{ revision: ProductRevision; onClose: () => void }> = ({ revision, onClose }) => (
    <PreviewShell
        title={`Версия от ${new Date(revision.createdAt).toLocaleString()}`}
        subtitle={revisionSourceLabels[revision.source]}
        onClose={onClose}
    >
        <PreviewContent
            title={revision.snapshot.title}
            category={revision.snapshot.category}
            price={revision.snapshot.price}
            salePrice={revision.snapshot.salePrice}
            description={revision.snapshot.description}
            imageUrls={revision.snapshot.imageUrls || []}
            dynamicAttributes={revision.snapshot.dynamicAttributes}
        />
    </PreviewShell>
);

const DraftPreviewModal: React.FC<{ formData: FormData; imageUrls: string[]; onClose: () => void }> = ({ formData, imageUrls, onClose }) => (
    <PreviewShell title="Предпросмотр вашего черновика" onClose={onClose}>
        <PreviewContent
            title={formData.title}
            category={formData.category}
            price={formData.price}
            salePrice={formData.salePrice}
            description={formData.description}
            imageUrls={imageUrls}
            dynamicAttributes={formData.dynamicAttributes}
        />
    </PreviewShell>
);


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

        if (!id) {

            navigate('/profile');

            return;

        }

        const fetchProduct = async () => {

            setIsLoading(true);

            try {

                const [data, fetchedCategories, revisionHistory] = await Promise.all([

                    apiService.getProductById(id),

                    apiService.getCategories(),

                    apiService.getProductRevisions(id),

                ]);

                setCategories(fetchedCategories);

                if (data && data.seller.id === user.id) {

                    syncProductToForm(data);

                    setRevisions(revisionHistory);

                } else {

                    alert("Этот товар вам не принадлежит или у вас нет доступа.");

                    navigate('/profile');

                }

            } catch (error) {

                console.error('Failed to fetch product', error);

                alert('Не удалось загрузить товар.');

                navigate('/profile');

            } finally {

                setIsLoading(false);

            }

        };

        fetchProduct();

    }, [id, user.id, navigate, syncProductToForm]);
    
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

    const handleDynamicAttrChange = (field: CategoryFieldWithMeta, rawValue: any) => {
        setFormData(prev => {
            if (!prev) return prev;
            let value: string | number | undefined = rawValue;
            if (field.type === 'number') {
                value = rawValue === '' ? undefined : Number(rawValue);
                if (value !== undefined && Number.isNaN(value)) {
                    value = undefined;
                }
            }
            const nextDynamic: Record<string, string | number> = {
                ...(prev.dynamicAttributes || {}),
            };
            if (value === undefined || value === '') {
                delete nextDynamic[field.name];
            } else {
                nextDynamic[field.name] = value;
            }
            return {
                ...prev,
                dynamicAttributes: nextDynamic,
            };
        });
    };

    const handleDraftPreview = () => {
        if (formData) {
            setIsDraftPreviewOpen(true);
        }
    };

   const handleRevisionPreview = (revision: ProductRevision) => {
        setPreviewRevision(revision);
    };

    const handleRevisionApply = (revision: ProductRevision) => {
        setFormData(prev => {
            if (!prev) return prev;
            const snapshot = revision.snapshot;
            return {
                ...prev,
                title: snapshot.title,
                description: snapshot.description,
                category: snapshot.category,
                price: snapshot.price,
                salePrice: snapshot.salePrice,
                dynamicAttributes: snapshot.dynamicAttributes,
                videoUrl: snapshot.videoUrl,
                giftWrapAvailable: snapshot.giftWrapAvailable,
                giftWrapPrice: snapshot.giftWrapPrice,
                purchaseCost: snapshot.purchaseCost,
                weight: snapshot.weight,
                isB2BEnabled: snapshot.isB2BEnabled ?? prev.isB2BEnabled,
                b2bMinQuantity: snapshot.b2bMinQuantity,
                b2bPrice: snapshot.b2bPrice,
                variantAttributes: snapshot.variantAttributes || prev.variantAttributes,
                variants: snapshot.variants || prev.variants,
                productType: snapshot.productType || prev.productType,
            };
        });
        setImageUrls(revision.snapshot.imageUrls || []);
        setNewImageFiles([]);
    };

    const handleRevisionRestore = async (revision: ProductRevision) => {
        if (!id) return;
        setRestoringRevisionId(revision.id);
        try {
            const restored = await apiService.restoreProductRevision(id, revision.id);
            syncProductToForm(restored);
            await loadRevisions();
            alert('Версия успешно восстановлена.');
        } catch (error) {
            console.error(error);
            alert('Не удалось восстановить выбранную версию.');
        } finally {
            setRestoringRevisionId(null);
        }
    };

    const handleUpdate = async () => {

        if (!formData || !id) return;

        setIsUpdating(true);

        try {

            const dataToUpdate: Partial<Product> = { ...formData };



            const uploadedImageUrls = await Promise.all(

                newImageFiles.map((file) => cloudinaryService.uploadImage(file)),

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



            dataToUpdate.dynamicAttributes = normalizeDynamicAttributesForCategory(

                dataToUpdate.dynamicAttributes,

                resolvedFields,

            );



            const updatedProduct = await apiService.updateListing(id, dataToUpdate);

            syncProductToForm(updatedProduct);

            setNewImageFiles([]);

            setVideoFile(null);

            await loadRevisions();

            alert('Черновик успешно обновлён.');

        } catch (error) {

            console.error(error);

            alert('Не удалось обновить объявление.');

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
    
    return (
        <>
            <div className="max-w-4xl mx-auto bg-base-100 p-6 sm:p-8 rounded-lg shadow-xl">

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">

                <h1 className="text-3xl font-bold text-white text-center sm:text-left">Р РµРґР°РєС‚РёСЂРѕРІР°С‚СЊ РѕР±СЉСЏРІР»РµРЅРёРµ</h1>

                <button onClick={handleDraftPreview} className="btn btn-sm btn-outline w-full sm:w-auto">

                    <DynamicIcon name="eye" className="w-4 h-4 mr-2" />

                    ������������

                </button>

            </div>

            <div className="space-y-6">
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

                {selectedCategory?.name === 'Электроника' && (
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

                {resolvedFields.length > 0 && (
                <div className="border-t border-base-300/50 pt-6 space-y-4">
                     <h3 className="text-lg font-semibold text-white">Характеристики категории "{formData.category}"</h3>
                     {resolvedFields.map(field => (
                         <div key={field.name}>
                             <label htmlFor={field.name} className="block text-sm font-medium text-base-content/70">{field.label}</label>
                             <DynamicField field={field} value={formData.dynamicAttributes?.[field.name]} onChange={(value) => handleDynamicAttrChange(field, value)} />
                         </div>
                     ))}
                </div>
                )}



                {revisions.length > 0 && (

                    <div className="border-t border-base-300/50 pt-6 space-y-4">

                        <div className="flex items-center justify-between">

                            <h3 className="text-lg font-semibold text-white">Версии черновика</h3>

                            <span className="text-xs text-base-content/60">Всего: {revisions.length}</span>

                        </div>

                        <div className="space-y-3">

                            {revisions.map((revision) => (

                                <div key={revision.id} className="bg-base-200/40 border border-base-300/40 rounded-lg p-4 space-y-2">

                                    <div className="flex flex-wrap items-center justify-between gap-2 text-sm">

                                        <div>

                                            <p className="font-semibold text-white">{new Date(revision.createdAt).toLocaleString()}</p>

                                            <p className="text-base-content/60">{revisionSourceLabels[revision.source]}</p>

                                        </div>

                                        {revision.author && (

                                            <p className="text-base-content/60">Автор: {revision.author.name}</p>

                                        )}

                                    </div>

                                    <div className="flex flex-wrap gap-2">

                                        <button className="btn btn-xs btn-outline" onClick={() => handleRevisionPreview(revision)}>Предпросмотр</button>

                                        <button className="btn btn-xs btn-outline" onClick={() => handleRevisionApply(revision)}>Загрузить в форму</button>

                                        <button

                                            className="btn btn-xs btn-outline btn-secondary"

                                            onClick={() => handleRevisionRestore(revision)}

                                            disabled={restoringRevisionId === revision.id || isUpdating}

                                        >

                                            {restoringRevisionId === revision.id ? <Spinner size="sm" /> : 'Восстановить'}

                                        </button>

                                    </div>

                                </div>

                            ))}

                        </div>

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
            {isDraftPreviewOpen && formData && (
                <DraftPreviewModal formData={formData as FormData} imageUrls={imageUrls} onClose={() => setIsDraftPreviewOpen(false)} />
            )}
            {previewRevision && (
                <RevisionPreviewModal revision={previewRevision} onClose={() => setPreviewRevision(null)} />
            )}
        </>
    );
};

export default EditListingPage;


