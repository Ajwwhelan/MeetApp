
import React from 'react';
import { Venue } from '../types';
import { DirectionsIcon, InfoIcon, StarIcon, TflIcon, ShareIcon, BookmarkIcon, BookmarkSavedIcon, ClockIcon, LocalCafeIcon, SportsBarIcon, ParkIcon, MuseumIcon, RestaurantIcon, PlaceIcon, MapIcon } from './icons';

interface VenueCardProps {
  venue: Venue;
  onSave?: (venue: Venue) => void;
  onRemove?: (placeId: string) => void;
  isSaved?: boolean;
  onViewOnMap?: (venue: Venue, mode: 'place' | 'directions') => void;
}

const VenueCard: React.FC<VenueCardProps> = ({ venue, onSave, onRemove, isSaved, onViewOnMap }) => {

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
    if (onViewOnMap) {
        onViewOnMap(venue, 'directions');
    } else {
        window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(venue.name)}&destination_place_id=${venue.place_id}`, '_blank');
    }
  };
  
  const handleViewMap = () => {
      if (onViewOnMap) {
          onViewOnMap(venue, 'place');
      } else {
          window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(venue.name)}&query_place_id=${venue.place_id}`, '_blank');
      }
  };

  const getVenueIcon = (type: string) => {
    const lowerType = type.toLowerCase();
    const className = "w-5 h-5 mr-1.5 text-gray-500";
    
    if (lowerType.includes('cafe') || lowerType.includes('coffee')) return <LocalCafeIcon className={className} />;
    if (lowerType.includes('pub') || lowerType.includes('bar')) return <SportsBarIcon className={className} />;
    if (lowerType.includes('park') || lowerType.includes('garden')) return <ParkIcon className={className} />;
    if (lowerType.includes('museum') || lowerType.includes('gallery')) return <MuseumIcon className={className} />;
    if (lowerType.includes('restaurant') || lowerType.includes('food')) return <RestaurantIcon className={className} />;
    return <PlaceIcon className={className} />;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden h-full transform transition-all hover:shadow-md hover:-translate-y-1 flex flex-col border border-gray-200 group">
      <div 
        className="h-48 w-full relative overflow-hidden bg-gray-100 cursor-pointer"
        onClick={handleViewMap}
        title="View on Map"
      >
        <img 
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" 
            src={venue.photo_url} 
            alt={`Photo of ${venue.name}`}
            onError={(e) => (e.currentTarget.src = 'https://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sCgIgARIEGg kapsamas_nda_de_erlendirildi__u_iddia_edilmektedir-AMJul9tDljGg5j3y1WJ_GfVTXh0feFIdGCAj8G15oE1lRq2xTj8y2pFb59dfhI2fDne_62DxSgFbCmojp117tZNOJViL8d7y8vKz28OzZkM4V-zGEdSXRyQqb0h071HrjAWE1sJ1_4qJbC17uDsM-vdpS8f7TzUaC8hN8jY2FhRhFk3xUfQ!3b0!4v1700000000!5e0!6m1!1e1')}
        />
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <span className="text-white font-medium px-4 py-2 rounded-full bg-black/30 backdrop-blur-sm border border-white/30 flex items-center gap-2">
                <MapIcon className="w-4 h-4" /> View Map
            </span>
        </div>
      </div>
      <div className="p-5 flex-grow flex flex-col">
        <div className="flex items-center text-sm font-medium text-gray-500 uppercase tracking-wide mb-1">
            {getVenueIcon(venue.type)}
            {venue.type}
        </div>
        
        <div className="flex items-start justify-between gap-2 mb-3">
            <h3 className="text-lg leading-snug font-bold text-gray-900 flex-1 cursor-pointer hover:text-blue-600 transition-colors" onClick={handleViewMap}>{venue.name}</h3>
            {venue.rating && venue.rating > 0 && (
              <div className="flex items-center gap-1 text-xs font-bold text-amber-800 bg-amber-50 px-2 py-1 rounded-md flex-shrink-0 border border-amber-100">
                <StarIcon className="w-3.5 h-3.5 text-amber-500" />
                <span>{venue.rating.toFixed(1)}</span>
              </div>
            )}
        </div>
        
        <div className="mt-1 text-gray-600 text-sm space-y-3 flex-grow">
            <p className="flex items-start gap-2.5">
                <InfoIcon className="w-4 h-4 text-gray-400 mt-0.5" />
                <span className="leading-relaxed">{venue.description}</span>
            </p>
             <p className="text-gray-900 font-medium flex items-center gap-2.5 bg-blue-50 p-2 rounded-lg border border-blue-100">
                <StarIcon className="w-4 h-4 text-blue-500" />
                <span className="text-sm">{venue.fairness}</span>
            </p>
            {venue.opening_hours && (
                <p className="flex items-start gap-2.5">
                    <ClockIcon className="w-4 h-4 text-gray-400 mt-0.5" />
                    <span>{venue.opening_hours}</span>
                </p>
            )}
            {venue.tfl_considerations && (
                <p className="flex items-start gap-2.5">
                    <TflIcon className="w-4 h-4 text-gray-400 mt-0.5" />
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
                    className="p-2 text-blue-600 hover:bg-blue-100 rounded-full transition-colors"
                    title="Remove from saved"
                    aria-label={`Remove ${venue.name} from saved`}
                >
                    <BookmarkSavedIcon className="w-5 h-5" />
                </button>
            ) : (
                <button
                    onClick={() => onSave?.(venue)}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                    title="Save venue"
                    aria-label={`Save ${venue.name}`}
                >
                    <BookmarkIcon className="w-5 h-5" />
                </button>
            )
        )}
        <button
            onClick={handleShare}
            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-gray-100 rounded-full transition-colors"
            title="Share"
            aria-label={`Share details for ${venue.name}`}
        >
            <ShareIcon className="w-5 h-5" />
        </button>
        <div className="h-5 w-px bg-gray-300 mx-1"></div>
        <button
            onClick={handleViewMap}
            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-gray-100 rounded-full transition-colors"
            title="View on Map"
            aria-label={`View ${venue.name} on map`}
        >
            <MapIcon className="w-5 h-5" />
        </button>
        <button
            onClick={handleDirections}
            className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-blue-600 bg-white border border-blue-200 hover:bg-blue-50 rounded-full transition-colors shadow-sm"
            aria-label={`Get directions to ${venue.name}`}
        >
            <DirectionsIcon className="w-4 h-4" />
            Directions
        </button>
      </div>
    </div>
  );
};

export default VenueCard;
