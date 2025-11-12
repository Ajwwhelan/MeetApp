
import React from 'react';
import { Venue } from '../types';
import { DirectionsIcon, InfoIcon, StarIcon, TflIcon, ShareIcon } from './icons';

interface VenueCardProps {
  venue: Venue;
}

const VenueCard: React.FC<VenueCardProps> = ({ venue }) => {

  const handleShare = async () => {
    const shareData = {
        title: `Meet at ${venue.name}`,
        text: `Let's meet at ${venue.name}. Here's the Google Maps link:`,
        url: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(venue.name)}&query_place_id=${venue.place_id}`
    };

    if (navigator.share) {
        try {
            await navigator.share(shareData);
        } catch (err: any) {
            if (err.name !== 'AbortError') {
              console.error('Error sharing:', err);
            }
        }
    } else {
        navigator.clipboard.writeText(shareData.url).then(() => {
            alert('Sharing is not supported on this browser, so the link has been copied to your clipboard!');
        }).catch(err => {
            console.error('Failed to copy link:', err);
            alert('Sharing is not supported and we could not copy the link to your clipboard.');
        });
    }
  };

  const handleDirections = () => {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(venue.name)}&destination_place_id=${venue.place_id}`, '_blank');
  };

  const getVenueIcon = (type: string) => {
    const lowerType = type.toLowerCase();
    if (lowerType.includes('cafe') || lowerType.includes('coffee')) return 'local_cafe';
    if (lowerType.includes('pub') || lowerType.includes('bar')) return 'sports_bar';
    if (lowerType.includes('park')) return 'park';
    if (lowerType.includes('museum')) return 'museum';
    if (lowerType.includes('restaurant')) return 'restaurant';
    return 'place';
  };

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden h-full transform transition-all hover:shadow-xl hover:-translate-y-1 flex flex-col border border-gray-200">
      <div className="h-48 w-full">
        <img 
            className="h-full w-full object-cover" 
            src={venue.photo_url} 
            alt={`Photo of ${venue.name}`}
            onError={(e) => (e.currentTarget.src = 'https://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sCgIgARIEGg kapsamas_nda_de_erlendirildi__u_iddia_edilmektedir-AMJul9tDljGg5j3y1WJ_GfVTXh0feFIdGCAj8G15oE1lRq2xTj8y2pFb59dfhI2fDne_62DxSgFbCmojp117tZNOJViL8d7y8vKz28OzZkM4V-zGEdSXRyQqb0h071HrjAWE1sJ1_4qJbC17uDsM-vdpS8f7TzUaC8hN8jY2FhRhFk3xUfQ!3b0!4v1700000000!5e0!6m1!1e1')}
        />
      </div>
      <div className="p-4 flex-grow flex flex-col">
        <div className="flex items-center text-sm text-gray-600">
           <span className="material-symbols-outlined !text-base mr-1.5">{getVenueIcon(venue.type)}</span>
            {venue.type}
        </div>
        <h3 className="mt-1 text-lg leading-tight font-medium text-gray-900">{venue.name}</h3>
        
        <div className="mt-4 text-gray-700 text-sm space-y-3 flex-grow">
            <p className="flex items-start gap-2">
                <InfoIcon />
                <span>{venue.description}</span>
            </p>
             <p className="text-gray-800 font-medium flex items-center gap-2">
                <StarIcon />
                <span>{venue.fairness}</span>
            </p>
            {venue.tfl_considerations && (
                <p className="flex items-start gap-2">
                    <TflIcon />
                    <span>{venue.tfl_considerations}</span>
                </p>
            )}
        </div>
      </div>
      <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 flex items-center justify-end gap-2">
        <button
            onClick={handleShare}
            className="px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center gap-2"
            aria-label={`Share details for ${venue.name}`}
        >
            <ShareIcon />
            Share
        </button>
        <button
            onClick={handleDirections}
            className="px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center gap-2"
            aria-label={`Get directions to ${venue.name}`}
        >
            <DirectionsIcon />
            Directions
        </button>
      </div>
    </div>
  );
};

export default VenueCard;