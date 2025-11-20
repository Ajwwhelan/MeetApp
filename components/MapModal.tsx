
import React from 'react';
import { CloseIcon } from './icons';

interface MapModalProps {
  url: string;
  title?: string;
  onClose: () => void;
}

const MapModal: React.FC<MapModalProps> = ({ url, title, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
        <header className="flex justify-between items-center p-4 border-b border-gray-200 bg-gray-50">
          <h3 className="font-semibold text-gray-800 px-1 truncate text-lg flex-1">{title || 'Map View'}</h3>
          <button 
            onClick={onClose} 
            className="text-gray-500 hover:text-gray-800 p-2 rounded-full hover:bg-gray-200 transition-colors" 
            aria-label="Close map view"
          >
            <CloseIcon className="w-6 h-6" />
          </button>
        </header>
        <div className="flex-1 relative bg-gray-100">
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
