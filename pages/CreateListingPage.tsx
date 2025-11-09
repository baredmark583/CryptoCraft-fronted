import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import type { Product, GeneratedListing } from '../types';
import type { CategorySchema, CategoryFieldWithMeta } from '../constants';

import { apiService } from '../services/apiService';
import { geminiService } from '../services/geminiService';
import { cloudinaryService } from '../services/cloudinaryService';
import { fileToBase64 } from '../lib/utils';
import Spinner from '../components/Spinner';
import { useTelegramBackButton } from '../hooks/useTelegram';
import DynamicIcon from '../components/DynamicIcon';
import {
  findCategoryByName,
  normalizeDynamicAttributesForCategory,
  resolveFieldsForCategory,
} from '../lib/categoryUtils';

type FormData = Omit<Product, 'id' | 'seller' | 'imageUrls'> & {
  saleType: 'FIXED_PRICE' | 'AUCTION';
  auctionDurationDays?: 1 | 3 | 7;
};

interface BatchItem {
  id: string;
  formData: Partial<FormData>;
  imageFile: File;
  previewUrl: string;
  status: 'review' | 'publishing' | 'published' | 'error';
  publishError?: string;
}

const flattenCategoriesForSelect = (
  categories: CategorySchema[],
  level = 0,
): { label: string; value: string }[] => {
  let options: { label: string; value: string }[] = [];
  const indent = '\u00a0\u00a0'.repeat(level);

  categories.forEach((category) => {
    options.push({ label: `${indent}${category.name}`, value: category.name });
    if (category.subcategories?.length) {
      options = options.concat(flattenCategoriesForSelect(category.subcategories, level + 1));
    }
  });

  return options;
};


