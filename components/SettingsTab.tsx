import React, { useState, useEffect } from 'react';
import type { User, PromoCode } from '../types';
import Spinner from './Spinner';
import { apiService } from '../services/apiService';
import { getCategoryNames } from '../constants';
import { useAuth } from '../hooks/useAuth';
import { cloudinaryService } from '../services/cloudinaryService';

const SettingsTab: React.FC<{ user: User }> = ({ user }) => {
    const { updateUser } = useAuth();
    const [formData, setFormData] = useState({
        name: user.name,
        avatarUrl: user.avatarUrl,
        city: user.defaultShippingAddress?.city || '',
        postOffice: user.defaultShippingAddress?.postOffice || '',
        recipientName: user.defaultShippingAddress?.recipientName || user.name,
        phoneNumber: user.defaultShippingAddress?.phoneNumber || user.phoneNumber || '',
        paymentCard: '',
    });

    const [headerImageFile, setHeaderImageFile] = useState<File | null>(null);
    const [headerPreview, setHeaderPreview] = useState(user.headerImageUrl || '');
    const [isSaving, setIsSaving] = useState(false);
    
    const [copied, setCopied] = useState(false);
    const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
    const [isLoadingPromo, setIsLoadingPromo] = useState(true);

    const initialPromoState: Omit<PromoCode, 'id' | 'sellerId' | 'isActive' | 'uses'> = {
        code: '',
        discountType: 'PERCENTAGE',
        discountValue: 10,
        scope: 'ENTIRE_ORDER',
        minPurchaseAmount: undefined,
    };
    const [newPromoData, setNewPromoData] = useState(initialPromoState);

    const [isCreating, setIsCreating] = useState(false);
    const [error, setError] = useState('');
    
    const [aiPrompt, setAiPrompt] = useState('');
    const [isAiGenerating, setIsAiGenerating] = useState(false);

    const affiliateLink = `https://cryptocraft-marketplace.app/#/profile/${user.id}?ref=${user.affiliateId}`;

     useEffect(() => {
        apiService.getPromoCodesBySellerId(user.id)
            .then(setPromoCodes)
            .finally(() => setIsLoadingPromo(false));
    }, [user.id]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleHeaderImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setHeaderImageFile(file);
            setHeaderPreview(URL.createObjectURL(file));
        }
    };
    
    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            let finalHeaderImageUrl = user.headerImageUrl;

            if (headerImageFile) {
                finalHeaderImageUrl = await cloudinaryService.uploadImage(headerImageFile);
            }

            const updatedData: Partial<User> = {
                name: formData.name,
                avatarUrl: formData.avatarUrl,
                headerImageUrl: finalHeaderImageUrl,
                phoneNumber: formData.phoneNumber.trim() ? formData.phoneNumber.trim() : undefined,
                defaultShippingAddress: {
                    city: formData.city,
                    postOffice: formData.postOffice,
                    recipientName: formData.recipientName,
                    phoneNumber: formData.phoneNumber.trim()
                }
            };
            const updatedUser = await apiService.updateUser(user.id, updatedData);
            updateUser(updatedUser);
            setHeaderPreview(updatedUser.headerImageUrl || '');
            alert('Настройки успешно сохранены!');
            setHeaderImageFile(null);
        } catch (error) {
            const errorMessage = (error as Error).message || 'Не удалось сохранить настройки.';
            console.error("Failed to save settings:", error);
            alert(`Ошибка сохранения: ${errorMessage}`);
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleCopy = () => {
        navigator.clipboard.writeText(affiliateLink).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    const handleCreatePromo = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPromoData.code.trim() || newPromoData.discountValue <= 0) {
            setError('Введите корректный код и значение скидки.');
            return;
        }
        setIsCreating(true);
        setError('');
        try {
            const createdCode = await apiService.createPromoCode(user.id, newPromoData);
            setPromoCodes(prev => [...prev, createdCode]);
            setNewPromoData(initialPromoState);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsCreating(false);
        }
    };
    
    const handleDeletePromo = async (promoCodeId: string) => {
        const originalCodes = [...promoCodes];
        setPromoCodes(prev => prev.filter(p => p.id !== promoCodeId));
        try {
            await apiService.deletePromoCode(promoCodeId, user.id);
        } catch (err: any) {
            setError(err.message);
            setPromoCodes(originalCodes); // Revert on error
        }
    };
    
    const handleAiGenerate = async () => {
        if (!aiPrompt.trim()) return;
        setIsAiGenerating(true);
        // This is a mock response to simulate AI behavior
        await new Promise(res => setTimeout(res, 1500));
        setNewPromoData({
            code: 'AI_SALE25',
            discountType: 'PERCENTAGE',
            discountValue: 25,
            scope: 'CATEGORY',
            applicableCategory: 'Товары ручной работы',
            minPurchaseAmount: 50,
        });
        setIsAiGenerating(false);
    };
    
    const handlePromoDataChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setNewPromoData(prev => ({
            ...prev,
            [name]: (name === 'discountValue' || name === 'minPurchaseAmount') ? (value === '' ? undefined : parseFloat(value)) : value
        }));
    };


    return (
        <div className="max-w-3xl mx-auto space-y-8">
            <div className="bg-brand-surface p-6 sm:p-8 rounded-lg">
                <form onSubmit={handleSave} className="space-y-6">
                    <h3 className="text-xl font-bold text-white">Основные настройки</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-brand-text-secondary">Имя</label>
                            <input type="text" name="name" value={formData.name} onChange={handleChange} className="mt-1 block w-full bg-brand-background border border-brand-border rounded-md p-2"/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-brand-text-secondary">URL аватара</label>
                            <input type="text" name="avatarUrl" value={formData.avatarUrl} onChange={handleChange} className="mt-1 block w-full bg-brand-background border border-brand-border rounded-md p-2"/>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-brand-text-secondary">Шапка профиля</label>
                        <div className="mt-1 flex items-center gap-4">
                            <span className="h-16 w-32 rounded-md overflow-hidden bg-brand-background">
                                {headerPreview && (
                                    <img src={headerPreview} alt="Предпросмотр шапки" className="h-full w-full object-cover" />
                                )}
                            </span>
                            <label htmlFor="header-upload" className="cursor-pointer bg-brand-surface border border-brand-border rounded-md py-2 px-3 text-sm font-medium text-brand-text-primary hover:bg-brand-border">
                                <span>Загрузить</span>
                                <input id="header-upload" name="header-upload" type="file" className="sr-only" accept="image/*" onChange={handleHeaderImageChange} />
                            </label>
                        </div>
                    </div>

                    <div className="border-t border-brand-border pt-6">
                         <h3 className="text-xl font-bold text-white">Адрес доставки по умолчанию</h3>
                         <div className="space-y-4 mt-4">
                            <div>
                                <label className="block text-sm font-medium text-brand-text-secondary">Город</label>
                                <input type="text" name="city" value={formData.city} onChange={handleChange} className="mt-1 block w-full bg-brand-background border border-brand-border rounded-md p-2" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-brand-text-secondary">Отделение / Почтомат</label>
                                <input type="text" name="postOffice" value={formData.postOffice} onChange={handleChange} className="mt-1 block w-full bg-brand-background border border-brand-border rounded-md p-2" />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-brand-text-secondary">ФИО получателя</label>
                                    <input type="text" name="recipientName" value={formData.recipientName} onChange={handleChange} className="mt-1 block w-full bg-brand-background border border-brand-border rounded-md p-2" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-brand-text-secondary">Телефон</label>
                                    <input type="tel" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} className="mt-1 block w-full bg-brand-background border border-brand-border rounded-md p-2" />
                                </div>
                            </div>
                        </div>
                    </div>

                     <div className="border-t border-brand-border pt-6">
                        <h3 className="text-xl font-bold text-white">Реквизиты для прямой оплаты</h3>
                        <p className="text-sm text-brand-text-secondary mt-1 mb-4">Эти данные будут показаны покупателю, если он выберет способ "Прямая оплата на карту".</p>
                        <div>
                            <label className="block text-sm font-medium text-brand-text-secondary">Номер карты</label>
                            <input type="text" name="paymentCard" value={formData.paymentCard} onChange={handleChange} placeholder="0000 0000 0000 0000" className="mt-1 block w-full bg-brand-background border border-brand-border rounded-md p-2 font-mono"/>
                        </div>
                    </div>
                    
                    <div className="border-t border-brand-border pt-6">
                        <button type="submit" disabled={isSaving} className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-500">
                            {isSaving ? <Spinner size="sm"/> : 'Сохранить изменения'}
                        </button>
                    </div>
                </form>
            </div>
            
            <div className="bg-brand-surface p-6 sm:p-8 rounded-lg space-y-8">
                 <h2 className="text-2xl font-bold text-white">Инструменты маркетинга</h2>

                {/* Affiliate Link Section */}
                {user.affiliateId && (
                    <div>
                        <h3 className="text-xl font-bold text-white mb-2">Партнерская программа</h3>
                        <p className="text-brand-text-secondary mb-4">Делитесь этой ссылкой, чтобы получать бонусы с покупок, совершенных по ней. Ссылка может вести как на ваш профиль, так и на конкретный товар.</p>
                        <div className="flex flex-col sm:flex-row gap-2">
                            <input
                                type="text"
                                readOnly
                                value={affiliateLink}
                                className="flex-grow bg-brand-background border border-brand-border rounded-md p-2 font-mono text-sm"
                            />
                            <button onClick={handleCopy} className="px-4 py-2 bg-brand-primary hover:bg-brand-primary-hover text-white font-bold rounded-lg transition-colors w-full sm:w-auto">
                                {copied ? 'Скопировано!' : 'Копировать'}
                            </button>
                        </div>
                    </div>
                )}

                {/* Promo Codes Section */}
                <div>
                     <h3 className="text-xl font-bold text-white mb-2">Управление промокодами</h3>
                     <p className="text-brand-text-secondary mb-6">Создавайте гибкие промо-кампании, чтобы привлекать больше покупателей.</p>
                     
                    {/* AI Assistant */}
                    <div className="mb-8 bg-brand-background/50 p-4 rounded-lg border-l-4 border-brand-primary">
                        <h4 className="text-lg font-semibold text-white mb-2">✨ AI-Помощник</h4>
                        <p className="text-sm text-brand-text-secondary mb-3">Опишите вашу цель, и AI сгенерирует настройки промо-акции за вас.</p>
                        <textarea value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} rows={2} placeholder="Например: 'Хочу устроить распродажу на всю керамику со скидкой 25% до конца месяца'" className="w-full bg-brand-surface border border-brand-border rounded-md p-2 text-sm" />
                        <button type="button" onClick={handleAiGenerate} disabled={isAiGenerating} className="mt-2 w-full sm:w-auto bg-brand-primary hover:bg-brand-primary-hover text-white font-bold py-2 px-4 rounded-lg flex justify-center items-center disabled:bg-gray-500">
                            {isAiGenerating ? <Spinner size="sm"/> : 'Сгенерировать'}
                        </button>
                    </div>

                    <form onSubmit={handleCreatePromo} className="space-y-4 p-4 bg-brand-background rounded-md">
                        <h4 className="text-lg font-semibold text-white">Создать новую промоакцию</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-brand-text-secondary">Код</label>
                                <input type="text" name="code" value={newPromoData.code} onChange={handlePromoDataChange} placeholder="SALE20" className="mt-1 w-full bg-brand-surface border border-brand-border rounded-md p-2" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-brand-text-secondary">Тип скидки</label>
                                <select name="discountType" value={newPromoData.discountType} onChange={handlePromoDataChange} className="mt-1 w-full bg-brand-surface border border-brand-border rounded-md p-2">
                                    <option value="PERCENTAGE">Процент (%)</option>
                                    <option value="FIXED_AMOUNT">Фикс. сумма (USDT)</option>
                                </select>
                            </div>
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-brand-text-secondary">Значение скидки</label>
                            <input type="number" name="discountValue" value={newPromoData.discountValue} onChange={handlePromoDataChange} placeholder="20" className="mt-1 w-full bg-brand-surface border border-brand-border rounded-md p-2" />
                        </div>
                        <div>
                             <label className="block text-sm font-medium text-brand-text-secondary">Область применения</label>
                             <select name="scope" value={newPromoData.scope} onChange={handlePromoDataChange} className="mt-1 w-full bg-brand-surface border border-brand-border rounded-md p-2">
                                <option value="ENTIRE_ORDER">На весь заказ</option>
                                <option value="CATEGORY">На категорию</option>
                             </select>
                        </div>
                        {newPromoData.scope === 'CATEGORY' && (
                            <div className="animate-fade-in-down">
                                <label className="block text-sm font-medium text-brand-text-secondary">Категория</label>
                                <select name="applicableCategory" value={newPromoData.applicableCategory} onChange={handlePromoDataChange} className="mt-1 w-full bg-brand-surface border border-brand-border rounded-md p-2">
                                    <option value="">Выберите категорию</option>
                                    {getCategoryNames().map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                        )}
                        <div>
                            <label className="block text-sm font-medium text-brand-text-secondary">Минимальная сумма заказа (USDT)</label>
                            <input type="number" name="minPurchaseAmount" value={newPromoData.minPurchaseAmount || ''} onChange={handlePromoDataChange} placeholder="Не обязательно" className="mt-1 w-full bg-brand-surface border border-brand-border rounded-md p-2" />
                        </div>

                        <button type="submit" disabled={isCreating} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg flex justify-center items-center disabled:bg-gray-500">
                            {isCreating ? <Spinner size="sm" /> : 'Сохранить промоакцию'}
                        </button>
                    </form>
                    {error && <p className="text-red-500 text-sm mt-4 text-center">{error}</p>}

                    <div className="mt-8">
                         <h4 className="text-lg font-semibold text-white mb-4">Активные промокоды</h4>
                        {isLoadingPromo ? <div className="flex justify-center"><Spinner /></div> : (
                            <div className="space-y-2">
                                {promoCodes.length > 0 ? promoCodes.map(promo => (
                                    <div key={promo.id} className="bg-brand-background p-3 rounded-md flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                                        <div>
                                            <p className="font-mono text-lg text-brand-primary">{promo.code}</p>
                                            <p className="text-sm text-brand-text-secondary">
                                                Скидка: <span className="font-semibold text-white">{promo.discountValue}{promo.discountType === 'PERCENTAGE' ? '%' : ' USDT'}</span>
                                            </p>
                                            <p className="text-sm text-brand-text-secondary">
                                                Область: <span className="font-semibold text-white">{promo.scope === 'ENTIRE_ORDER' ? 'Весь заказ' : `Категория "${promo.applicableCategory}"`}</span>
                                            </p>
                                            {promo.minPurchaseAmount && <p className="text-sm text-brand-text-secondary">
                                                От <span className="font-semibold text-white">{promo.minPurchaseAmount} USDT</span>
                                            </p>}
                                        </div>
                                        <button onClick={() => handleDeletePromo(promo.id)} className="text-red-500 hover:text-red-400 p-1 rounded-full self-start sm:self-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                                        </button>
                                    </div>
                                )) : <p className="text-brand-text-secondary text-center">У вас еще нет активных промокодов.</p>}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="bg-brand-surface p-6 sm:p-8 rounded-lg">
                <h2 className="text-2xl font-bold text-white mb-2">Импорт и Экспорт</h2>
                <p className="text-brand-text-secondary mb-6">Инструменты для массового управления товарами. Скоро в CryptoCraft!</p>
                <div className="space-y-4">
                    <div>
                        <h3 className="text-lg font-semibold text-white">Массовая загрузка товаров</h3>
                        <p className="text-sm text-brand-text-secondary mb-3">Загрузите сотни товаров за один раз с помощью CSV-файла.</p>
                        <button
                            disabled
                            className="w-full sm:w-auto px-4 py-2 bg-brand-border text-brand-text-secondary font-bold rounded-lg transition-colors cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l-3.75 3.75M12 9.75l3.75 3.75M3.75 18A2.25 2.25 0 016 20.25h12A2.25 2.25 0 0119.5 18v-2.625A2.25 2.25 0 0017.25 13.5H6.75A2.25 2.25 0 004.5 15.375V18z" />
                            </svg>
                            <span>Загрузить CSV (скоро)</span>
                        </button>
                    </div>
                    <div className="border-t border-brand-border/50 pt-4">
                        <h3 className="text-lg font-semibold text-white">Импорт с других платформ</h3>
                        <p className="text-sm text-brand-text-secondary mb-3">Перенесите свой магазин с Etsy или другого маркетплейса в несколько кликов.</p>
                        <button
                            disabled
                            className="w-full sm:w-auto px-4 py-2 bg-brand-border text-brand-text-secondary font-bold rounded-lg transition-colors cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                            </svg>
                            <span>Начать импорт (скоро)</span>
                        </button>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default SettingsTab;