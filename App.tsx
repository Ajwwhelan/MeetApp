
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import ReactDOM from 'react-dom/client';
import { findMeetingPoints } from './services/geminiService';
import { Venue, GroundingChunk } from './types';
import LocationInput from './components/LocationInput';
import VenueCard from './components/VenueCard';
import Chatbot from './components/Chatbot';
import { ChatIcon, SearchIcon, ErrorIcon, LoadingIcon, ShareIcon, CheckIcon, BookmarksIcon, SubwayIcon, BusIcon, TramIcon, RailIcon, TrainIcon, StartIcon, DestinationIcon, ExternalLinkIcon } from './components/icons';
import VenueFilter from './components/VenueFilter';
import TutorialOverlay from './components/TutorialOverlay';
import MapModal from './components/MapModal';

const App: React.FC = () => {
  const [locationA, setLocationA] = useState<string>('Kings Cross Station, London');
  const [locationB, setLocationB] = useState<string>('Canary Wharf Station, London');
  const [venues, setVenues] = useState<Venue[]>([]);
  const [savedVenues, setSavedVenues] = useState<Venue[]>([]);
  const [groundingChunks, setGroundingChunks] = useState<GroundingChunk[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [userCoords, setUserCoords] = useState<{ latitude: number; longitude: number; } | null>(null);
  const [isGeolocating, setIsGeolocating] = useState<boolean>(true);
  const [selectedVenueType, setSelectedVenueType] = useState<string>('All');
  const [venueTypes, setVenueTypes] = useState<string[]>(['All']);
  const [transitPreferences, setTransitPreferences] = useState<string[]>(['Tube', 'Bus', 'DLR', 'Overground']);
  const [shareConfirmation, setShareConfirmation] = useState<string>('');
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const [showTutorial, setShowTutorial] = useState<boolean>(false);
  const [mapModalData, setMapModalData] = useState<{url: string, title?: string} | null>(null);

  const savedVenueIds = useMemo(() => new Set(savedVenues.map(v => v.place_id)), [savedVenues]);

  const availableTransitModes = ['Tube', 'Bus', 'DLR', 'Overground', 'National Rail', 'Tram'];
  
  const transitModeIcons: { [key: string]: React.ReactNode } = {
    'Tube': <SubwayIcon className="w-5 h-5" />,
    'Bus': <BusIcon className="w-5 h-5" />,
    'DLR': <TrainIcon className="w-5 h-5" />, 
    'Overground': <RailIcon className="w-5 h-5" />,
    'National Rail': <TrainIcon className="w-5 h-5" />,
    'Tram': <TramIcon className="w-5 h-5" />,
  };

  const handlePreferenceChange = (mode: string) => {
    setTransitPreferences(prev =>
      prev.includes(mode)
        ? prev.filter(m => m !== mode)
        : [...prev, mode]
    );
  };

  const geolocateUser = useCallback(() => {
    setIsGeolocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserCoords({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setLocationA('My Current Location');
        setIsGeolocating(false);
      },
      () => {
        console.warn('Geolocation permission denied. Proceeding without user location.');
        setIsGeolocating(false);
      }
    );
  }, []);
  
  useEffect(() => {
    try {
      const storedVenues = localStorage.getItem('savedMeetAppVenues');
      if (storedVenues) {
        setSavedVenues(JSON.parse(storedVenues));
      }
    } catch (error) {
      console.error("Failed to load saved venues from localStorage", error);
      localStorage.removeItem('savedMeetAppVenues');
    }
    
    const tutorialSeen = localStorage.getItem('meetapp_tutorial_seen');
    if (!tutorialSeen) {
      setShowTutorial(true);
    }

    geolocateUser();
  }, [geolocateUser]);

  const handleCloseTutorial = () => {
    setShowTutorial(false);
    localStorage.setItem('meetapp_tutorial_seen', 'true');
  };
  
  useEffect(() => {
    if (venues.length > 0) {
      const uniqueTypes = ['All', ...Array.from(new Set(venues.map(v => v.type)))];
      setVenueTypes(uniqueTypes);
    } else {
      setVenueTypes(['All']);
    }
    setSelectedVenueType('All');
  }, [venues]);

  const filteredVenues = useMemo(() => {
    if (selectedVenueType === 'All') {
      return venues;
    }
    return venues.filter(venue => venue.type === selectedVenueType);
  }, [venues, selectedVenueType]);
  
  const handleSaveVenue = useCallback((venueToSave: Venue) => {
    if (!venueToSave || typeof venueToSave.place_id !== 'string') {
      console.error("Attempted to save an invalid or malformed venue object:", venueToSave);
      return;
    }
    
    setSavedVenues(prevSaved => {
      const isAlreadySaved = prevSaved.some(v => v.place_id === venueToSave.place_id);
      if (isAlreadySaved) {
        return prevSaved;
      }
      
      const newSavedVenues = [...prevSaved, venueToSave];
      try {
        localStorage.setItem('savedMeetAppVenues', JSON.stringify(newSavedVenues));
      } catch (e) {
        console.error("Failed to save to localStorage:", e);
      }
      return newSavedVenues;
    });
  }, []);


  const handleRemoveVenue = useCallback((placeIdToRemove: string) => {
    setSavedVenues(prevSaved => {
        const newSavedVenues = prevSaved.filter(v => v.place_id !== placeIdToRemove);
        localStorage.setItem('savedMeetAppVenues', JSON.stringify(newSavedVenues));
        return newSavedVenues;
    });
  }, []);

  const handleFindMeetingPoint = useCallback(async () => {
    if (!locationA || !locationB) {
      setError('Please enter both locations.');
      return;
    }
    setHasSearched(true);
    setIsLoading(true);
    setError(null);
    setVenues([]);
    setGroundingChunks([]);

    try {
      const result = await findMeetingPoints(locationA, locationB, userCoords, transitPreferences);
      if (result && result.venues && result.venues.length > 0) {
        setVenues(result.venues);
        setGroundingChunks(result.groundingChunks || []);
      } else if (result) {
        setVenues([]); 
        setGroundingChunks(result.groundingChunks || []);
      } else {
        setVenues([]);
        setError('Could not find suitable meeting points. Try different locations.');
      }
    } catch (e: any) {
      setError(`An error occurred: ${e.message}. Please check your API key and try again.`);
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [locationA, locationB, userCoords, transitPreferences]);

  const handleViewOnMap = useCallback((venue: Venue, mode: 'place' | 'directions' = 'place') => {
    let url = '';
    let title = venue.name;

    if (mode === 'directions') {
        let origin = '';
        if (userCoords) {
            origin = `${userCoords.latitude},${userCoords.longitude}`;
        } else if (locationA && locationA.trim() !== '' && locationA.toLowerCase() !== 'my current location') {
            origin = locationA;
        } else {
            origin = 'Charing Cross, London, UK';
        }
        url = `https://maps.google.com/maps?saddr=${encodeURIComponent(origin)}&daddr=${venue.location.latitude},${venue.location.longitude}&output=embed`;
        title = `Directions to ${venue.name}`;
    } else {
        url = `https://maps.google.com/maps?q=${venue.location.latitude},${venue.location.longitude}&z=15&output=embed`;
        title = venue.name;
    }
    
    setMapModalData({ url, title });
  }, [locationA, userCoords]);
  
  const handleGroundingLinkClick = (e: React.MouseEvent, uri: string, title: string) => {
    e.preventDefault();
    const embedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(title)}&z=15&output=embed`;
    setMapModalData({ url: embedUrl, title });
  };

  const handleShareResults = useCallback(async () => {
    if (venues.length === 0) return;

    const topVenues = venues.slice(0, 3);
    const summary = topVenues.map((v, i) => `${i + 1}. ${v.name} - ${v.fairness}`).join('\n\n');

    const shareText = `Meeting point suggestions for a trip between "${locationA}" and "${locationB}":\n\n${summary}\n\nFind your own fair meeting point with MeetApp London!`;

    const shareData = {
      title: 'MeetApp London - Meeting Point Suggestions',
      text: shareText,
      url: window.location.href,
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
      navigator.clipboard.writeText(shareText).then(() => {
        setShareConfirmation('Copied!');
        setTimeout(() => setShareConfirmation(''), 2000);
      }).catch(err => {
        console.error('Failed to copy link:', err);
        setShareConfirmation('Failed to copy');
        setTimeout(() => setShareConfirmation(''), 2000);
      });
    }
  }, [venues, locationA, locationB]);

  return (
    <div className="min-h-screen bg-[#F2F5F9] text-gray-900 font-sans selection:bg-blue-200">
      {showTutorial && <TutorialOverlay onClose={handleCloseTutorial} />}
      <div className="container mx-auto p-4 md:p-6 max-w-6xl">
        <header className="w-full max-w-xl mx-auto bg-blue-50/60 rounded-[32px] p-6 md:p-8 mb-8 backdrop-blur-sm border border-white/50 shadow-sm">
            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 text-center mb-3 tracking-tight">
              MeetApp London
            </h1>
            <p className="text-gray-600 font-medium text-center mb-8 text-base md:text-lg">Find the fairest meeting point by public transport.</p>

            <div className="relative space-y-0">
              <div className="absolute left-7 top-12 bottom-12 w-0.5 bg-gray-300 border-l-2 border-dotted border-gray-400 z-0 hidden md:block" style={{left: '1.8rem'}}></div>
              
              <div className="relative z-10 space-y-4">
                <LocationInput
                  id="locationA"
                  value={locationA}
                  onChange={(e) => setLocationA(e.target.value)}
                  placeholder="Start location (e.g. Waterloo)"
                  iconType="start"
                  onGeolocate={geolocateUser}
                  isGeolocating={isGeolocating}
                />
                <LocationInput
                  id="locationB"
                  value={locationB}
                  onChange={(e) => setLocationB(e.target.value)}
                  placeholder="Destination or friend's location"
                  iconType="destination"
                />
              </div>
            </div>

            <div className="mt-8">
                <h3 className="text-sm font-bold text-gray-500 mb-3 text-center uppercase tracking-wider">Transport Modes</h3>
                <div className="flex flex-wrap justify-center gap-2">
                  {availableTransitModes.map(mode => {
                    const isSelected = transitPreferences.includes(mode);
                    return (
                      <button
                        key={mode}
                        onClick={() => handlePreferenceChange(mode)}
                        aria-pressed={isSelected}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl transition-all duration-200 text-sm font-bold border-2 ${
                          isSelected 
                            ? 'bg-blue-100 text-blue-900 border-transparent hover:bg-blue-200 shadow-sm' 
                            : 'bg-transparent text-gray-600 border-gray-300 hover:bg-white hover:border-gray-400'
                        }`}
                      >
                        <span className={isSelected ? 'text-blue-900' : 'text-gray-500'}>{transitModeIcons[mode]}</span>
                        <span>{mode}</span>
                      </button>
                    );
                  })}
                </div>
            </div>
            
            <div className="mt-8">
              <button
                onClick={handleFindMeetingPoint}
                disabled={isLoading}
                className="w-full bg-blue-600 text-white font-bold text-lg h-14 md:h-16 px-6 rounded-full hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-600/30 transition-all shadow-md hover:shadow-lg disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center justify-center gap-3 transform active:scale-[0.98]"
              >
                {isLoading ? (
                  <>
                    <LoadingIcon />
                    Finding Best Spot...
                  </>
                ) : (
                  <>
                    <SearchIcon className="w-6 h-6" />
                    Find Meeting Point
                  </>
                )}
              </button>
            </div>
        </header>

        {savedVenues.length > 0 && (
          <section className="mt-12 max-w-5xl mx-auto">
            <div className="bg-white rounded-[28px] shadow-sm p-8 border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex-shrink-0 w-12 h-12 bg-blue-100 text-blue-900 rounded-full flex items-center justify-center">
                  <BookmarksIcon className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Saved Places</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {savedVenues.map((venue, index) => (
                  <VenueCard
                    key={`saved-${venue.place_id}-${index}`}
                    venue={venue}
                    isSaved={true}
                    onRemove={handleRemoveVenue}
                    onViewOnMap={handleViewOnMap}
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        <main className="mt-10 pb-32">
          {error && (
            <div className="max-w-lg mx-auto bg-red-50 border border-red-100 text-red-900 px-6 py-5 rounded-[24px] relative flex items-start gap-3 shadow-sm mb-8" role="alert">
              <ErrorIcon className="w-6 h-6 mt-0.5" />
              <div>
                <strong className="font-bold text-lg block mb-1">Unable to find places</strong>
                <span className="text-base font-medium opacity-90">{error}</span>
              </div>
            </div>
          )}

          {isLoading && (
            <div className="text-center mt-12">
                <div className="inline-block animate-spin rounded-full h-14 w-14 border-[4px] border-gray-200 border-t-blue-600"></div>
                <p className="mt-6 text-xl font-bold text-gray-700">Calculating routes...</p>
                <p className="text-base font-medium text-gray-400 mt-2">Analyzing transport links between locations</p>
            </div>
          )}

          {hasSearched && !isLoading && venues.length === 0 && !error && (
            <div className="max-w-lg mx-auto text-center py-16 px-6 bg-white rounded-[32px] shadow-sm border border-gray-100">
                <div className="flex justify-center items-center mx-auto w-20 h-20 bg-gray-50 rounded-full mb-6">
                    <SearchIcon className="w-10 h-10 text-gray-400" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">No Meeting Points Found</h2>
                <p className="text-gray-500 font-medium text-lg leading-relaxed">
                    We couldn't find any suitable spots halfway. Try adjusting your locations or enabling more transit modes.
                </p>
            </div>
          )}
          
          {venues.length > 0 && !isLoading && (
            <div className="max-w-5xl mx-auto">
              <div className="flex flex-col md:flex-row justify-between md:items-center mb-8 gap-5">
                <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Suggested Meeting Points</h2>
                <div className="flex items-center gap-3 self-end md:self-auto flex-wrap justify-end">
                  <VenueFilter 
                    types={venueTypes} 
                    selectedType={selectedVenueType} 
                    onChange={(e) => setSelectedVenueType(e.target.value)}
                  />
                   <button
                      onClick={handleShareResults}
                      className={`flex items-center gap-2 px-6 py-3 text-sm font-bold rounded-full transition-colors shadow-sm ${
                        shareConfirmation 
                          ? 'bg-green-100 text-green-800 border-green-200 cursor-default'
                          : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                      }`}
                      aria-label="Share results"
                      disabled={!!shareConfirmation}
                  >
                      {shareConfirmation ? <CheckIcon className="w-5 h-5" /> : <ShareIcon className="w-5 h-5" />}
                      <span>{shareConfirmation || 'Share'}</span>
                  </button>
                </div>
              </div>
              
              {filteredVenues.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {filteredVenues.map((venue, index) => {
                    const isSaved = savedVenueIds.has(venue.place_id);
                    return (
                      <VenueCard 
                        key={`${venue.place_id || 'venue'}-${index}`} 
                        venue={venue}
                        onSave={handleSaveVenue}
                        onRemove={handleRemoveVenue}
                        isSaved={isSaved}
                        onViewOnMap={handleViewOnMap}
                      />
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-16 px-6 bg-white rounded-[32px] shadow-sm border border-gray-100">
                    <p className="text-gray-600 font-medium text-lg">No venues match the "<strong className="text-gray-900">{selectedVenueType}</strong>" filter.</p>
                </div>
              )}

              {groundingChunks.length > 0 && (
                 <div className="mt-16 pt-8 border-t border-gray-200">
                    <div className="flex items-start gap-3 text-sm text-gray-500">
                        <div className="mt-0.5 w-full">
                           <span className="font-bold text-gray-700 uppercase tracking-wider text-xs block mb-2">Source: Google Maps</span>
                           <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {groundingChunks.map((chunk, index) => (
                                chunk.maps?.uri && (
                                  <li key={index}>
                                    <a 
                                        href={chunk.maps.uri} 
                                        onClick={(e) => handleGroundingLinkClick(e, chunk.maps.uri, chunk.maps.title)}
                                        className="flex items-center gap-2 p-3 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all text-gray-700 font-medium hover:text-blue-700"
                                    >
                                      <span className="truncate">{chunk.maps.title}</span>
                                      <ExternalLinkIcon className="w-4 h-4 text-gray-400 flex-shrink-0 ml-auto" />
                                    </a>
                                  </li>
                                )
                              ))}
                            </ul>
                        </div>
                    </div>
                 </div>
              )}
            </div>
          )}
        </main>
      </div>
      
      {/* FAB (Floating Action Button) - Material Design 3 Large FAB style */}
      <div className="fixed bottom-6 right-6 z-30">
          <button
              onClick={() => setIsChatOpen(!isChatOpen)}
              className="group flex items-center gap-3 bg-blue-100 text-blue-900 rounded-[24px] py-4 pl-5 pr-7 shadow-lg hover:shadow-xl hover:bg-blue-200 focus:outline-none focus:ring-4 focus:ring-blue-500/30 transition-all active:scale-95"
              aria-label="Open chatbot"
          >
              <div className="w-8 h-8 flex items-center justify-center">
                  <ChatIcon className="w-6 h-6" />
              </div>
              <span className="font-bold text-lg">Assistant</span>
          </button>
      </div>

      <Chatbot isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} userCoords={userCoords} />
      {mapModalData && <MapModal url={mapModalData.url} title={mapModalData.title} onClose={() => setMapModalData(null)} />}
    </div>
  );
};

export default App;
