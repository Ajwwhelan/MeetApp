
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { findMeetingPoints } from './services/geminiService';
import { Venue, GroundingChunk } from './types';
import LocationInput from './components/LocationInput';
import VenueCard from './components/VenueCard';
import Chatbot from './components/Chatbot';
import { ChatIcon, SearchIcon, ErrorIcon, LoadingIcon, ShareIcon, CheckIcon, BookmarksIcon } from './components/icons';
import VenueFilter from './components/VenueFilter';
import TutorialOverlay from './components/TutorialOverlay';

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

  const savedVenueIds = useMemo(() => new Set(savedVenues.map(v => v.place_id)), [savedVenues]);

  const availableTransitModes = ['Tube', 'Bus', 'DLR', 'Overground', 'National Rail', 'Tram'];
  
  const transitModeIcons: { [key: string]: string } = {
    'Tube': 'subway',
    'Bus': 'directions_bus',
    'DLR': 'commute',
    'Overground': 'directions_railway',
    'National Rail': 'train',
    'Tram': 'tram',
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
    <div className="min-h-screen bg-gray-100 text-gray-800 font-sans">
      {showTutorial && <TutorialOverlay onClose={handleCloseTutorial} />}
      <div className="container mx-auto p-4 md:p-6">
        <header className="w-full max-w-lg mx-auto bg-white rounded-xl shadow-lg p-6">
            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 text-center">
              <span className="bg-gradient-to-r from-blue-600 to-purple-500 bg-clip-text text-transparent">MeetApp</span>
              <span className="text-gray-800"> London</span>
            </h1>
            <p className="mt-3 text-lg text-gray-600 text-center">Find the fairest meeting point by public transport.</p>

            <div className="mt-6 space-y-4">
              <LocationInput
                id="locationA"
                value={locationA}
                onChange={(e) => setLocationA(e.target.value)}
                placeholder="e.g., Waterloo Station"
                iconType="start"
                onGeolocate={geolocateUser}
                isGeolocating={isGeolocating}
              />
              <LocationInput
                id="locationB"
                value={locationB}
                onChange={(e) => setLocationB(e.target.value)}
                placeholder="e.g., Shoreditch High Street"
                iconType="destination"
              />
            </div>

            <div className="mt-6">
                <h3 className="text-base font-medium text-gray-700 mb-3 text-center">Preferred Transit Modes</h3>
                <div className="flex flex-wrap justify-center gap-2">
                  {availableTransitModes.map(mode => {
                    const isSelected = transitPreferences.includes(mode);
                    return (
                      <button
                        key={mode}
                        onClick={() => handlePreferenceChange(mode)}
                        aria-pressed={isSelected}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                          isSelected 
                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm' 
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                        }`}
                      >
                        <span className="material-symbols-outlined !text-lg">{transitModeIcons[mode]}</span>
                        <span>{mode}</span>
                      </button>
                    );
                  })}
                </div>
            </div>
            
            <div className="mt-6">
              <button
                onClick={handleFindMeetingPoint}
                disabled={isLoading}
                className="w-full bg-blue-600 text-white font-medium text-lg py-3 px-6 rounded-full hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-500/50 transition-all shadow-md hover:shadow-lg disabled:bg-blue-600/50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <LoadingIcon />
                    Finding...
                  </>
                ) : (
                  <>
                    <SearchIcon />
                    Find Meeting Point
                  </>
                )}
              </button>
            </div>
        </header>

        {savedVenues.length > 0 && (
          <section className="mt-8 max-w-5xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex-shrink-0 w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                  <BookmarksIcon />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">My Saved Meeting Points</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {savedVenues.map((venue, index) => (
                  <VenueCard
                    key={`saved-${venue.place_id}-${index}`}
                    venue={venue}
                    isSaved={true}
                    onRemove={handleRemoveVenue}
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        <main className="mt-8">
          {error && (
            <div className="max-w-lg mx-auto bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative flex items-start gap-3 shadow-sm" role="alert">
              <ErrorIcon />
              <div>
                <strong className="font-bold">Error: </strong>
                <span className="block sm:inline">{error}</span>
              </div>
            </div>
          )}

          {isLoading && (
            <div className="text-center mt-10">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="mt-4 text-lg text-gray-600">Calculating routes and finding venues...</p>
            </div>
          )}

          {hasSearched && !isLoading && venues.length === 0 && !error && (
            <div className="max-w-lg mx-auto text-center py-10 px-4 bg-white rounded-lg shadow-md border border-gray-200">
                <div className="flex justify-center items-center mx-auto w-16 h-16 bg-blue-100 rounded-full">
                    <span className="material-symbols-outlined text-4xl text-blue-600">search_off</span>
                </div>
                <h2 className="mt-4 text-2xl font-bold text-gray-800">No Meeting Points Found</h2>
                <p className="mt-2 text-gray-600">
                    We couldn't find any suitable spots. Try adjusting your locations or transit preferences.
                </p>
            </div>
          )}
          
          {venues.length > 0 && !isLoading && (
            <div className="max-w-5xl mx-auto">
              <div className="flex flex-col md:flex-row justify-between md:items-center mb-6 gap-4">
                <h2 className="text-2xl font-bold text-gray-800">Suggested Meeting Points</h2>
                <div className="flex items-center gap-2 self-end md:self-auto">
                  <button
                      onClick={handleShareResults}
                      className={`flex items-center gap-2 px-4 py-3 text-base font-medium rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                        shareConfirmation 
                          ? 'bg-green-100 text-green-700 border-2 border-green-200 cursor-default'
                          : 'bg-white text-blue-600 border-2 border-gray-200 hover:bg-gray-100'
                      }`}
                      aria-label="Share results"
                      disabled={!!shareConfirmation}
                  >
                      {shareConfirmation ? <CheckIcon /> : <ShareIcon />}
                      <span>{shareConfirmation || 'Share Results'}</span>
                  </button>
                  <VenueFilter 
                    types={venueTypes} 
                    selectedType={selectedVenueType} 
                    onChange={(e) => setSelectedVenueType(e.target.value)}
                  />
                </div>
              </div>
              
              {filteredVenues.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredVenues.map((venue, index) => {
                    const isSaved = savedVenueIds.has(venue.place_id);
                    return (
                      <VenueCard 
                        key={`${venue.place_id || 'venue'}-${index}`} 
                        venue={venue}
                        onSave={handleSaveVenue}
                        onRemove={handleRemoveVenue}
                        isSaved={isSaved}
                      />
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-10 px-4 bg-white rounded-lg shadow-md">
                    <p className="text-gray-600">No venues match the "<strong>{selectedVenueType}</strong>" filter.</p>
                </div>
              )}

              {groundingChunks.length > 0 && (
                 <div className="mt-8 p-4 bg-gray-200 rounded-lg text-base text-gray-600 border border-gray-300 max-w-lg mx-auto">
                    <h3 className="font-medium text-gray-800 mb-2">Powered by Google Maps</h3>
                    <p>Results are based on public data. For more details, visit:</p>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      {groundingChunks.map((chunk, index) => (
                        chunk.maps?.uri && (
                          <li key={index}>
                            <a href={chunk.maps.uri} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                              {chunk.maps.title}
                            </a>
                          </li>
                        )
                      ))}
                    </ul>
                 </div>
              )}
            </div>
          )}
        </main>
      </div>
      
      <div className="fixed bottom-6 right-6 z-20">
          <button
              onClick={() => setIsChatOpen(!isChatOpen)}
              className="bg-white text-blue-600 rounded-full p-4 shadow-lg hover:bg-gray-100 focus:outline-none focus:ring-4 focus:ring-blue-600/50 transition-transform transform hover:scale-110 border border-gray-200"
              aria-label="Open chatbot"
          >
              <ChatIcon />
          </button>
      </div>

      <Chatbot isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} userCoords={userCoords} />

    </div>
  );
};

export default App;
