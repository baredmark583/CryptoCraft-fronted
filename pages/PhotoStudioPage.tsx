import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { apiService } from '../services/apiService';
import { geminiService } from '../services/geminiService';
import { cloudinaryService } from '../services/cloudinaryService';
import { useAuth } from '../hooks/useAuth';
import type { Product } from '../types';
import Spinner from '../components/Spinner';
import { useTelegramBackButton } from '../hooks/useTelegram';

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

    useTelegramBackButton(true);

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
    // FIX: Completed the useMemo hook dependency array.
    [freeEditLimit, editsCount.count]);

    const canAffordEdit = useMemo(() => {
        return freeEditsRemaining > 0 || user.balance >= EDIT_COST;
    }, [freeEditsRemaining, user.balance]);

    const handleEditImage = async () => {
        if (!currentImage || !prompt.trim() || !canAffordEdit) return;

        setIsEditing(true);
        setError('');
        try {
            // Simulate payment for non-free edits
            if (freeEditsRemaining <= 0) {
                const newBalance = user.balance - EDIT_COST;
                if (newBalance < 0) {
                    throw new Error("Недостаточно средств на балансе.");
                }
                await apiService.updateUserBalance(user.id, newBalance);
                updateUser({ balance: newBalance });
            }

            // The image should be base64 without the data URI prefix
            const base64Data = currentImage.split(',')[1];
            // Infer mime type
            const mimeType = currentImage.match(/data:(.*);base64,/)?.[1] || 'image/jpeg';
            
            const editedImageBase64 = await geminiService.editImage(base64Data, mimeType, prompt);
            
            setCurrentImage(`data:image/png;base64,${editedImageBase64}`); // Gemini might return a different format, assume png for simplicity

            // Update usage count
            const today = new Date().setHours(0, 0, 0, 0);
            const newCount = editsCount.resetDate < today ? 1 : editsCount.count + 1;
            const newUsage = { count: newCount, resetDate: today };
            setEditsCount(newUsage);
            localStorage.setItem(getUsageKey(), JSON.stringify(newUsage));

        } catch (err: any) {
            setError(err.message || 'Произошла ошибка при редактировании.');
        } finally {
            setIsEditing(false);
        }
    };

    const handleSave = async () => {
        if (!currentImage || !product || currentImage === originalImage) return;
        setIsSaving(true);
        setError('');
        try {
            const response = await fetch(currentImage);
            const blob = await response.blob();
            const file = new File([blob], "edited-image.png", { type: "image/png" });

            const newImageUrl = await cloudinaryService.uploadImage(file);
            
            // For simplicity, we'll replace the first image. A real app might allow adding new images.
            const updatedImageUrls = [newImageUrl, ...product.imageUrls.slice(1)];
            
            await apiService.updateListing(product.id, { imageUrls: updatedImageUrls });

            alert('Изображение успешно сохранено!');
            navigate(`/product/${product.id}`);
        } catch (err: any) {
            setError(err.message || 'Не удалось сохранить изображение.');
            setIsSaving(false);
        }
    };
    
    useEffect(() => {
        if (!productId) return;
        const fetchProduct = async () => {
            setIsLoading(true);
            const data = await apiService.getProductById(productId);
            if (data && data.seller.id === user.id) {
                setProduct(data);
                // We need to fetch the image and convert it to a data URL for editing
                try {
                    const response = await fetch(data.imageUrls[0]);
                    const blob = await response.blob();
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        const base64data = reader.result as string;
                        setOriginalImage(base64data);
                        setCurrentImage(base64data);
                    };
                    reader.readAsDataURL(blob);
                } catch (e) {
                    setError("Не удалось загрузить изображение для редактирования.");
                }
            } else {
                setError("Товар не найден или у вас нет прав на его редактирование.");
            }
            setIsLoading(false);
        };
        fetchProduct();
    }, [productId, user.id]);

    if (isLoading) {
        return <div className="flex justify-center items-center h-96"><Spinner size="lg" /></div>;
    }

    if (error && !product) {
        return <div className="text-center text-red-500 mt-16">{error}</div>;
    }

    if (!product) {
        return null;
    }

    return (
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
                <h1 className="text-3xl font-bold text-white">AI Фотостудия</h1>
                <div className="relative aspect-square bg-brand-background rounded-lg flex items-center justify-center p-2">
                    {isEditing && (
                        <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center z-10 rounded-lg">
                            <Spinner size="lg" />
                            <p className="text-white mt-4">Применяем магию...</p>
                        </div>
                    )}
                    {currentImage && (
                        <img src={currentImage} alt="Редактируемое изображение" className="max-w-full max-h-full object-contain rounded-md" />
                    )}
                </div>
                 <div className="flex gap-4">
                    <button onClick={() => setCurrentImage(originalImage)} disabled={isEditing} className="flex-1 bg-brand-surface hover:bg-brand-border text-white font-semibold py-2 px-4 rounded-lg disabled:opacity-50">
                        Сбросить
                    </button>
                    <button onClick={handleSave} disabled={isSaving || currentImage === originalImage} className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center disabled:bg-gray-500">
                        {isSaving ? <Spinner size="sm" /> : 'Сохранить'}
                    </button>
                </div>
            </div>

            <div className="lg:col-span-1 bg-brand-surface p-6 rounded-lg space-y-6">
                <div>
                    <h2 className="text-xl font-bold text-white mb-2">Инструменты</h2>
                    <p className="text-sm text-brand-text-secondary">Опишите, что вы хотите изменить, или выберите готовый вариант.</p>
                </div>

                <div>
                    <label htmlFor="prompt-input" className="block text-sm font-medium text-brand-text-secondary mb-2">Ваш запрос:</label>
                    <textarea 
                        id="prompt-input"
                        rows={3}
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Например, 'добавь тень под предмет'"
                        className="w-full bg-brand-background border border-brand-border rounded-md p-2"
                    />
                </div>
                
                <div className="space-y-2">
                    {AI_PROMPT_SUGGESTIONS.map(sugg => (
                        <button key={sugg.name} onClick={() => setPrompt(sugg.prompt)} className="w-full text-left bg-brand-background/50 hover:bg-brand-border/50 p-2 rounded-md text-sm text-brand-text-primary">
                            {sugg.name}
                        </button>
                    ))}
                </div>

                <div className="border-t border-brand-border pt-4 space-y-3">
                     <div className="text-center">
                        <p className="text-sm text-brand-text-secondary">
                            Бесплатных правок сегодня: <span className={`font-bold ${freeEditsRemaining > 0 ? 'text-green-400' : 'text-red-400'}`}>{freeEditsRemaining}</span> / {freeEditLimit}
                        </p>
                        {freeEditsRemaining === 0 && (
                             <p className="text-xs text-brand-text-secondary">Стоимость следующей правки: {EDIT_COST.toFixed(2)} USDT</p>
                        )}
                     </div>
                     <button
                        onClick={handleEditImage}
                        disabled={isEditing || !prompt.trim() || !canAffordEdit}
                        className="w-full bg-brand-primary hover:bg-brand-primary-hover text-white font-bold py-3 px-4 rounded-lg disabled:bg-gray-500 disabled:cursor-not-allowed"
                    >
                        Применить
                    </button>
                     {!canAffordEdit && (
                        <p className="text-xs text-red-500 text-center">Недостаточно средств или исчерпан лимит правок.</p>
                    )}
                    {error && <p className="text-sm text-red-500 text-center">{error}</p>}
                </div>
            </div>
        </div>
    );
};

export default PhotoStudioPage;
