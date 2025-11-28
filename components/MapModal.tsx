import React from 'react';
import { CloseIcon } from './icons';

interface MapModalProps {
  url: string;
  title?: string;
  onClose: () => void;
}

const MapModal: React.FC<MapModalProps> = ({ url, title, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex justify-center items-center p-4 backdrop-blur-md" onClick={onClose}>
      <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden animate-fade-in-up border border-white/10" onClick={(e) => e.stopPropagation()}>
        <header className="flex justify-between items-center p-5 px-6 border-b border-gray-100 bg-white shadow-sm z-10">
          <h3 className="font-bold text-gray-900 px-1 truncate text-xl md:text-2xl flex-1 tracking-tight">{title || 'Map View'}</h3>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-900 p-2.5 rounded-full hover:bg-gray-100 transition-colors" 
            aria-label="Close map view"
          >
            <CloseIcon className="w-7 h-7" />
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