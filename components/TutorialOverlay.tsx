
import React from 'react';
import { TripOriginIcon, SearchIcon, ChatIcon, PublicTransportIcon } from './icons';

interface TutorialOverlayProps {
    onClose: () => void;
}

const TutorialOverlay: React.FC<TutorialOverlayProps> = ({ onClose }) => {
    return (
        <div 
            className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4 backdrop-blur-sm"
            aria-modal="true"
            role="dialog"
        >
            <div className="bg-white rounded-[28px] shadow-2xl w-full max-w-sm relative transform transition-all animate-fade-in-up overflow-hidden flex flex-col">
                <div className="p-8 pb-4 text-center">
                    <h2 className="text-2xl font-google-sans font-medium text-gray-900 mb-2">Welcome to MeetApp</h2>
                    <p className="text-gray-600 text-base leading-relaxed">Your smart guide to finding the perfect meeting spot in London.</p>
                </div>

                <div className="px-6 space-y-2">
                    <div className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-xl transition-colors">
                        <div className="flex-shrink-0 w-10 h-10 bg-blue-100 text-blue-900 rounded-full flex items-center justify-center">
                            <TripOriginIcon className="w-5 h-5" />
                        </div>
                        <div className="text-left">
                            <h4 className="font-medium text-gray-900 text-sm">Enter Locations</h4>
                            <p className="text-gray-500 text-xs mt-0.5">Start points or current location.</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-xl transition-colors">
                            <div className="flex-shrink-0 w-10 h-10 bg-purple-100 text-purple-900 rounded-full flex items-center justify-center">
                            <PublicTransportIcon className="w-5 h-5" />
                        </div>
                        <div className="text-left">
                            <h4 className="font-medium text-gray-900 text-sm">Choose Transport</h4>
                            <p className="text-gray-500 text-xs mt-0.5">Select preferred transit modes.</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-xl transition-colors">
                        <div className="flex-shrink-0 w-10 h-10 bg-amber-100 text-amber-900 rounded-full flex items-center justify-center">
                            <SearchIcon className="w-5 h-5" />
                        </div>
                        <div className="text-left">
                            <h4 className="font-medium text-gray-900 text-sm">Find Your Spot</h4>
                            <p className="text-gray-500 text-xs mt-0.5">Get AI-powered suggestions.</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-xl transition-colors">
                        <div className="flex-shrink-0 w-10 h-10 bg-indigo-100 text-indigo-900 rounded-full flex items-center justify-center">
                            <ChatIcon className="w-5 h-5" />
                        </div>
                        <div className="text-left">
                            <h4 className="font-medium text-gray-900 text-sm">Ask Assistant</h4>
                            <p className="text-gray-500 text-xs mt-0.5">Get extra tips via chat or voice.</p>
                        </div>
                    </div>
                </div>

                <div className="p-6">
                    <button
                        onClick={onClose}
                        className="w-full bg-blue-600 text-white font-medium text-base py-3 px-6 rounded-full hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-600/20 transition-all shadow-sm active:scale-[0.98]"
                        aria-label="Close tutorial and start using the app"
                    >
                        Let's Go
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TutorialOverlay;
