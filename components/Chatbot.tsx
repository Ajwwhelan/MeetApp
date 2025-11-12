
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, Chat } from '@google/genai';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ChatMessage } from '../types';
import { CloseIcon, SendIcon, UserIcon, ExternalLinkIcon, BotIcon } from './icons';
import MapModal from './MapModal';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

interface ChatbotProps {
    isOpen: boolean;
    onClose: () => void;
    userCoords: { latitude: number; longitude: number; } | null;
}

const Chatbot: React.FC<ChatbotProps> = ({ isOpen, onClose, userCoords }) => {
    const [chat, setChat] = useState<Chat | null>(null);
    const [history, setHistory] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [mapUrl, setMapUrl] = useState<string | null>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);

    const initChat = useCallback(() => {
        const newChat = ai.chats.create({
            model: 'gemini-2.5-flash',
            config: {
                systemInstruction: "You are a helpful assistant for the MeetApp London app. You specialize in London locations, transit, and culture. When a user asks for a list of places (e.g., restaurants, pubs, museums), you MUST format your response as a numbered list. Each item MUST start with a number emoji (1️⃣, 2️⃣, 3️⃣...). The venue name must be a **bolded markdown link** to its Google Maps location. Add a brief, single-paragraph description on a new line below the name. **Crucially, ensure there is a blank line separating each numbered item for readability.**\n\nThe link MUST be a full `https://www.google.com/maps/search/?api=1&query=...` URL. Do not use shortened URLs or links to other websites.\n\nHere is a perfect example:\n\n1️⃣ [**The Folly**](https://www.google.com/maps/search/?api=1&query=The+Folly&query_place_id=ChIJc-Q3jA8bdkgR1lQwn_L0a4I)\nA garden-influenced restaurant and bar with a seasonal menu.\n\n2️⃣ [**Caravan City**](https://www.google.com/maps/search/?api=1&query=Caravan+City&query_place_id=ChIJiQUg_QcbdkgRj8d-2d_e8cI)\nEclectic global cooking in an industrial chic setting.",
                tools: [{ googleMaps: {} }],
                toolConfig: userCoords ? {
                  retrievalConfig: {
                    latLng: {
                      latitude: userCoords.latitude,
                      longitude: userCoords.longitude
                    }
                  }
                } : undefined,
            },
        });
        setChat(newChat);
        setHistory([
            { role: 'model', text: 'Hello! How can I help you plan your London meetup?' }
        ]);
    }, [userCoords]);
    
    useEffect(() => {
      if (isOpen && !chat) {
        initChat();
      }
    }, [isOpen, chat, initChat]);

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [history]);

    const handleSend = async () => {
        if (!input.trim() || !chat) return;

        const userMessage: ChatMessage = { role: 'user', text: input };
        setHistory(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const result = await chat.sendMessageStream({ message: input });
            let text = '';
            setHistory(prev => [...prev, { role: 'model', text: '' }]);
            
            for await (const chunk of result) {
                text += chunk.text;
                setHistory(prev => {
                    const newHistory = [...prev];
                    newHistory[newHistory.length - 1].text = text;
                    return newHistory;
                });
            }
        } catch (error) {
            console.error(error);
            setHistory(prev => [...prev, { role: 'model', text: 'Sorry, I encountered an error. Please try again.' }]);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleLinkClick = (href: string) => {
        try {
            const url = new URL(href);
            if (url.hostname.includes('google.com') && url.pathname.includes('/maps/search')) {
                const query = url.searchParams.get('query');

                if (query) {
                    const embedUrl = `https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed`;
                    setMapUrl(embedUrl);
                } else {
                    window.open(href, '_blank', 'noopener,noreferrer');
                }
            } else {
                window.open(href, '_blank', 'noopener,noreferrer');
            }
        } catch (error) {
            console.error('Invalid URL or link handling error:', href, error);
            window.open(href, '_blank', 'noopener,noreferrer');
        }
    };


    if (!isOpen) return null;

    return (
        <>
            <div className="fixed inset-0 bg-black bg-opacity-30 z-40" onClick={onClose}></div>
            <div className="fixed bottom-0 right-0 md:bottom-6 md:right-6 w-full h-full md:w-[400px] md:h-[600px] bg-white text-gray-800 rounded-none md:rounded-2xl shadow-2xl flex flex-col transform transition-all duration-300 z-50 border border-gray-200" onClick={(e) => e.stopPropagation()}>
                <header className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50 rounded-t-none md:rounded-t-2xl">
                    <div className="flex items-center gap-3">
                       <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white"><BotIcon/></div>
                       <h2 className="text-lg font-medium text-gray-800">MeetApp Assistant</h2>
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800 p-1 rounded-full hover:bg-gray-200">
                        <CloseIcon />
                    </button>
                </header>

                <div ref={chatContainerRef} className="flex-1 p-4 overflow-y-auto custom-scrollbar bg-gray-100">
                    {history.map((msg, index) => (
                        <div key={index} className={`flex items-start gap-3 my-4 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                            {msg.role === 'model' && (
                                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm border border-gray-200">
                                  <BotIcon/>
                                </div>
                            )}
                            <div className={`max-w-xs md:max-w-sm px-4 py-2.5 rounded-2xl shadow-sm ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white text-gray-800 rounded-bl-none'}`}>
                                <div className="prose prose-sm max-w-none prose-a:text-blue-600 hover:prose-a:underline">
                                  <ReactMarkdown
                                      remarkPlugins={[remarkGfm]}
                                      components={{
                                          a: ({ href, children }) => (
                                              <button
                                                  onClick={(e) => {
                                                      e.preventDefault();
                                                      handleLinkClick(href || '');
                                                  }}
                                                  className="inline-flex items-center gap-1 text-left"
                                              >
                                                  {children} <ExternalLinkIcon />
                                              </button>
                                          ),
                                           p: ({children}) => <p className="mb-2 last:mb-0">{children}</p>
                                      }}
                                  >
                                      {msg.text}
                                  </ReactMarkdown>
                                </div>
                            </div>
                            {msg.role === 'user' && (
                                <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center flex-shrink-0">
                                   <UserIcon />
                                </div>
                            )}
                        </div>
                    ))}
                    {isLoading && (
                         <div className="flex items-start gap-3 my-4">
                             <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm border border-gray-200">
                                 <BotIcon/>
                             </div>
                             <div className="max-w-xs md:max-w-sm px-4 py-2 rounded-2xl bg-white text-gray-800 rounded-bl-none flex items-center">
                                 <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                 <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s] mx-1"></div>
                                 <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                             </div>
                         </div>
                    )}
                </div>

                <footer className="p-3 border-t border-gray-200 bg-white rounded-b-none md:rounded-b-2xl">
                    <div className="relative">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSend()}
                            placeholder="Ask about places in London..."
                            className="w-full py-2.5 pl-4 pr-12 bg-gray-100 border-2 border-gray-200 text-gray-900 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-500"
                            disabled={isLoading}
                        />
                        <button
                            onClick={handleSend}
                            disabled={isLoading || !input.trim()}
                            className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-600 text-white rounded-full p-2 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                            aria-label="Send message"
                        >
                            <SendIcon />
                        </button>
                    </div>
                </footer>
            </div>
            {mapUrl && <MapModal url={mapUrl} onClose={() => setMapUrl(null)} />}
        </>
    );
};

export default Chatbot;