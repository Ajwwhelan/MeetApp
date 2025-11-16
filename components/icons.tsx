
import React from 'react';

// Using span with Material Symbols Outlined class
const MaterialIcon: React.FC<{ name: string; className?: string }> = ({ name, className }) => (
    <span className={`material-symbols-outlined ${className}`}>{name}</span>
);

export const SearchIcon = () => <MaterialIcon name="search" className="text-xl" />;

export const LoadingIcon = () => (
    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

export const ErrorIcon = () => <MaterialIcon name="error" className="text-red-500" />;
export const ChatIcon = () => <MaterialIcon name="chat" className="text-2xl" />;
export const CloseIcon = () => <MaterialIcon name="close" />;
export const SendIcon = () => <MaterialIcon name="send" className="!text-xl" />;
export const UserIcon = () => <MaterialIcon name="person" />;
export const BotIcon = () => <MaterialIcon name="smart_toy" />;
export const ExternalLinkIcon = () => <MaterialIcon name="open_in_new" className="!text-base" />;
export const ShareIcon = () => <MaterialIcon name="share" className="!text-xl" />;
export const DirectionsIcon = ({ className = '!text-xl' }: { className?: string }) => <MaterialIcon name="directions" className={className} />;
export const StarIcon = () => <MaterialIcon name="star" className="text-amber-500 !text-xl" />;
export const TflIcon = () => <MaterialIcon name="tram" className="text-red-500 !text-xl" />;
export const InfoIcon = () => <MaterialIcon name="info" className="text-sky-600 !text-xl" />;
export const ClockIcon = () => <MaterialIcon name="schedule" className="text-gray-600 !text-xl" />;
export const FilterIcon = () => <MaterialIcon name="filter_list" />;
export const MapIcon = ({ className = '!text-sm' }: { className?: string }) => <MaterialIcon name="map" className={className} />;
export const BookmarkIcon = () => <MaterialIcon name="bookmark_add" className="!text-xl" />;
export const BookmarkSavedIcon = () => <MaterialIcon name="bookmark" className="!text-xl" />;
export const BookmarksIcon = () => <MaterialIcon name="bookmarks" />;
export const CopyIcon = ({ className = '!text-base' }: { className?: string }) => <MaterialIcon name="content_copy" className={className} />;
export const CheckIcon = ({ className = '!text-base' }: { className?: string }) => <MaterialIcon name="check" className={className} />;

export const StartIcon = () => <MaterialIcon name="trip_origin" className="text-blue-600" />;
export const DestinationIcon = () => <MaterialIcon name="place" className="text-red-600" />;
export const MyLocationIcon = () => <MaterialIcon name="my_location" />;
