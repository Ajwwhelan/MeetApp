
import React from 'react';
import { StartIcon, SearchIcon, ChatIcon, TflIcon } from './icons';

interface TutorialOverlayProps {
    onClose: () => void;
}

const TutorialOverlay: React.FC<TutorialOverlayProps> = ({ onClose }) => {
    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4"
            aria-modal="true"
            role="dialog"
        >
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 md:p-8 relative transform transition-all animate-fade-in-up">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900">Welcome to MeetApp London!</h2>
                    <p className="mt-2 text-gray-600">Your smart guide to finding the perfect meeting spot.</p>
                </div>

                <div className="mt-6 space-y-4 text-left">
                    <h3 className="font-medium text-lg text-gray-800 text-center">How to get started:</h3>
                    
                    <div className="flex items-start gap-4 p-3 bg-gray-50 rounded-lg">
                        <div className="flex-shrink-0 w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                            <StartIcon />
                        </div>
                        <div>
                            <h4 className="font-semibold text-gray-800">1. Enter Locations</h4>
                            <p className="text-gray-600">Type in two start points, or use your current location.</p>
                        </div>
                    </div>
                    
                    <div className="flex items-start gap-4 p-3 bg-gray-50 rounded-lg">
                         <div className="flex-shrink-0 w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                            <TflIcon />
                        </div>
                        <div>
                            <h4 className="font-semibold text-gray-800">2. Choose Transport</h4>
                            <p className="text-gray-600">Select your preferred public transit modes.</p>
                        </div>
                    </div>
                    
                    <div className="flex items-start gap-4 p-3 bg-gray-50 rounded-lg">
                        <div className="flex-shrink-0 w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                            <SearchIcon />
                        </div>
                        <div>
                            <h4 className="font-semibold text-gray-800">3. Find Your Spot</h4>
                            <p className="text-gray-600">Hit the button to get AI-powered venue suggestions.</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-4 p-3 bg-gray-50 rounded-lg">
                        <div className="flex-shrink-0 w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                            <ChatIcon />
                        </div>
                        <div>
                            <h4 className="font-semibold text-gray-800">4. Ask for Tips</h4>
                            <p className="text-gray-600">Use the chat assistant for extra London-based advice.</p>
                        </div>
                    </div>
                </div>

                <div className="mt-8">
                    <button
                        onClick={onClose}
                        className="w-full bg-blue-600 text-white font-medium py-3 px-6 rounded-full hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-500/50 transition-all shadow-md hover:shadow-lg"
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
