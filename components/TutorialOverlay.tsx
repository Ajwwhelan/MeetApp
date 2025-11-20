
import React from 'react';
import { TripOriginIcon, SearchIcon, ChatIcon, PublicTransportIcon } from './icons';

interface TutorialOverlayProps {
    onClose: () => void;
}

const TutorialOverlay: React.FC<TutorialOverlayProps> = ({ onClose }) => {
    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4 backdrop-blur-sm"
            aria-modal="true"
            role="dialog"
        >
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md relative transform transition-all animate-fade-in-up overflow-hidden flex flex-col border border-gray-100">
                <div className="p-8 pb-6">
                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-google-sans font-bold text-gray-900 mb-2">Welcome to MeetApp London!</h2>
                        <p className="text-gray-600 leading-relaxed">Your smart guide to finding the perfect meeting spot.</p>
                        
                        <h3 className="mt-6 text-sm font-bold text-gray-500 uppercase tracking-wider">How to get started:</h3>
                    </div>

                    <div className="space-y-6">
                        <div className="flex items-start gap-4 group">
                            <div className="flex-shrink-0 w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                                <TripOriginIcon className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="font-semibold text-gray-900 text-base">1. Enter Locations</h4>
                                <p className="text-gray-600 text-sm mt-1 leading-snug">Type in two start points, or use your current location.</p>
                            </div>
                        </div>
                        
                        <div className="flex items-start gap-4 group">
                             <div className="flex-shrink-0 w-10 h-10 bg-red-50 text-red-600 rounded-full flex items-center justify-center group-hover:bg-red-100 transition-colors">
                                <PublicTransportIcon className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="font-semibold text-gray-900 text-base">2. Choose Transport</h4>
                                <p className="text-gray-600 text-sm mt-1 leading-snug">Select your preferred public transit modes.</p>
                            </div>
                        </div>
                        
                        <div className="flex items-start gap-4 group">
                            <div className="flex-shrink-0 w-10 h-10 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center group-hover:bg-amber-100 transition-colors">
                                <SearchIcon className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="font-semibold text-gray-900 text-base">3. Find Your Spot</h4>
                                <p className="text-gray-600 text-sm mt-1 leading-snug">Hit the button to get AI-powered venue suggestions.</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4 group">
                            <div className="flex-shrink-0 w-10 h-10 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
                                <ChatIcon className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="font-semibold text-gray-900 text-base">4. Ask for Tips</h4>
                                <p className="text-gray-600 text-sm mt-1 leading-snug">Use the chat assistant for extra London-based advice.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-6 pt-2 bg-white">
                    <button
                        onClick={onClose}
                        className="w-full bg-blue-700 text-white font-semibold text-lg py-3 px-6 rounded-full hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-700/30 transition-all shadow-md hover:shadow-lg active:scale-[0.98]"
                        aria-label="Close tutorial and start using the app"
                    >
                        Let's Go!
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TutorialOverlay;
