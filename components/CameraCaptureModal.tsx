import React, { useState, useRef, useEffect, useCallback } from 'react';

interface CameraCaptureModalProps {
  onClose: () => void;
  onCapture: (file: File) => void;
}

const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({ onClose, onCapture }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "environment" } 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError("Не удалось получить доступ к камере. Проверьте разрешения в настройках браузера.");
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
  }, [stream]);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        canvas.toBlob(blob => {
          if (blob) {
            const file = new File([blob], 'verification_photo.jpg', { type: 'image/jpeg' });
            onCapture(file);
            onClose();
          }
        }, 'image/jpeg');
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
      <div className="bg-brand-surface rounded-lg w-full max-w-lg text-center p-4 relative">
        <h2 className="text-xl font-bold text-white mb-4">Сделать фото документа</h2>
        
        {error ? (
          <div className="text-red-400 p-8">{error}</div>
        ) : (
          <div className="relative aspect-video bg-black rounded-md overflow-hidden mb-4">
            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-contain" />
            <canvas ref={canvasRef} className="hidden" />
          </div>
        )}

        <div className="flex justify-center items-center gap-4">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 bg-brand-border hover:bg-brand-border/80 text-white font-bold rounded-lg"
          >
            Отмена
          </button>
          <button
            type="button"
            onClick={handleCapture}
            disabled={!!error}
            className="px-6 py-3 bg-brand-primary hover:bg-brand-primary-hover text-white font-bold rounded-full text-lg disabled:bg-gray-500"
          >
            Сфотографировать
          </button>
        </div>
      </div>
    </div>
  );
};

export default CameraCaptureModal;
