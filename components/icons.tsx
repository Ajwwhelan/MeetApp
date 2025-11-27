
import React from 'react';

interface IconProps {
  className?: string;
}

const SvgWrapper: React.FC<{ children: React.ReactNode; className?: string; viewBox?: string }> = ({ 
  children, 
  className = "w-6 h-6",
  viewBox = "0 0 24 24"
}) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox={viewBox} 
    fill="currentColor" 
    className={className}
    aria-hidden="true"
  >
    {children}
  </svg>
);

export const SearchIcon = ({ className }: IconProps) => (
  <SvgWrapper className={className}>
    <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
  </SvgWrapper>
);

export const LoadingIcon = () => (
  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

export const ErrorIcon = ({ className }: IconProps) => (
  <SvgWrapper className={`text-red-500 ${className || 'w-6 h-6'}`}>
     <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
  </SvgWrapper>
);

export const ChatIcon = ({ className }: IconProps) => (
    <SvgWrapper className={className || "w-6 h-6"}>
        <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z"/>
    </SvgWrapper>
);

export const CloseIcon = ({ className }: IconProps) => (
    <SvgWrapper className={className}>
        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
    </SvgWrapper>
);

export const SendIcon = ({ className }: IconProps) => (
    <SvgWrapper className={className}>
        <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
    </SvgWrapper>
);

export const UserIcon = ({ className }: IconProps) => (
    <SvgWrapper className={className}>
        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
    </SvgWrapper>
);

export const BotIcon = ({ className }: IconProps) => (
    <SvgWrapper className={className}>
        <path d="M20 9V7c0-1.1-.9-2-2-2h-3c0-1.66-1.34-3-3-3S9 3.34 9 5H6c-1.1 0-2 .9-2 2v2c-1.66 0-3 1.34-3 3s1.34 3 3 3v4c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-4c1.66 0 3-1.34 3-3s-1.34-3-3-3zM7.5 11.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5S9.83 13 9 13s-1.5-.67-1.5-1.5zM16 17H8v-2h8v2zm-1.5-4c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
    </SvgWrapper>
);

export const ExternalLinkIcon = ({ className }: IconProps) => (
    <SvgWrapper className={className}>
         <path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/>
    </SvgWrapper>
);

export const ShareIcon = ({ className }: IconProps) => (
    <SvgWrapper className={className}>
         <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"/>
    </SvgWrapper>
);

export const DirectionsIcon = ({ className }: IconProps) => (
    <SvgWrapper className={className}>
         <path d="M21.71 11.29l-9-9c-.39-.39-1.02-.39-1.41 0l-9 9c-.39.39-.39 1.02 0 1.41l9 9c.39.39 1.02.39 1.41 0l9-9c.39-.38.39-1.01 0-1.41zM14 14.5V12h-4v3H8v-4c0-.55.45-1 1-1h5V7.5l3.5 3.5-3.5 3.5z"/>
    </SvgWrapper>
);

export const StarIcon = ({ className }: IconProps) => (
    <SvgWrapper className={`text-amber-500 ${className || 'w-5 h-5'}`}>
         <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
    </SvgWrapper>
);

export const InfoIcon = ({ className }: IconProps) => (
    <SvgWrapper className={`text-sky-600 ${className || 'w-5 h-5'}`}>
         <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
    </SvgWrapper>
);

export const ClockIcon = ({ className }: IconProps) => (
    <SvgWrapper className={`text-gray-600 ${className || 'w-5 h-5'}`}>
         <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
    </SvgWrapper>
);

export const FilterIcon = ({ className }: IconProps) => (
    <SvgWrapper className={className}>
         <path d="M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z"/>
    </SvgWrapper>
);

export const MapIcon = ({ className }: IconProps) => (
    <SvgWrapper className={className}>
         <path d="M20.5 3l-.16.03L15 5.1 9 3 3.36 4.9c-.21.07-.36.25-.36.48V20.5c0 .28.22.5.5.5l.16-.03L9 18.9l6 2.1 5.64-1.9c.21-.07.36-.25.36-.48V3.5c0-.28-.22-.5-.5-.5zM15 19l-6-2.11V5l6 2.11V19z"/>
    </SvgWrapper>
);

export const BookmarkIcon = ({ className }: IconProps) => (
    <SvgWrapper className={className}>
         <path d="M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2zm0 15l-5-2.18L7 18V5h10v13zm-4-7.9V7h-2v3.1H7.9v2H11v3.1h2v-3.1h3.1v-2H13z"/>
    </SvgWrapper>
);

export const BookmarkSavedIcon = ({ className }: IconProps) => (
    <SvgWrapper className={className}>
         <path d="M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2z"/>
    </SvgWrapper>
);

export const BookmarksIcon = ({ className }: IconProps) => (
    <SvgWrapper className={className}>
         <path d="M19 18l2 1V3c0-1.1-.9-2-2-2H8c-1.1 0-2 .9-2 2v14l2-1 2 1V3h10v15zM15 5H5c-1.1 0-2 .9-2 2v16l7-3 7 3V7c0-1.1-.9-2-2-2z"/>
    </SvgWrapper>
);

export const CopyIcon = ({ className }: IconProps) => (
    <SvgWrapper className={className}>
         <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
    </SvgWrapper>
);

export const CheckIcon = ({ className }: IconProps) => (
    <SvgWrapper className={className}>
         <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
    </SvgWrapper>
);

export const TripOriginIcon = ({ className }: IconProps) => (
    <SvgWrapper className={className || 'w-6 h-6 text-gray-700'}>
         <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"/>
    </SvgWrapper>
);

export const StartIcon = TripOriginIcon;

export const DestinationIcon = ({ className }: IconProps) => (
    <SvgWrapper className={`text-red-600 ${className || 'w-6 h-6'}`}>
         <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5-2.5 2.5z"/>
         <circle cx="12" cy="9" r="2.5" fill="#7f1d1d" fillOpacity="0.2"/>
    </SvgWrapper>
);

export const MyLocationIcon = ({ className }: IconProps) => (
    <SvgWrapper className={className}>
         <path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3A8.994 8.994 0 0 0 13 3.06V1h-2v2.06A8.994 8.994 0 0 0 3.06 11H1v2h2.06A8.994 8.994 0 0 0 11 20.94V23h2v-2.06A8.994 8.994 0 0 0 20.94 13H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"/>
    </SvgWrapper>
);

// Transport Icons
export const SubwayIcon = ({ className }: IconProps) => (
    <SvgWrapper className={className}>
        <path d="M17.8 2.8C16 .65 13.18 0 12 0S8 1.35 6.2 2.8c-1.95 1.55-3.2 4.05-3.2 7.2v7.5c0 1.21.86 2.22 2.01 2.44l-1.26 2.31C3.48 22.81 3.88 24 5 24h1c.68 0 1.28-.34 1.63-.83L8.7 21.5h6.6l1.07 1.67c.35.49.95.83 1.63.83h1c1.13 0 1.52-1.19 1.26-1.75l-1.26-2.31c1.15-.22 2.01-1.24 2.01-2.44V10c0-3.15-1.25-5.65-3.21-7.2zM12 2c2.54 0 4.68 1.37 5.84 3.39C16.78 4.54 14.64 4 12 4s-4.78.54-5.84 1.39C7.32 3.37 9.46 2 12 2zm-5 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm10 0c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zM6 15.5v-2h12v2H6z"/>
    </SvgWrapper>
);

export const BusIcon = ({ className }: IconProps) => (
    <SvgWrapper className={className}>
        <path d="M4 16c0 .88.39 1.67 1 2.22V20c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-6H6V6h12v5z"/>
    </SvgWrapper>
);

export const TramIcon = ({ className }: IconProps) => (
    <SvgWrapper className={className}>
        <path d="M19 16.94V8.5c0-2.79-2.61-3.4-6.01-3.49l.76-1.51H17V2H7v1.5h4.75l-.76 1.52C7.86 5.11 5 5.73 5 8.5v8.44c0 1.45 1.19 2.66 2.59 2.97L6 21.5v.5h2.23l2-2H14l2 2h2v-.5l-1.59-1.59c1.4-.31 2.59-1.52 2.59-2.97zM12 5.4c3.55.08 5.5.62 5.5 3.1v.5H6.5v-.5c0-2.48 1.95-3.02 5.5-3.1zM7 17c-.55 0-1-.45-1-1h12c0 .55-.45 1-1 1H7z"/>
    </SvgWrapper>
);

export const TflIcon = TramIcon;

export const TrainIcon = ({ className }: IconProps) => (
    <SvgWrapper className={className}>
        <path d="M12 2c-4.42 0-8 .5-8 4v10.5c0 1.89 1.54 3.43 3.42 3.48L5 21.5v.5h14v-.5l-2.42-1.52c1.88-.05 3.42-1.59 3.42-3.48V6c0-3.5-3.58-4-8-4zm0 2c3.71 0 5.13.46 5.67 1H6.33c.54-.54 1.96-1 5.67-1zm6 11.5c0 .83-.67 1.5-1.5 1.5h-9c-.83 0-1.5-.67-1.5-1.5V12h12v3.5zm0-5.5H6V7h12v1z"/>
    </SvgWrapper>
);

export const RailIcon = ({ className }: IconProps) => (
    <SvgWrapper className={className}>
        <path d="M4 15.5C4 17.43 5.57 19 7.5 19L6 20.5v.5h12v-.5L16.5 19c1.93 0 3.5-1.57 3.5-3.5V5c0-3.5-3.58-4-8-4s-8 .5-8 4v10.5zm8 1.5c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm6-7H6V5h12v5z"/>
    </SvgWrapper>
);

export const PublicTransportIcon = ({ className }: IconProps) => (
    <SvgWrapper className={className}>
        <path d="M12 2C8 2 4 2.5 4 6v9.5c0 .95.38 1.81 1 2.44V20c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-2.06c.62-.63 1-1.49 1-2.44V6c0-3.5-4-4-8-4zm3.5 13c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm3-7H5.5V6h13v2zm-10 7c-.83 0-1.5-.67-1.5-1.5S5.67 12 6.5 12s1.5.67 1.5 1.5S7.33 15 6.5 15z"/>
    </SvgWrapper>
);

export const LocalCafeIcon = ({ className }: IconProps) => (
    <SvgWrapper className={className}>
        <path d="M20 3H4v10c0 2.21 1.79 4 4 4h6c2.21 0 4-1.79 4-4v-3h2c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 5h-2V5h2v3zM4 19h16v2H4z"/>
    </SvgWrapper>
);

export const SportsBarIcon = ({ className }: IconProps) => (
    <SvgWrapper className={className}>
        <path d="M21 5V3H3v2l8 9v5H6v2h12v-2h-5v-5l8-9zM7.43 5h9.14l-1.83 2.05L12 9.5l-2.74-2.45L7.43 5z"/>
    </SvgWrapper>
);

export const ParkIcon = ({ className }: IconProps) => (
    <SvgWrapper className={className}>
        <path d="M17 12h2L12 2 5.05 12H7l-3.9 6h6.92v4h3.95v-4H21l-4-6z"/>
    </SvgWrapper>
);

export const MuseumIcon = ({ className }: IconProps) => (
    <SvgWrapper className={className}>
        <path d="M22 11V9L12 2 2 9v2h2v9H2v2h20v-2h-2v-9h2zm-4 9H6V11h12v9z"/>
    </SvgWrapper>
);

export const RestaurantIcon = ({ className }: IconProps) => (
    <SvgWrapper className={className}>
        <path d="M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7zm5-3v8h2.5v8H21V2c-2.76 0-5 2.24-5 4z"/>
    </SvgWrapper>
);

export const PlaceIcon = ({ className }: IconProps) => (
    <SvgWrapper className={className}>
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5-2.5 2.5z"/>
    </SvgWrapper>
);

export const MicIcon = ({ className }: IconProps) => (
    <SvgWrapper className={className}>
        <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
        <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
    </SvgWrapper>
);

export const MicOffIcon = ({ className }: IconProps) => (
    <SvgWrapper className={className}>
        <path d="M19 11h-1.7c0 .74-.16 1.43-.43 2.05l1.23 1.23c.56-.98.9-2.09.9-3.28zm-4.02.17c0-.06.02-.11.02-.17V5c0-1.66-1.34-3-3-3S9 3.34 9 5v.18l5.98 5.99zM4.27 3L3 4.27l6.01 6.01V11c0 1.66 1.33 3 2.99 3 .22 0 .44-.03.65-.08l2.97 2.97c-.99.53-2.13.85-3.36.95V21h2v-3.08c2.5-.37 4.63-1.98 5.82-4.05l2.47 2.47 1.27-1.27L4.27 3zM11 11v.18l2.51 2.51C13.29 13.9 12.98 14 12.65 14c-1.66 0-3-1.34-3-3v-2l1.35 1.35z"/>
    </SvgWrapper>
);

export const WaveformIcon = ({ className }: IconProps) => (
    <SvgWrapper className={className}>
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-12h2v12h-2zm-4 4h2v4H7zm8 0h2v4h-2z"/>
    </SvgWrapper>
);

export const VolumeUpIcon = ({ className }: IconProps) => (
    <SvgWrapper className={className}>
        <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
    </SvgWrapper>
);

export const StopCircleIcon = ({ className }: IconProps) => (
    <SvgWrapper className={className}>
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/>
    </SvgWrapper>
);
