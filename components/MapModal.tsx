
import React from 'react';
import { CloseIcon } from './icons';

interface MapModalProps {
  url: string;
  onClose: () => void;
}

const MapModal: React.FC<MapModalProps> = ({ url, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <header className="flex justify-end p-2 border-b bg-gray-50 rounded-t-lg">
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 p-2 rounded-full hover:bg-gray-200 transition-colors" aria-label="Close map view">
            <CloseIcon />
          </button>
        </header>
        <div className="flex-1">
          <iframe
            src={url}
            title="Google Maps Embed"
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          ></iframe>
        </div>
      </div>
    </div>
  );
};

export default MapModal;