const AIGenerateForm: React.FC<{
  onGenerated: (data: GeneratedListing, file: File) => void;
  disabled: boolean;
}> = ({ onGenerated, disabled }) => {
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

  const resetForm = () => {
    setDescription('');
    setImageFile(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageFile || !description) {
      setError('Загрузите фото и добавьте описание.');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const base64Image = await fileToBase64(imageFile);
      const aiResult = await geminiService.generateListingDetails(base64Image, description);
      onGenerated(aiResult.data, imageFile);
      resetForm();
    } catch (err: any) {
      setError(err.message || 'Ошибка генерации.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-base-content/70 mb-2">1. Загрузите фото</label>
        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-base-300 border-dashed rounded-md">
          <div className="space-y-1 text-center">
            {preview ? (
              <img src={preview} alt="Preview" className="mx-auto h-48 w-auto rounded-md" />
            ) : (
              <DynamicIcon
                name="upload-image"
                className="mx-auto h-12 w-12 text-base-content/70"
                fallback={
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
                    />
                  </svg>
                }
              />
            )}
            <div className="flex text-sm text-base-content/70">
              <label className="relative cursor-pointer bg-base-100 rounded-md font-medium text-primary px-1">
                <span>Выберите файл</span>
                <input type="file" className="sr-only" accept="image/*" onChange={handleImageChange} />
              </label>
              <p className="pl-1">или перетащите сюда</p>
            </div>
            <p className="text-xs text-base-content/70">PNG/JPG до 10MB</p>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-base-content/70">2. Кратко опишите товар</label>
        <textarea
          rows={3}
          className="mt-1 block w-full bg-base-200 border border-base-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
          placeholder="Например: 'керамическая ваза, ручная работа'"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={disabled}
        />
      </div>
      {error && <p className="text-red-500 text-sm">{error}</p>}

      <button
        type="submit"
        disabled={isLoading || disabled}
        className="w-full flex justify-center py-3 px-4 rounded-md text-lg font-medium text-white bg-primary hover:bg-primary-focus disabled:bg-gray-500"
      >
        {isLoading ? <Spinner size="sm" /> : 'Добавить товар в пакет'}
      </button>
    </form>
  );
};

const DynamicField: React.FC<{
  field: CategoryFieldWithMeta;
  inputId: string;
  value: any;
  onChange: (value: any) => void;
}> = ({ field, inputId, value, onChange }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    onChange(e.target.value);
  };

  const commonProps = {
    name: field.name,
    id: inputId,
    value: value ?? '',
    onChange: handleChange,
    className: 'mt-1 block w-full bg-base-200 border border-base-300 rounded-md shadow-sm py-2 px-3',
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
          {field.options?.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      );
    default:
      return null;
  }
};

const ListingReviewCard: React.FC<{
  item: BatchItem;
  onUpdate: (id: string, data: Partial<FormData>) => void;
  onRemove: (id: string) => void;
  isPublishing: boolean;
  categories: CategorySchema[];
}> = ({ item, onUpdate, onRemove, isPublishing, categories }) => {
  const { formData } = item;

  const categorySchema = useMemo(
    () => findCategoryByName(categories, formData.category),
    [categories, formData.category],
  );
  const resolvedFields = useMemo(
    () => resolveFieldsForCategory(categories, categorySchema),
    [categories, categorySchema],
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    let newValue: any = value;
    const numericFields = [
      'price',
      'salePrice',
      'startingBid',
      'purchaseCost',
      'weight',
      'giftWrapPrice',
      'b2bMinQuantity',
      'b2bPrice',
    ];
    if (type === 'number' || numericFields.includes(name)) {
      newValue = value === '' ? undefined : parseFloat(value);
    }
    const updated = {
      ...formData,
      [name]: newValue,
    };
    onUpdate(item.id, updated);
  };

  const handleDynamicAttrChange = (field: CategoryFieldWithMeta, rawValue: any) => {
    let value: string | number | undefined = rawValue;
    if (field.type === 'number') {
      value = rawValue === '' ? undefined : Number(rawValue);
      if (value !== undefined && Number.isNaN(value)) value = undefined;
    }
    onUpdate(item.id, {
      ...formData,
      dynamicAttributes: {
        ...formData.dynamicAttributes,
        [field.name]: value,
      },
    });
  };

  const statusOverlay = useMemo(() => {
    if (item.status === 'review' && !isPublishing) return null;
    let content: React.ReactNode = null;
    if (item.status === 'publishing') {
      content = (
        <>
          <Spinner size="sm" />
          <span className="ml-2">Публикация...</span>
        </>
      );
    } else if (item.status === 'published') {
      content = (
        <>
          ✓<span className="ml-2">Опубликовано</span>
        </>
      );
    } else if (item.status === 'error') {
      content = (
        <>
          ✗<span className="ml-2">{item.publishError || 'Ошибка'}</span>
        </>
      );
    }
    if (!content) return null;
    return (
      <div className="absolute inset-0 bg-base-200/80 backdrop-blur-sm flex items-center justify-center text-white font-bold rounded-lg z-10">
        {content}
      </div>
    );
  }, [item.status, item.publishError, isPublishing]);

  const categoryOptions = useMemo(() => flattenCategoriesForSelect(categories), [categories]);

  return (
    <details className="border border-base-300 rounded-lg overflow-hidden group">
      <summary className="p-4 flex items-center justify-between cursor-pointer bg-base-100 group-hover:bg-base-300/50">
        <div className="flex items-center gap-4">
          <img src={item.previewUrl} alt="Preview" className="w-12 h-12 rounded-md object-cover" />
          <span className="font-semibold text-white">{formData.title || 'Новый товар'}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              onRemove(item.id);
            }}
            disabled={isPublishing}
            className="text-red-500 hover:text-red-400 p-1 disabled:opacity-50"
          >
            <DynamicIcon
              name="delete-item"
              className="w-5 h-5"
              fallback={
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 4.8108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                  />
                </svg>
              }
            />
          </button>
          <span className="transform transition-transform group-open:rotate-180 text-base-content/70">▼</span>
        </div>
      </summary>

      <div className="p-4 space-y-4 relative">
        {statusOverlay}

        <div>
          <label className="block text-sm font-medium text-base-content/70">Заголовок</label>
          <input
            type="text"
            name="title"
            value={formData.title || ''}
            onChange={handleChange}
            className="mt-1 block w-full bg-base-200 border border-base-300 rounded-md shadow-sm py-2 px-3"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-base-content/70">Описание</label>
          <textarea
            name="description"
            value={formData.description || ''}
            onChange={handleChange}
            rows={6}
            className="mt-1 block w-full bg-base-200 border border-base-300 rounded-md shadow-sm py-2 px-3"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-base-content/70">Цена (USDT)</label>
            <input
              type="number"
              name="price"
              value={formData.price ?? ''}
              onChange={handleChange}
              className="mt-1 block w-full bg-base-200 border border-base-300 rounded-md shadow-sm py-2 px-3"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-base-content/70">Цена со скидкой</label>
            <input
              type="number"
              name="salePrice"
              value={formData.salePrice ?? ''}
              onChange={handleChange}
              className="mt-1 block w-full bg-base-200 border border-base-300 rounded-md shadow-sm py-2 px-3"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-base-content/70">Категория</label>
            <select
              name="category"
              value={formData.category || ''}
              onChange={handleChange}
              className="mt-1 block w-full bg-base-200 border border-base-300 rounded-md shadow-sm py-2 px-3"
            >
              <option value="">- Выберите категорию -</option>
              {categoryOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {resolvedFields.length > 0 && (
          <div className="border-t border-base-300/50 pt-6 space-y-4">
            <h3 className="text-lg font-semibold text-white">Характеристики категории</h3>
            {resolvedFields.map((field) => (
              <div key={field.name}>
                <label htmlFor={`${item.id}-${field.name}`} className="block text-sm font-medium text-base-content/70">
                  {field.label}
                  {field.inherited && <span className="ml-2 text-xs text-base-content/60">(наследуется)</span>}
                </label>
                <DynamicField
                  field={field}
                  inputId={`${item.id}-${field.name}`}
                  value={
                    formData.dynamicAttributes?.[field.name] ?? formData.dynamicAttributes?.[field.label || field.name]
                  }
                  onChange={(value) => handleDynamicAttrChange(field, value)}
                />
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
  const navigate = useNavigate();
  const [batchItems, setBatchItems] = useState<BatchItem[]>([]);
  const [isPublishing, setIsPublishing] = useState(false);
  const [categories, setCategories] = useState<CategorySchema[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);

  useTelegramBackButton(true);

  useEffect(() => {
    apiService
      .getCategories()
      .then(setCategories)
      .finally(() => setIsLoadingCategories(false));
  }, []);

  const handleAddItemToBatch = (generatedData: GeneratedListing, imageFile: File) => {
    const previewUrl = URL.createObjectURL(imageFile);
    const categoryDefinition = findCategoryByName(categories, generatedData.category);
    const resolvedFields = resolveFieldsForCategory(categories, categoryDefinition);
    const normalizedDynamicAttributes = normalizeDynamicAttributesForCategory(
      generatedData.dynamicAttributes,
      resolvedFields,
    );

    const newItem: BatchItem = {
      id: `${Date.now()}-${Math.random()}`,
      formData: {
        ...generatedData,
        dynamicAttributes: normalizedDynamicAttributes,
        productType: 'PHYSICAL',
        saleType: 'FIXED_PRICE',
      },
      imageFile,
      previewUrl,
      status: 'review',
    };
    setBatchItems((prev) => [newItem, ...prev]);
  };

  const handleUpdateBatchItem = useCallback((id: string, updatedData: Partial<FormData>) => {
    setBatchItems((prev) => prev.map((item) => (item.id === id ? { ...item, formData: { ...item.formData, ...updatedData } } : item)));
  }, []);

  const handleRemoveBatchItem = useCallback((id: string) => {
    setBatchItems((prev) => {
      const toRemove = prev.find((item) => item.id === id);
      if (toRemove) URL.revokeObjectURL(toRemove.previewUrl);
      return prev.filter((item) => item.id !== id);
    });
  }, []);

  const handlePublishBatch = async () => {
    setIsPublishing(true);
    const itemsToPublish = batchItems.filter((item) => item.status === 'review');

    for (const item of itemsToPublish) {
      setBatchItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, status: 'publishing' } : i)));
      try {
        const imageUrl = await cloudinaryService.uploadImage(item.imageFile);
        const categoryDefinition = findCategoryByName(categories, item.formData.category);
        const resolvedFields = resolveFieldsForCategory(categories, categoryDefinition);
        const normalizedDynamicAttributes = normalizeDynamicAttributesForCategory(
          item.formData.dynamicAttributes,
          resolvedFields,
        );

        const finalData = {
          ...item.formData,
          dynamicAttributes: normalizedDynamicAttributes,
        };

        await apiService.createListing(finalData, [imageUrl], undefined, user);

        setBatchItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, status: 'published' } : i)));
      } catch (error: any) {
        const message = error?.message || 'Не удалось опубликовать товар.';
        setBatchItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, status: 'error', publishError: message } : i)));
      }
    }

    setTimeout(() => {
      setBatchItems((prev) => prev.filter((item) => item.status !== 'published'));
      setIsPublishing(false);
    }, 2500);
    alert('Публикация завершена');
    navigate('/dashboard');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="card bg-base-100 shadow-xl border border-base-300">
        <div className="card-body p-6 sm:p-8">
          <h1 className="text-3xl font-bold text-center mb-2 text-white">Групповое создание объявлений</h1>
          <p className="text-center text-base-content/70 mb-8">
            Подготовьте несколько товаров и опубликуйте их разом с помощью AI.
          </p>
          <AIGenerateForm onGenerated={handleAddItemToBatch} disabled={isPublishing} />
        </div>
      </div>

      {batchItems.length > 0 && (
        <div className="card bg-base-100 shadow-xl border border-base-300">
          <div className="card-body p-6 sm:p-8">
            <h2 className="text-2xl font-bold text-white mb-4">
              Пакет для публикации ({batchItems.length})
            </h2>
            {isLoadingCategories ? (
              <Spinner />
            ) : (
              <div className="space-y-4 mb-6">
                {batchItems.map((item) => (
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
              disabled={isPublishing || batchItems.every((item) => item.status !== 'review')}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-500"
            >
              {isPublishing ? <Spinner size="sm" /> : 'Опубликовать все'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateListingPage;
