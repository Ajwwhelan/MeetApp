import React from 'react';
import { TripOriginIcon, SearchIcon, ChatIcon, PublicTransportIcon } from './icons';

interface TutorialOverlayProps {
    onClose: () => void;
}

const TutorialOverlay: React.FC<TutorialOverlayProps> = ({ onClose }) => {
    return (
        <div 
            className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-6 backdrop-blur-md"
            aria-modal="true"
            role="dialog"
        >
            <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-sm relative transform transition-all animate-fade-in-up overflow-hidden flex flex-col border border-white/20">
                <div className="p-8 pb-4 text-center">
                    <h2 className="text-3xl font-extrabold text-gray-900 mb-3 tracking-tight">Welcome to MeetApp</h2>
                    <p className="text-gray-600 text-lg font-medium leading-relaxed">Your smart guide to finding the perfect meeting spot in London.</p>
                </div>

                <div className="px-6 space-y-3">
                    <div className="flex items-center gap-5 p-4 bg-gray-50/50 hover:bg-gray-100 rounded-2xl transition-colors border border-transparent hover:border-gray-200">
                        <div className="flex-shrink-0 w-12 h-12 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center shadow-sm">
                            <TripOriginIcon className="w-6 h-6" />
                        </div>
                        <div className="text-left">
                            <h4 className="font-bold text-gray-900 text-base">Enter Locations</h4>
                            <p className="text-gray-500 text-sm font-medium mt-0.5">Start points or current location.</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-5 p-4 bg-gray-50/50 hover:bg-gray-100 rounded-2xl transition-colors border border-transparent hover:border-gray-200">
                            <div className="flex-shrink-0 w-12 h-12 bg-purple-100 text-purple-800 rounded-full flex items-center justify-center shadow-sm">
                            <PublicTransportIcon className="w-6 h-6" />
                        </div>
                        <div className="text-left">
                            <h4 className="font-bold text-gray-900 text-base">Choose Transport</h4>
                            <p className="text-gray-500 text-sm font-medium mt-0.5">Select preferred transit modes.</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-5 p-4 bg-gray-50/50 hover:bg-gray-100 rounded-2xl transition-colors border border-transparent hover:border-gray-200">
                        <div className="flex-shrink-0 w-12 h-12 bg-amber-100 text-amber-800 rounded-full flex items-center justify-center shadow-sm">
                            <SearchIcon className="w-6 h-6" />
                        </div>
                        <div className="text-left">
                            <h4 className="font-bold text-gray-900 text-base">Find Your Spot</h4>
                            <p className="text-gray-500 text-sm font-medium mt-0.5">Get AI-powered suggestions.</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-5 p-4 bg-gray-50/50 hover:bg-gray-100 rounded-2xl transition-colors border border-transparent hover:border-gray-200">
                        <div className="flex-shrink-0 w-12 h-12 bg-indigo-100 text-indigo-800 rounded-full flex items-center justify-center shadow-sm">
                            <ChatIcon className="w-6 h-6" />
                        </div>
                        <div className="text-left">
                            <h4 className="font-bold text-gray-900 text-base">Ask Assistant</h4>
                            <p className="text-gray-500 text-sm font-medium mt-0.5">Get extra tips via chat or voice.</p>
                        </div>
                    </div>
                </div>

                <div className="p-8">
                    <button
                        onClick={onClose}
                        className="w-full bg-blue-600 text-white font-bold text-lg py-4 px-6 rounded-full hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-600/30 transition-all shadow-md active:scale-[0.98]"
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