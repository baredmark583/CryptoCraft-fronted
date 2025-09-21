import React, { useState } from 'react';
import type { User, PromoCode } from '../types';
import { useAuth } from '../hooks/useAuth';
import { apiService } from '../services/apiService';
import Spinner from './Spinner';

interface SettingsTabProps {
  user: User;
}

const ProfileSettings: React.FC<{ user: User }> = ({ user }) => {
    const { updateUser: updateAuthUser } = useAuth();
    const [formData, setFormData] = useState({
        name: user.name,
        headerImageUrl: user.headerImageUrl || '',
        phoneNumber: user.phoneNumber || '',
    });
    const [isSaving, setIsSaving] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const updatedUser = await apiService.updateUser(user.id, formData);
            updateAuthUser(updatedUser);
            alert("Профиль обновлен!");
        } catch (error) {
            console.error(error);
            alert("Не удалось обновить профиль.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="bg-brand-surface p-6 rounded-lg">
            <h3 className="text-xl font-bold text-white mb-4">Настройки профиля</h3>
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-brand-text-secondary">Имя</label>
                    <input type="text" name="name" value={formData.name} onChange={handleChange} className="mt-1 block w-full bg-brand-background border border-brand-border rounded-md p-2"/>
                </div>
                <div>
                    <label className="block text-sm font-medium text-brand-text-secondary">URL изображения шапки</label>
                    <input type="text" name="headerImageUrl" value={formData.headerImageUrl} onChange={handleChange} className="mt-1 block w-full bg-brand-background border border-brand-border rounded-md p-2"/>
                </div>
                <div>
                    <label className="block text-sm font-medium text-brand-text-secondary">Номер телефона</label>
                    <input type="tel" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} className="mt-1 block w-full bg-brand-background border border-brand-border rounded-md p-2"/>
                </div>
                <button onClick={handleSave} disabled={isSaving} className="w-full bg-brand-primary hover:bg-brand-primary-hover text-white font-bold py-2 px-4 rounded-lg flex justify-center disabled:bg-gray-500">
                    {isSaving ? <Spinner size="sm"/> : 'Сохранить'}
                </button>
            </div>
        </div>
    );
};

const PromoCodeManager: React.FC<{ user: User }> = ({ user }) => {
    // This is a placeholder for a more complex component.
    // In a real app, this would fetch, create, and delete promo codes.
    return (
         <div className="bg-brand-surface p-6 rounded-lg">
            <h3 className="text-xl font-bold text-white mb-4">Управление промокодами</h3>
            <p className="text-brand-text-secondary">Создавайте и управляйте скидками для ваших покупателей.</p>
            {/* Add UI for managing promo codes here */}
             <div className="mt-4 text-center py-8 bg-brand-background rounded-md">
                <p className="text-brand-text-secondary">Функционал управления промокодами в разработке.</p>
            </div>
        </div>
    )
};


const SettingsTab: React.FC<SettingsTabProps> = ({ user }) => {
  return (
    <div className="space-y-8">
      <ProfileSettings user={user} />
      <PromoCodeManager user={user} />
      {/* More settings sections can be added here */}
    </div>
  );
};

export default SettingsTab;
