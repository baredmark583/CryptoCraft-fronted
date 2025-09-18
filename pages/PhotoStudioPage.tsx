import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { apiService } from '../services/apiService';
import { geminiService } from '../services/geminiService';
import { cloudinaryService } from '../services/cloudinaryService';
import { useAuth } from '../hooks/useAuth';
import type { Product } from '../types';
import Spinner from '../components/Spinner';

const AI_PROMPT_SUGGESTIONS = [
    { name: 'Удалить фон', prompt: 'remove the background, replacing it with a clean, neutral light grey studio background for an e-commerce product photo.' },
    { name: 'Улучшить свет', prompt: 'enhance the lighting and color to make the product look more appealing and vibrant. Improve sharpness and clarity.' },
    { name: 'Деревянный стол', prompt: 'place the product on a rustic wooden table surface. Add a subtle, realistic shadow.' },
    { name: 'На природе', prompt: 'place the product in a natural outdoor setting, like on a mossy rock in a forest.' },
];

const FREE_EDITS_STANDARD = 5;
const FREE_EDITS_PRO = 15;
const EDIT_COST = 0.36;

interface UsageData {
    count: number;
    resetDate: number;
}

const PhotoStudioPage: React.FC = () => {
    const { productId } = useParams<{ productId: string }>();
    const { user, updateUser } = useAuth();
    const navigate = useNavigate();

    const [product, setProduct] = useState<Product | null>(null);
    const [originalImage, setOriginalImage] = useState<string | null>(null);
    const [currentImage, setCurrentImage] = useState<string | null>(null);
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    
    // Usage tracking state
    const [editsCount, setEditsCount] = useState<UsageData>({ count: 0, resetDate: new Date().setHours(0,0,0,0) });

    const getUsageKey = () => `photoStudioUsage_${user.id}`;
    
    useEffect(() => {
        try {
            const storedUsage = localStorage.getItem(getUsageKey());
            const today = new Date().setHours(0, 0, 0, 0);
            if (storedUsage) {
                const data: UsageData = JSON.parse(storedUsage);
                if (data.resetDate < today) {
                    // It's a new day, reset the count
                    const newUsage = { count: 0, resetDate: today };
                    localStorage.setItem(getUsageKey(), JSON.stringify(newUsage));
                    setEditsCount(newUsage);
                } else {
                    setEditsCount(data);
                }
            } else {
                // No usage data found, initialize for today
                const newUsage = { count: 0, resetDate: today };
                localStorage.setItem(getUsageKey(), JSON.stringify(newUsage));
                setEditsCount(newUsage);
            }
        } catch (e) {
            console.error("Failed to read/write usage data from localStorage", e);
        }
    }, [user.id]);

    const freeEditLimit = useMemo(() => 
        user.verificationLevel === 'PRO' ? FREE_EDITS_PRO : FREE_EDITS_STANDARD,
    [user.verificationLevel]);

    const freeEditsRemaining = useMemo(() => 
        Math.max(0, freeEditLimit - editsCount.count),
    [freeEditLimit, editsCount.count]);

    const isPaidEdit = freeEditsRemaining === 0;

    useEffect(() => {
        const fetchProduct = async () => {
            if (!productId) return;
            setIsLoading(true);
            try {
                const data = await apiService.getProductById(productId);
                if (data && data.seller.id === user.id) {
                    setProduct(data);
                    setOriginalImage(data.imageUrls[0]);
                    setCurrentImage(data.imageUrls[0]);
                } else {
                    alert("Товар не найден или у вас нет прав на его редактирование.");
                    navigate('/profile');
                }
            } catch (err) {
                setError('Не удалось загрузить товар.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchProduct();
    }, [productId, user.id, navigate]);
    
    const urlToBase64 = async (url: string): Promise<{ base64: string, mimeType: string }> => {
        const response = await fetch(url);
        const blob = await response.blob();
        const mimeType = blob.type;
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                resolve({ base64: result.split(',')[1], mimeType });
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    };

    const handleEdit = useCallback(async (editPrompt: string) => {
        if (!currentImage) return;

        if (isPaidEdit && user.balance < EDIT_COST) {
            setError(`Недостаточно средств. Необходимо ${EDIT_COST} USDT.`);
            return;
        }

        setIsEditing(true);
        setError('');
        try {
            if (isPaidEdit) {
                // Deduct balance
                const newBalance = user.balance - EDIT_COST;
                await apiService.updateUserBalance(user.id, newBalance);
                updateUser({ balance: newBalance });
            }
            
            const { base64, mimeType } = await urlToBase64(currentImage);
            const editedBase64 = await geminiService.editImage(base64, mimeType, editPrompt);
            setCurrentImage(`data:${mimeType};base64,${editedBase64}`);
            
            // Increment usage count
            const newCount = editsCount.count + 1;
            const newUsage = { ...editsCount, count: newCount };
            setEditsCount(newUsage);
            localStorage.setItem(getUsageKey(), JSON.stringify(newUsage));

        } catch (err: any) {
            setError(err.message || "Ошибка редактирования");
        } finally {
            setIsEditing(false);
        }
    }, [currentImage, isPaidEdit, user, updateUser, editsCount]);

    const handleSave = async () => {
        if (!currentImage || !product || currentImage === originalImage) return;
        setIsSaving(true);
        setError('');
        try {
            // This logic assumes currentImage is a data URL
            const response = await fetch(currentImage);
            const blob = await response.blob();
            const file = new File([blob], `${product.id}-edited.jpg`, { type: blob.type });

            const newImageUrl = await cloudinaryService.uploadImage(file);
            
            const updatedImageUrls = [newImageUrl, ...product.imageUrls.slice(1)];
            const updatedProduct = await apiService.updateListing(product.id, { imageUrls: updatedImageUrls });

            setProduct(updatedProduct);
            setOriginalImage(newImageUrl);
            setCurrentImage(newImageUrl);

            alert("Изображение успешно сохранено!");
        } catch (err: any) {
            setError(err.message || 'Не удалось сохранить изображение.');
        } finally {
            setIsSaving(false);
        }
    };
    
    const canSave = currentImage !== originalImage;

    if (isLoading) return <div className="flex justify-center py-16"><Spinner size="lg"/></div>;
    if (!product) return <div className="text-center text-xl text-brand-text-secondary">Товар не найден.</div>;

    return (
        <div>
            <div className="mb-6">
                <Link to={`/edit/${productId}`} className="text-sm text-brand-secondary hover:text-brand-primary mb-4 block">&larr; Вернуться к редактированию</Link>
                <h1 className="text-3xl font-bold text-white">AI Фотостудия</h1>
                <p className="text-brand-text-secondary">Улучшите главное изображение для товара "{product.title}"</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-brand-surface rounded-lg p-4 flex flex-col items-center justify-center">
                    <div className="relative w-full aspect-square max-w-xl">
                        {currentImage ? (
                            <img src={currentImage} alt="Редактируемый товар" className="w-full h-full object-contain rounded-md" />
                        ) : <div className="w-full h-full bg-brand-background rounded-md"></div>}
                        
                        {(isEditing || isSaving) && (
                            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center rounded-md">
                                <Spinner />
                                <p className="mt-4 text-white font-semibold">{isSaving ? 'Сохранение...' : 'Магия AI в действии...'}</p>
                            </div>
                        )}
                    </div>
                     <div className="flex items-center gap-4 mt-4">
                        {originalImage && <img src={originalImage} alt="Оригинал" className="w-24 h-24 object-cover rounded-md border-2 border-brand-border" title="Оригинал"/>}
                         <button onClick={() => setCurrentImage(originalImage)} disabled={currentImage === originalImage} className="text-sm bg-brand-border hover:bg-brand-border/70 text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed">
                             Сбросить
                         </button>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-brand-surface rounded-lg p-4 text-center">
                        <p className={`font-bold text-lg ${user.verificationLevel === 'PRO' ? 'text-amber-400' : 'text-sky-400'}`}>
                           {user.verificationLevel === 'PRO' ? '✨ Pro План' : '⭐ Стандартный План'}
                        </p>
                        <p className="text-brand-text-primary">
                           Осталось бесплатных редактирований сегодня:
                        </p>
                        <p className="text-4xl font-bold text-white my-2">{freeEditsRemaining} / {freeEditLimit}</p>
                        {isPaidEdit && <p className="text-sm text-brand-text-secondary">Следующее редактирование: {EDIT_COST} USDT</p>}
                    </div>

                    <div className="bg-brand-surface rounded-lg p-4">
                        <h3 className="font-bold text-white mb-3">Быстрые действия</h3>
                        <div className="grid grid-cols-2 gap-2">
                            {AI_PROMPT_SUGGESTIONS.map(s => (
                                <button key={s.name} onClick={() => handleEdit(s.prompt)} disabled={isEditing} className="text-sm bg-brand-secondary hover:bg-brand-primary-hover text-white font-semibold p-3 rounded-lg text-center disabled:opacity-50">
                                    {s.name}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="bg-brand-surface rounded-lg p-4">
                        <h3 className="font-bold text-white mb-3">Ваша команда</h3>
                        <textarea
                            value={prompt}
                            onChange={e => setPrompt(e.target.value)}
                            rows={4}
                            placeholder="Например: 'поставь вазу на пляже во время заката'"
                            className="w-full bg-brand-background border border-brand-border rounded-md p-2 text-sm"
                        />
                         <button onClick={() => handleEdit(prompt)} disabled={isEditing || !prompt.trim()} className="w-full mt-2 bg-brand-primary hover:bg-brand-primary-hover text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50">
                            {isPaidEdit ? `Применить (${EDIT_COST} USDT)` : 'Применить'}
                        </button>
                    </div>

                    <div className="mt-4">
                        {error && <p className="text-red-500 text-sm mb-2 text-center">{error}</p>}
                        <button onClick={handleSave} disabled={isSaving || !canSave} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg flex justify-center items-center disabled:bg-gray-500 disabled:cursor-not-allowed">
                            {isSaving ? <Spinner size="sm" /> : 'Сохранить как главное фото'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PhotoStudioPage;