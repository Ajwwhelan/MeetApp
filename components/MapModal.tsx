
import React from 'react';
import { CloseIcon } from './icons';

interface MapModalProps {
  url: string;
  title?: string;
  onClose: () => void;
}

const MapModal: React.FC<MapModalProps> = ({ url, title, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-[28px] shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
        <header className="flex justify-between items-center p-4 px-6 border-b border-gray-100 bg-white">
          <h3 className="font-google-sans font-medium text-gray-900 px-1 truncate text-xl flex-1">{title || 'Map View'}</h3>
          <button 
            onClick={onClose} 
            className="text-gray-500 hover:text-gray-900 p-2 rounded-full hover:bg-gray-100 transition-colors" 
            aria-label="Close map view"
          >
            <CloseIcon className="w-6 h-6" />
          </button>
        </header>
        <div className="flex-1 relative bg-gray-50">
          <iframe
            key={url}
            src={url}
            title={title || "Google Maps Embed"}
            className="absolute inset-0 w-full h-full"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allow="geolocation; clipboard-write"
          ></iframe>
        </div>
      </div>
    </div>
  );
};

export default MapModal;
