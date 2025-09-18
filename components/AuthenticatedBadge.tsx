import React from 'react';

interface AuthenticatedBadgeProps {
    reportUrl?: string;
    nftTokenId?: string;
    onClick?: () => void;
}

const AuthenticatedBadge: React.FC<AuthenticatedBadgeProps> = ({ reportUrl, nftTokenId, onClick }) => {
    const isNft = !!nftTokenId;
    const badgeContent = (
        <div 
            className={`inline-flex items-center gap-2 font-semibold px-3 py-1 rounded-full text-sm transition-colors
                ${isNft 
                    ? 'bg-purple-500/10 text-purple-300' 
                    : 'bg-green-500/10 text-green-300'
                }
                ${onClick ? 'hover:bg-purple-500/20' : ''}
            `}
            title={isNft ? "Подлинность подтверждена NFT-сертификатом" : "Подлинность товара проверена экспертом CryptoCraft"}
        >
            {isNft ? (
                 <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                    <path fillRule="evenodd" d="M10.868 2.884c.321-.772 1.305-.772 1.626 0l1.393 3.363a1 1 0 00.95.69h3.541c.828 0 1.18 1.073.54 1.583l-2.864 2.082a1 1 0 00-.364 1.118l1.393 3.363c.321.772-.647 1.444-1.372 1.002l-2.864-2.082a1 1 0 00-1.175 0l-2.864 2.082c-.725.442-1.693-.23-1.372-1.002l1.393-3.363a1 1 0 00-.364-1.118L2.33 8.52c-.64-.51-.288-1.583.54-1.583h3.54a1 1 0 00.95-.69l1.393-3.363z" clipRule="evenodd" />
                 </svg>
            ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.286zm0 13.036h.008v.008h-.008v-.008z" />
                </svg>
            )}
            <span>{isNft ? "Подлинность подтверждена NFT" : "Подлинность подтверждена"}</span>
        </div>
    );

    if (onClick) {
        return <button onClick={onClick}>{badgeContent}</button>;
    }
    
    if (reportUrl) {
        return (
            <a href={reportUrl} target="_blank" rel="noopener noreferrer" title="Посмотреть отчет о проверке">
                {badgeContent}
            </a>
        );
    }
    
    return badgeContent;
};

export default AuthenticatedBadge;