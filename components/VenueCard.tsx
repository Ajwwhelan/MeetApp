
import React from 'react';
import { Venue } from '../types';
import { DirectionsIcon, InfoIcon, StarIcon, TflIcon, ShareIcon, BookmarkIcon, BookmarkSavedIcon, ClockIcon } from './icons';

interface VenueCardProps {
  venue: Venue;
  onSave?: (venue: Venue) => void;
  onRemove?: (placeId: string) => void;
  isSaved?: boolean;
}

const VenueCard: React.FC<VenueCardProps> = ({ venue, onSave, onRemove, isSaved }) => {

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
      <div className="p-5 flex-grow flex flex-col">
        <div className="flex items-center text-base text-gray-600">
           <span className="material-symbols-outlined !text-lg mr-1.5">{getVenueIcon(venue.type)}</span>
            {venue.type}
        </div>
        
        <div className="mt-2 flex items-start justify-between gap-2">
            <h3 className="text-xl leading-tight font-medium text-gray-900 flex-1">{venue.name}</h3>
            {venue.rating && venue.rating > 0 && (
              <div className="flex items-center gap-1 text-base font-bold text-amber-700 bg-amber-100 px-2.5 py-1 rounded-full flex-shrink-0 border border-amber-200">
                <StarIcon />
                <span>{venue.rating.toFixed(1)}</span>
              </div>
            )}
        </div>
        
        <div className="mt-4 text-gray-700 text-base space-y-4 flex-grow">
            <p className="flex items-start gap-2.5">
                <InfoIcon />
                <span>{venue.description}</span>
            </p>
             <p className="text-gray-800 font-medium flex items-center gap-2.5">
                <StarIcon />
                <span>{venue.fairness}</span>
            </p>
            {venue.opening_hours && (
                <p className="flex items-start gap-2.5">
                    <ClockIcon />
                    <span>{venue.opening_hours}</span>
                </p>
            )}
            {venue.tfl_considerations && (
                <p className="flex items-start gap-2.5">
                    <TflIcon />
                    <span>{venue.tfl_considerations}</span>
                </p>
            )}
        </div>
      </div>
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-end gap-2">
        {(onSave || onRemove) && (
            isSaved ? (
                <button
                    onClick={() => onRemove?.(venue.place_id)}
                    className="px-4 py-2 text-base font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center gap-2"
                    aria-label={`Remove ${venue.name} from saved`}
                >
                    <BookmarkSavedIcon />
                    Saved
                </button>
            ) : (
                <button
                    onClick={() => onSave?.(venue)}
                    className="px-4 py-2 text-base font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center gap-2"
                    aria-label={`Save ${venue.name}`}
                >
                    <BookmarkIcon />
                    Save
                </button>
            )
        )}
        <button
            onClick={handleShare}
            className="px-4 py-2 text-base font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center gap-2"
            aria-label={`Share details for ${venue.name}`}
        >
            <ShareIcon />
            Share
        </button>
        <button
            onClick={handleDirections}
            className="px-4 py-2 text-base font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center gap-2"
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
