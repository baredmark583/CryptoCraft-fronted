import React from 'react';

interface ImageModalProps {
  imageUrl: string;
  onClose: () => void;
}

const ImageModal: React.FC<ImageModalProps> = ({ imageUrl, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="relative" onClick={e => e.stopPropagation()}>
        <img src={imageUrl} alt="Review full-size" className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl" />
        <button onClick={onClose} className="absolute -top-4 -right-4 bg-base-100 text-white rounded-full h-10 w-10 flex items-center justify-center font-bold text-2xl">&times;</button>
      </div>
    </div>
  );
};

export default ImageModal;
