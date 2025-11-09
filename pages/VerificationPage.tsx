

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Spinner from '../components/Spinner';
import CameraCaptureModal from '../components/CameraCaptureModal';
import { fileToBase64 } from '../lib/utils';
import { geminiService } from '../services/geminiService';
import { useAuth } from '../hooks/useAuth';
import VerifiedBadge from '../components/VerifiedBadge';
import DynamicIcon from '../components/DynamicIcon';

const VerificationPage: React.FC = () => {
    const navigate = useNavigate();
    const { user, updateUser } = useAuth();

    const [status, setStatus] = useState<'idle' | 'processing' | 'verified'>('idle');
    const [processingStep, setProcessingStep] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [businessNumber, setBusinessNumber] = useState('');


    const handleFileChange = (file: File | null) => {
        if (file) {
            setImageFile(file);
            setPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!imageFile || !businessNumber.trim()) {
            alert("Пожалуйста, загрузите документ и укажите регистрационный номер.");
            return;
        }

        setStatus('processing');
        try {
            setProcessingStep('Загрузка документа...');
            await new Promise(res => setTimeout(res, 500));
            
            const base64Image = await fileToBase64(imageFile);

            setProcessingStep('Анализ документа с помощью AI...');
            const analysisResult = await geminiService.analyzeDocumentForVerification(base64Image);
            console.debug('AI verification meta:', analysisResult.meta);
            
            if (!analysisResult.data.isDocument) {
                alert("Пожалуйста, загрузите фото документа, удостоверяющего личность.");
                setStatus('idle');
                return;
            }

            setProcessingStep('Проверка регистрационного номера...');
            await new Promise(res => setTimeout(res, 1500));
            
            setProcessingStep('Присвоение статуса Pro...');
            await new Promise(res => setTimeout(res, 1000));

            setStatus('verified');
            updateUser({ 
                verificationLevel: 'PRO', 
                businessInfo: { registrationNumber: businessNumber } 
            });
            setTimeout(() => navigate('/profile'), 3000); // Longer delay to read success message
        } catch (error) {
            console.error("Verification failed:", error);
            alert("Произошла ошибка во время верификации. Попробуйте еще раз.");
            setStatus('idle');
        }
    };
    
    const handleCameraCapture = (file: File) => {
        handleFileChange(file);
        setIsCameraOpen(false);
    };

    const benefits = [
        { icon: '🏆', text: 'Премиальный значок Pro-продавца' },
        { icon: '🚀', text: 'Приоритет в поисковой выдаче' },
        { icon: '📢', text: 'Доступ к Live-трансляциям' },
        { icon: '🗳️', text: 'Право голоса в управлении DAO' },
    ];
    
    const renderContent = () => {
        if (user.verificationLevel === 'PRO') {
            return (
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-amber-400 mb-2">Вы — Pro-продавец!</h1>
                    <div className="my-4 inline-block"><VerifiedBadge level="PRO"/></div>
                    <p className="text-brand-text-secondary">Ваш профиль имеет самый высокий уровень доверия на нашей платформе.</p>
                </div>
            );
        }

        switch(status) {
            case 'verified':
                return (
                     <div className="animate-fade-in-down text-center">
                         <h1 className="text-3xl font-bold text-amber-400 mb-4">Вы стали Pro-продавцом!</h1>
                         <p className="text-brand-text-secondary mb-6">Поздравляем! Ваш профиль получил самый высокий статус доверия.</p>
                         <div className="text-6xl mb-6">🏆</div>
                         <p className="text-sm text-brand-text-secondary">Вы будете перенаправлены в свой профиль...</p>
                    </div>
                );
            case 'processing':
                return (
                    <div className="text-center">
                        <h1 className="text-3xl font-bold text-white mb-4">Идет проверка...</h1>
                        <p className="text-brand-text-secondary mb-8">{processingStep}</p>
                        <div className="flex justify-center">
                            <Spinner size="lg" />
                        </div>
                    </div>
                );
            case 'idle':
            default:
                return (
                     <>
                        <h1 className="text-3xl font-bold text-white mb-4 text-center">Станьте Pro-продавцом</h1>
                        <p className="text-brand-text-secondary mb-8 text-center">Получите максимальный значок доверия и доступ к эксклюзивным возможностям.</p>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left mb-8">
                            {benefits.map((benefit, index) => (
                                <div key={index} className="bg-brand-background p-4 rounded-lg flex items-center gap-4">
                                    <span className="text-3xl">{benefit.icon}</span>
                                    <p className="text-brand-text-primary">{benefit.text}</p>
                                </div>
                            ))}
                        </div>

                        <form onSubmit={handleSubmit} className="bg-brand-background/50 p-6 rounded-lg text-left space-y-6">
                            <div>
                                <label className="block text-lg font-medium text-white mb-2">1. Загрузите документ</label>
                                <p className="text-brand-text-secondary mb-4 text-sm">Вам потребуется загрузить фото документа, удостоверяющего личность (например, паспорт или водительские права).</p>
                                
                                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-brand-border border-dashed rounded-md">
                                    <div className="space-y-1 text-center">
                                        {preview ? (
                                            <img src={preview} alt="Предпросмотр документа" className="mx-auto h-32 w-auto rounded-md shadow-lg"/>
                                        ) : (
                                            <DynamicIcon name="upload-image" className="mx-auto h-12 w-12 text-brand-text-secondary" fallback={
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                                                </svg>
                                            }/>
                                        )}
                                        <div className="flex flex-col sm:flex-row items-center justify-center text-sm text-brand-text-secondary gap-2 mt-2">
                                            <label htmlFor="file-upload" className="relative cursor-pointer bg-brand-surface rounded-md font-medium text-brand-primary hover:text-brand-primary-hover focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-brand-primary focus-within:ring-offset-brand-background px-4 py-2">
                                                <span>Выбрать файл</span>
                                                <input id="file-upload" name="file-upload" type="file" className="sr-only" accept="image/*" onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)} />
                                            </label>
                                            <span className="hidden sm:inline">или</span>
                                            <button type="button" onClick={() => setIsCameraOpen(true)} className="bg-brand-surface rounded-md font-medium text-brand-primary hover:text-brand-primary-hover px-4 py-2">Сделать фото</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-lg font-medium text-white">2. Укажите номер бизнеса</label>
                                <p className="text-brand-text-secondary mb-4 text-sm">Этот шаг необходим для получения Pro-статуса (в данном демо это симуляция).</p>
                                <input 
                                    type="text" 
                                    value={businessNumber}
                                    onChange={(e) => setBusinessNumber(e.target.value)}
                                    placeholder="Например, 1234567890"
                                    className="mt-1 block w-full bg-brand-background border border-brand-border rounded-md p-3" 
                                    required 
                                />
                            </div>
                            
                            <button 
                                type="submit"
                                disabled={!imageFile || !businessNumber.trim()}
                                className="w-full mt-4 bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 px-6 rounded-lg transition-colors text-lg disabled:bg-gray-500 disabled:cursor-not-allowed"
                            >
                                Получить Pro-статус
                            </button>
                        </form>
                    </>
                );
        }
    }

    return (
        <>
            <div className="max-w-3xl mx-auto bg-brand-surface p-6 sm:p-8 rounded-lg shadow-xl">
                {renderContent()}
            </div>
            {isCameraOpen && <CameraCaptureModal onClose={() => setIsCameraOpen(false)} onCapture={handleCameraCapture} />}
        </>
    );
};

export default VerificationPage;
