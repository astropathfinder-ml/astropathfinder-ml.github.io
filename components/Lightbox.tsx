import React from 'react';
import { XIcon } from './Icons';

interface LightboxProps {
  imageUrl?: string;
  children?: React.ReactNode;
  onClose: () => void;
}

const Lightbox: React.FC<LightboxProps> = ({ imageUrl, children, onClose }) => {
  // Effect to prevent scrolling on the body when the lightbox is open
  React.useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="lightbox-heading"
    >
      <h2 id="lightbox-heading" className="sr-only">Enlarged view</h2>
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white hover:text-cyan-300 transition-colors z-[110]"
        aria-label="Close image view"
      >
        <XIcon className="h-10 w-10" />
      </button>
      <div className="p-4" onClick={(e) => e.stopPropagation()}>
        {imageUrl ? (
            <img
            src={imageUrl}
            alt="Enlarged view"
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl"
            />
        ) : (
            <div className="max-w-[90vw] max-h-[90vh] bg-white p-2 sm:p-4 rounded-lg shadow-2xl overflow-auto">
                {children}
            </div>
        )}
      </div>
    </div>
  );
};

export default Lightbox;