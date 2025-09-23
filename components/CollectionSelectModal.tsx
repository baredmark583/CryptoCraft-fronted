import React, { useState } from 'react';
import { useCollections } from '../hooks/useCollections';
import Spinner from './Spinner';

interface CollectionSelectModalProps {
    productId: string;
    onClose: () => void;
}

const CollectionSelectModal: React.FC<CollectionSelectModalProps> = ({ productId, onClose }) => {
    const { collections, toggleProductInCollection, createCollection, getCollectionsForProduct } = useCollections();
    const [newCollectionName, setNewCollectionName] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    
    const collectionsForThisProduct = getCollectionsForProduct(productId).map(c => c.id);

    const handleCreateAndAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCollectionName.trim()) return;

        setIsCreating(true);
        const newCollection = await createCollection(newCollectionName);
        if (newCollection) {
            await toggleProductInCollection(newCollection.id, productId);
            setNewCollectionName('');
        }
        setIsCreating(false);
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-base-100 rounded-2xl shadow-2xl w-full max-w-sm border border-base-300" onClick={e => e.stopPropagation()}>
                <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-white">Сохранить в...</h2>
                        <button onClick={onClose} className="text-base-content/70 hover:text-white text-3xl leading-none">&times;</button>
                    </div>

                    <div className="max-h-60 overflow-y-auto space-y-2 pr-2 mb-4">
                        {collections.map(collection => (
                             <label key={collection.id} className="flex items-center space-x-3 p-3 bg-base-200 rounded-lg cursor-pointer hover:bg-base-300 transition-colors">
                                <input 
                                    type="checkbox" 
                                    checked={collectionsForThisProduct.includes(collection.id)}
                                    onChange={() => toggleProductInCollection(collection.id, productId)}
                                    className="h-5 w-5 rounded bg-base-100 border-base-300 text-primary focus:ring-primary"
                                />
                                <span className="font-medium text-white">{collection.name}</span>
                            </label>
                        ))}
                    </div>

                    <form onSubmit={handleCreateAndAdd}>
                        <label className="block text-sm font-medium text-base-content/70 mb-2">Создать новую коллекцию</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder="Название коллекции..."
                                value={newCollectionName}
                                onChange={(e) => setNewCollectionName(e.target.value)}
                                className="flex-grow bg-base-200 border border-base-300 rounded-md shadow-sm p-2"
                            />
                            <button
                                type="submit"
                                disabled={isCreating || !newCollectionName.trim()}
                                className="px-4 py-2 bg-primary hover:bg-primary-focus text-primary-content font-bold rounded-lg transition-colors flex items-center justify-center disabled:bg-gray-500"
                            >
                                {isCreating ? <Spinner size="sm" /> : "Создать"}
                            </button>
                        </div>
                    </form>
                </div>
                 <div className="bg-base-200/50 p-3 text-center">
                    <button onClick={onClose} className="font-bold text-primary hover:text-primary-focus">Готово</button>
                </div>
            </div>
        </div>
    );
};

export default CollectionSelectModal;