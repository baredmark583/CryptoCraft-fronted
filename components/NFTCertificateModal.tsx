import React from 'react';
import type { Product } from '../types';

interface NFTCertificateModalProps {
    product: Product;
    onClose: () => void;
}

const NFTCertificateModal: React.FC<NFTCertificateModalProps> = ({ product, onClose }) => {
    
    return (
        <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in-down"
            onClick={onClose}
        >
            <div 
                className="w-full max-w-md bg-gradient-to-br from-gray-900 to-stone-900 rounded-2xl shadow-2xl border border-purple-500/30 p-1 relative"
                onClick={e => e.stopPropagation()}
            >
                <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-sky-400 rounded-lg blur opacity-20 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                <div className="relative bg-base-200 rounded-xl p-6">
                    <div className="text-center mb-4">
                        <p className="text-sm font-bold tracking-widest text-purple-400">СЕРТИФИКАТ ПОДЛИННОСТИ NFT</p>
                        <h2 className="text-2xl font-bold text-white">CryptoCraft Authenticity</h2>
                    </div>

                    <div className="aspect-square bg-base-100 rounded-lg overflow-hidden mb-4 border-2 border-base-300">
                        <img src={product.imageUrls[0]} alt={product.title} className="w-full h-full object-cover" />
                    </div>

                    <div className="text-center mb-4">
                        <h3 className="text-xl font-bold text-white">{product.title}</h3>
                        <p className="text-sm text-base-content/70">от <span className="font-semibold text-base-content">{product.seller.name}</span></p>
                    </div>

                    <div className="space-y-3 text-sm border-t border-b border-base-300/50 py-4">
                        <div className="flex justify-between">
                            <span className="text-base-content/70">Дата проверки:</span>
                            <span className="font-mono text-white">{new Date().toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-base-content/70">Token ID:</span>
                            <span className="font-mono text-white truncate">{product.nftTokenId}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-base-content/70">Адрес контракта:</span>
                            <span className="font-mono text-white truncate">{product.nftContractAddress}</span>
                        </div>
                    </div>
                    
                    <div className="mt-6">
                         <a 
                            href="https://getgems.io/" 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="w-full block text-center bg-sky-500 hover:bg-sky-600 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                        >
                            Посмотреть на Getgems
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NFTCertificateModal;