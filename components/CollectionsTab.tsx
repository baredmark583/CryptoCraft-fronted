import React, { useState } from 'react';
import { useCollections } from '../hooks/useCollections';
import { Link } from 'react-router-dom';
import Spinner from './Spinner';

const CollectionsTab: React.FC = () => {
    const { collections, createCollection } = useCollections();
    const [newCollectionName, setNewCollectionName] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCollectionName.trim()) return;
        setIsCreating(true);
        await createCollection(newCollectionName);
        setNewCollectionName('');
        setIsCreating(false);
    };

    return (
        <div className="space-y-6">
            <form onSubmit={handleCreate} className="flex gap-2">
                <input 
                    type="text" 
                    value={newCollectionName}
                    onChange={e => setNewCollectionName(e.target.value)}
                    placeholder="Название новой коллекции..."
                    className="input input-bordered w-full"
                />
                <button type="submit" className="btn btn-primary" disabled={isCreating}>
                    {isCreating ? <Spinner size="sm" /> : "Создать"}
                </button>
            </form>
            
            {collections.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {collections.map(collection => (
                        <Link key={collection.id} to={`/collection/${collection.id}`} className="card bg-base-200 hover:bg-base-300 transition-colors">
                            <div className="card-body">
                                <h2 className="card-title text-white">{collection.name}</h2>
                                <p className="text-base-content/70">{collection.productIds.length} товаров</p>
                            </div>
                        </Link>
                    ))}
                </div>
            ) : (
                <p className="text-center text-base-content/70 py-8">У вас еще нет коллекций.</p>
            )}
        </div>
    );
};

export default CollectionsTab;