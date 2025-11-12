
import React, { useState, useCallback, useEffect } from 'react';
import { findMeetingPoints } from './services/geminiService';
import { Venue, GroundingChunk } from './types';
import LocationInput from './components/LocationInput';
import VenueCard from './components/VenueCard';
import Chatbot from './components/Chatbot';
import { ChatIcon, SearchIcon, ErrorIcon, LoadingIcon } from './components/icons';

const App: React.FC = () => {
  const [locationA, setLocationA] = useState<string>('Kings Cross Station, London');
  const [locationB, setLocationB] = useState<string>('Canary Wharf Station, London');
  const [venues, setVenues] = useState<Venue[]>([]);
  const [groundingChunks, setGroundingChunks] = useState<GroundingChunk[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [userCoords, setUserCoords] = useState<{ latitude: number; longitude: number; } | null>(null);
  const [isGeolocating, setIsGeolocating] = useState<boolean>(true);

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
    geolocateUser();
  }, [geolocateUser]);

  const handleFindMeetingPoint = useCallback(async () => {
    if (!locationA || !locationB) {
      setError('Please enter both locations.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setVenues([]);
    setGroundingChunks([]);

    try {
      const result = await findMeetingPoints(locationA, locationB, userCoords);
      if (result && result.venues) {
        setVenues(result.venues);
        setGroundingChunks(result.groundingChunks || []);
      } else {
        setError('Could not find suitable meeting points. Try different locations.');
      }
    } catch (e: any) {
      setError(`An error occurred: ${e.message}. Please check your API key and try again.`);
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [locationA, locationB, userCoords]);

  return (
    <div className="min-h-screen bg-gray-100 text-gray-800 font-sans">
      <div className="container mx-auto p-4 md:p-6">
        <header className="w-full max-w-lg mx-auto bg-white rounded-xl shadow-lg p-6">
            <h1 className="text-2xl font-bold text-gray-900 text-center">MeetApp London</h1>
            <p className="mt-1 text-gray-600 text-center">Find the fairest meeting point by public transport.</p>

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
              <button
                onClick={handleFindMeetingPoint}
                disabled={isLoading}
                className="w-full bg-blue-600 text-white font-medium py-3 px-6 rounded-full hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-500/50 transition-all shadow-md hover:shadow-lg disabled:bg-blue-600/50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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

          {isLoading && !error && venues.length === 0 && (
            <div className="text-center mt-10">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="mt-4 text-gray-600">Calculating routes and finding venues...</p>
            </div>
          )}

          {venues.length > 0 && (
            <div className="max-w-5xl mx-auto">
              <h2 className="text-xl font-bold text-center mb-6 text-gray-800">Suggested Meeting Points</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {venues.map((venue) => (
                  <VenueCard key={venue.place_id} venue={venue} />
                ))}
              </div>
              {groundingChunks.length > 0 && (
                 <div className="mt-8 p-4 bg-gray-200 rounded-lg text-sm text-gray-600 border border-gray-300 max-w-lg mx-auto">
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