
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, Chat, LiveServerMessage, Modality } from '@google/genai';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ChatMessage } from '../types';
import { CloseIcon, SendIcon, UserIcon, ExternalLinkIcon, BotIcon, DirectionsIcon, MapIcon, CopyIcon, CheckIcon, MicIcon, MicOffIcon, WaveformIcon, VolumeUpIcon, StopCircleIcon } from './icons';
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

// Audio helper functions
function base64ToBytes(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}

function bytesToBase64(bytes: Uint8Array): string {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

async function decodeAudioData(
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number,
    numChannels: number,
): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
        const channelData = buffer.getChannelData(channel);
        for (let i = 0; i < frameCount; i++) {
            channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
        }
    }
    return buffer;
}


const Chatbot: React.FC<ChatbotProps> = ({ isOpen, onClose, userCoords }) => {
    const [chat, setChat] = useState<Chat | null>(null);
    const [history, setHistory] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [mapModalData, setMapModalData] = useState<{url: string, title?: string} | null>(null);
    const [copiedLink, setCopiedLink] = useState<string | null>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);
    
    // Live API State & Refs
    const [isLive, setIsLive] = useState(false);
    const [isConnectingLive, setIsConnectingLive] = useState(false);
    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const sessionPromiseRef = useRef<Promise<any> | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const inputSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const outputNodeRef = useRef<GainNode | null>(null);
    const nextStartTimeRef = useRef<number>(0);
    const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
    const streamRef = useRef<MediaStream | null>(null);
    const currentInputTranscriptionRef = useRef('');
    const currentOutputTranscriptionRef = useRef('');

    // Dictation & TTS State
    const [isDictating, setIsDictating] = useState(false);
    const [speakingMessageId, setSpeakingMessageId] = useState<number | null>(null);
    const recognitionRef = useRef<any>(null);

    const initChat = useCallback(() => {
        const baseInstruction = "You are a helpful assistant for the MeetApp London app. You specialize in London locations, transit, and culture. When a user asks for a list of places (e.g., restaurants, pubs, museums), you MUST format your response as a markdown-numbered list. For each item, you MUST prepend the venue name with a relevant emoji representing the venue type (e.g., ☕ for a cafe, 🍽️ for a restaurant, 🍺 for a pub, 🌳 for a park, 🏛️ for a museum). The venue name must be a **bolded markdown link** to its Google Maps location. Add a brief, single-paragraph description on a new line below the name. **Crucially, ensure there is a blank line separating each numbered item for readability.**\n\nThe link MUST be a full `https://www.google.com/maps/search/?api=1&query=...` URL. Do not use shortened URLs or links to other websites.";
        
        const example = "\n\nHere is a perfect example:\n\n1. ☕ [**The Folly**](https://www.google.com/maps/search/?api=1&query=The+Folly&query_place_id=ChIJc-Q3jA8bdkgR1lQwn_L0a4I)\nA garden-influenced restaurant and bar with a seasonal menu.\n\n2. 🍽️ [**Caravan City**](https://www.google.com/maps/search/?api=1&query=Caravan+City&query_place_id=ChIJiQUg_QcbdkgRj8d-2d_e8cI)\nEclectic global cooking in an industrial chic setting.";

        let systemInstruction = baseInstruction;
        
        if (userCoords) {
            systemInstruction += `\n\nCONTEXT: The user is currently located at Latitude: ${userCoords.latitude}, Longitude: ${userCoords.longitude}. Use this location to provide relevant distance estimates, walking directions advice, and "near me" recommendations within London.`;
        }
        
        systemInstruction += example;
        
        return systemInstruction;
    }, [userCoords]);

    const startChatSession = useCallback(() => {
         const instruction = initChat();
         const newChat = ai.chats.create({
            model: 'gemini-2.5-flash',
            config: {
                systemInstruction: instruction,
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
    }, [initChat, userCoords]);
    
    useEffect(() => {
      if (isOpen && !chat && !isLive) {
        startChatSession();
      }
    }, [isOpen, chat, isLive, startChatSession]);

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [history]);
    
    // Stop Live Session when component unmounts or modal closes
    useEffect(() => {
        return () => {
            stopLiveSession();
            stopSpeaking();
        };
    }, []);
    
    const stopLiveSession = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        
        if (scriptProcessorRef.current) {
            scriptProcessorRef.current.disconnect();
            scriptProcessorRef.current = null;
        }
        
        if (inputSourceRef.current) {
            inputSourceRef.current.disconnect();
            inputSourceRef.current = null;
        }
        
        if (inputAudioContextRef.current) {
            inputAudioContextRef.current.close();
            inputAudioContextRef.current = null;
        }
        
        if (outputAudioContextRef.current) {
            outputAudioContextRef.current.close();
            outputAudioContextRef.current = null;
        }
        
        audioSourcesRef.current.forEach(source => source.stop());
        audioSourcesRef.current.clear();
        
        if (sessionPromiseRef.current) {
             sessionPromiseRef.current.then(session => {
                 // Trying to close session if method exists or just ignore as connection is cut
                 try {
                     // @ts-ignore
                     if(typeof session.close === 'function') session.close();
                 } catch(e) { console.log('Session close error', e)}
             });
             sessionPromiseRef.current = null;
        }
        
        setIsLive(false);
        setIsConnectingLive(false);
    }, []);

    const startLiveSession = async () => {
        setIsConnectingLive(true);
        try {
            const systemInstruction = initChat();
            
            // Audio setup
            const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 16000});
            const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
            
            inputAudioContextRef.current = inputAudioContext;
            outputAudioContextRef.current = outputAudioContext;
            
            const outputNode = outputAudioContext.createGain();
            outputNode.connect(outputAudioContext.destination);
            outputNodeRef.current = outputNode;
            
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;
            
            // Connect to Live API
            const sessionPromise = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: {
                        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } 
                    },
                    systemInstruction: systemInstruction,
                    // Note: 'tools' with googleMaps are currently causing invalid argument errors in Live API preview
                    outputAudioTranscription: {}, 
                    inputAudioTranscription: {},
                },
                callbacks: {
                    onopen: () => {
                        console.log('Live session opened');
                        setIsLive(true);
                        setIsConnectingLive(false);
                        
                        // Setup Audio Input Stream
                        const source = inputAudioContext.createMediaStreamSource(stream);
                        inputSourceRef.current = source;
                        
                        const scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
                        scriptProcessorRef.current = scriptProcessor;
                        
                        scriptProcessor.onaudioprocess = (e) => {
                            const inputData = e.inputBuffer.getChannelData(0);
                            
                            // Convert Float32 to Int16
                            const l = inputData.length;
                            const int16 = new Int16Array(l);
                            for (let i = 0; i < l; i++) {
                                int16[i] = inputData[i] * 32768;
                            }
                            
                            // Convert to base64 directly
                            const base64Data = bytesToBase64(new Uint8Array(int16.buffer));
                            
                            // Send to model
                            sessionPromise.then(session => {
                                session.sendRealtimeInput({
                                    media: {
                                        mimeType: 'audio/pcm;rate=16000',
                                        data: base64Data
                                    }
                                });
                            });
                        };
                        
                        source.connect(scriptProcessor);
                        scriptProcessor.connect(inputAudioContext.destination); 
                    },
                    onmessage: async (message: LiveServerMessage) => {
                        // Handle Transcriptions
                        if (message.serverContent?.outputTranscription) {
                            const text = message.serverContent.outputTranscription.text;
                            currentOutputTranscriptionRef.current += text;
                            
                             // Update UI with partial transcription
                             setHistory(prev => {
                                const newHistory = [...prev];
                                const lastMsg = newHistory[newHistory.length - 1];
                                if (lastMsg && lastMsg.role === 'model' && lastMsg.isLive) {
                                     lastMsg.text = currentOutputTranscriptionRef.current;
                                     return newHistory;
                                } else {
                                     return [...prev, { role: 'model', text: currentOutputTranscriptionRef.current, isLive: true }];
                                }
                            });
                            
                        } else if (message.serverContent?.inputTranscription) {
                            const text = message.serverContent.inputTranscription.text;
                            currentInputTranscriptionRef.current += text;
                            
                             // Update UI with user transcription
                             setHistory(prev => {
                                const newHistory = [...prev];
                                const lastMsg = newHistory[newHistory.length - 1];
                                if (lastMsg && lastMsg.role === 'user' && lastMsg.isLive) {
                                     lastMsg.text = currentInputTranscriptionRef.current;
                                     return newHistory;
                                } else {
                                     // If the last message was a model message, we are starting a new user turn
                                     if (lastMsg && lastMsg.role === 'model') {
                                         return [...prev, { role: 'user', text: currentInputTranscriptionRef.current, isLive: true }];
                                     }
                                     return [...prev, { role: 'user', text: currentInputTranscriptionRef.current, isLive: true }];
                                }
                            });
                        }

                        if (message.serverContent?.turnComplete) {
                            console.log('Turn complete');
                            currentInputTranscriptionRef.current = '';
                            currentOutputTranscriptionRef.current = '';
                        }

                        // Handle Audio Output
                        const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                        if (base64Audio) {
                            const audioCtx = outputAudioContextRef.current;
                            if (!audioCtx) return;

                            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, audioCtx.currentTime);
                            
                            try {
                                const audioBuffer = await decodeAudioData(
                                    base64ToBytes(base64Audio),
                                    audioCtx,
                                    24000,
                                    1
                                );
                                
                                const source = audioCtx.createBufferSource();
                                source.buffer = audioBuffer;
                                source.connect(outputNodeRef.current!);
                                
                                source.addEventListener('ended', () => {
                                    audioSourcesRef.current.delete(source);
                                });
                                
                                source.start(nextStartTimeRef.current);
                                nextStartTimeRef.current += audioBuffer.duration;
                                audioSourcesRef.current.add(source);
                                
                            } catch (e) {
                                console.error('Error decoding audio', e);
                            }
                        }
                    },
                    onclose: () => {
                         console.log('Live session closed');
                         stopLiveSession();
                    },
                    onerror: (e) => {
                        console.error('Live session error', e);
                        stopLiveSession();
                    }
                }
            });
            
            sessionPromiseRef.current = sessionPromise;

        } catch (error) {
            console.error('Failed to start live session:', error);
            setIsConnectingLive(false);
            setIsLive(false);
        }
    };

    const toggleVoiceMode = () => {
        if (isLive || isConnectingLive) {
            stopLiveSession();
            // Re-initialize text chat to clear state if needed or just continue
            startChatSession();
        } else {
            setChat(null); // Clear text chat session to avoid confusion
            setHistory([{ role: 'model', text: 'Listening... (Start speaking)' }]); // Reset history for voice session or append? Let's reset for clean slate context
            startLiveSession();
        }
    };

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
    
    // --- Dictation & TTS Functions ---
    const handleDictation = () => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert("Speech recognition is not supported in this browser. Please use Chrome or Safari.");
            return;
        }

        if (isDictating) {
            recognitionRef.current?.stop();
            setIsDictating(false);
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = 'en-GB';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
            setIsDictating(true);
        };

        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setInput(prev => prev + (prev ? ' ' : '') + transcript);
        };

        recognition.onerror = (event: any) => {
            console.error('Speech recognition error', event.error);
            setIsDictating(false);
        };

        recognition.onend = () => {
            setIsDictating(false);
        };

        recognitionRef.current = recognition;
        recognition.start();
    };

    const stopSpeaking = () => {
        window.speechSynthesis.cancel();
        setSpeakingMessageId(null);
    };

    const speakMessage = (text: string, id: number) => {
        if (speakingMessageId === id) {
            stopSpeaking();
            return;
        }
        
        stopSpeaking(); // Stop any current speech
        
        // Clean markdown for better speech
        // Remove links [Text](url) -> Text
        let cleanText = text.replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1');
        // Remove bold/italic **Text** -> Text, *Text* -> Text
        cleanText = cleanText.replace(/[*_#`]/g, '');
        // Remove emojis (simple regex, might not catch all but helps)
        cleanText = cleanText.replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, '');

        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.onend = () => setSpeakingMessageId(null);
        utterance.onerror = () => setSpeakingMessageId(null);
        
        setSpeakingMessageId(id);
        window.speechSynthesis.speak(utterance);
    };
    // ---------------------------------
    
    const handleLinkClick = (href: string, linkText?: string) => {
        try {
            const url = new URL(href);
            const isSearch = url.pathname.includes('/maps/search');
            const isDir = url.pathname.includes('/maps/dir');
            
            if (isSearch || isDir) {
                let embedUrl = '';
                let title = linkText || 'Map View';

                if (isSearch) {
                    const query = url.searchParams.get('query');
                    if ((!title || title === 'Map View') && query) {
                        title = query;
                    }
                    if (query) {
                        embedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(query)}&z=15&output=embed`;
                    }
                } else if (isDir) {
                     const destination = url.searchParams.get('destination') || url.searchParams.get('daddr') || 'Destination';
                     const origin = url.searchParams.get('origin') || url.searchParams.get('saddr') || 'London, UK';
                     title = `Directions to ${destination}`;

                     if (destination) {
                         embedUrl = `https://maps.google.com/maps?saddr=${encodeURIComponent(origin)}&daddr=${encodeURIComponent(destination)}&output=embed`;
                     }
                }

                if (embedUrl) {
                    setMapModalData({ url: embedUrl, title });
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

    const handleCopyLink = (url: string) => {
        navigator.clipboard.writeText(url).then(() => {
            setCopiedLink(url);
            setTimeout(() => setCopiedLink(null), 2000); // Reset after 2 seconds
        }).catch(err => {
            console.error('Failed to copy link:', err);
        });
    };
    
    const handleDirectionsClick = (href: string) => {
        try {
            const url = new URL(href);
            const query = url.searchParams.get('query');
            
            if (query) {
                 let destination = encodeURIComponent(query);
                 let titleName = query;
                 
                 let origin = 'London, UK';
                 if (userCoords) {
                     origin = `${userCoords.latitude},${userCoords.longitude}`;
                 }
                 
                 const embedUrl = `https://maps.google.com/maps?saddr=${encodeURIComponent(origin)}&daddr=${destination}&output=embed`;
                 setMapModalData({ url: embedUrl, title: `Directions to ${titleName}` });
            } else {
                 window.open(href, '_blank', 'noopener,noreferrer');
            }
        } catch (error) {
             window.open(href, '_blank', 'noopener,noreferrer');
        }
    }

    if (!isOpen) return null;

    return (
        <>
            <div className="fixed inset-0 bg-black bg-opacity-30 z-40" onClick={onClose}></div>
            <div className="fixed bottom-0 right-0 md:bottom-6 md:right-6 w-full h-full md:w-[400px] md:h-[600px] bg-white text-gray-800 rounded-none md:rounded-2xl shadow-2xl flex flex-col transform transition-all duration-300 z-50 border border-gray-200" onClick={(e) => e.stopPropagation()}>
                <header className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50 rounded-t-none md:rounded-t-2xl">
                    <div className="flex items-center gap-3">
                       <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white"><BotIcon/></div>
                       <h2 className="text-xl font-medium text-gray-800">MeetApp Assistant</h2>
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800 p-1 rounded-full hover:bg-gray-200">
                        <CloseIcon />
                    </button>
                </header>

                <div ref={chatContainerRef} className="flex-1 p-4 overflow-y-auto custom-scrollbar bg-gray-100 relative">
                    {history.map((msg, index) => {
                        const isLastMessage = index === history.length - 1;
                        const showTypingIndicator = msg.role === 'model' && isLoading && isLastMessage && msg.text === '';
                        const isSpeakingThis = speakingMessageId === index;

                        return (
                            <div key={index} className={`flex items-start gap-3 my-4 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                                {msg.role === 'model' && (
                                    <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm border border-gray-200">
                                      <BotIcon/>
                                    </div>
                                )}
                                <div className={`max-w-xs md:max-w-sm px-4 py-2.5 rounded-2xl shadow-sm ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white text-gray-800 rounded-bl-none'}`}>
                                    {showTypingIndicator ? (
                                        <div className="flex items-center">
                                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s] mx-1"></div>
                                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                        </div>
                                    ) : (
                                        <div className="prose prose-base max-w-none prose-a:text-blue-600 hover:prose-a:underline">
                                            <ReactMarkdown
                                                remarkPlugins={[remarkGfm]}
                                                components={{
                                                    a: ({ href, children }) => {
                                                        if (href && (href.includes('google.com/maps/search') || href.includes('google.com/maps/dir'))) {
                                                            const handleViewOnMap = (e: React.MouseEvent) => {
                                                                e.preventDefault();
                                                                handleLinkClick(href, typeof children === 'string' ? children : undefined);
                                                            };
                                            
                                                            const handleDirections = (e: React.MouseEvent) => {
                                                                e.preventDefault();
                                                                handleDirectionsClick(href);
                                                            };

                                                            const isCopied = copiedLink === href;
                                            
                                                            return (
                                                                <span className="inline-flex flex-col items-start">
                                                                    <a 
                                                                        href={href} 
                                                                        onClick={handleViewOnMap}
                                                                        className="inline-flex items-center gap-1 font-bold text-blue-600 hover:underline cursor-pointer text-[1.05em]"
                                                                    >
                                                                        {children} <ExternalLinkIcon className="w-3 h-3 opacity-50" />
                                                                    </a>
                                                                    <span className="flex items-center gap-2 mt-2 flex-wrap">
                                                                        <button
                                                                            onClick={handleViewOnMap}
                                                                            className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded-full transition-colors border border-blue-100"
                                                                        >
                                                                            <MapIcon className="!w-3.5 !h-3.5" /> Map
                                                                        </button>
                                                                        <button
                                                                            onClick={handleDirections}
                                                                            className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded-full transition-colors border border-blue-100"
                                                                        >
                                                                            <DirectionsIcon className="!w-3.5 !h-3.5" /> Directions
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleCopyLink(href)}
                                                                            className={`inline-flex items-center gap-1.5 text-xs font-medium rounded-full px-2.5 py-1.5 transition-colors border ${
                                                                                isCopied
                                                                                    ? 'text-green-700 bg-green-100 border-green-200 cursor-default'
                                                                                    : 'text-gray-500 bg-gray-50 hover:bg-gray-100 border-gray-200'
                                                                            }`}
                                                                            disabled={isCopied}
                                                                        >
                                                                            {isCopied ? <CheckIcon className="!w-3.5 !h-3.5" /> : <CopyIcon className="!w-3.5 !h-3.5" />}
                                                                        </button>
                                                                        
                                                                        {/* Speaker Button for Map Results */}
                                                                         <button
                                                                            onClick={() => speakMessage(msg.text, index)}
                                                                            className={`inline-flex items-center gap-1.5 text-xs font-medium rounded-full px-2.5 py-1.5 transition-colors border ${
                                                                                isSpeakingThis 
                                                                                ? 'text-red-600 bg-red-50 border-red-200' 
                                                                                : 'text-gray-500 bg-gray-50 hover:bg-gray-100 border-gray-200'
                                                                            }`}
                                                                            title={isSpeakingThis ? "Stop reading" : "Read aloud"}
                                                                         >
                                                                            {isSpeakingThis ? <StopCircleIcon className="!w-3.5 !h-3.5" /> : <VolumeUpIcon className="!w-3.5 !h-3.5" />}
                                                                        </button>
                                                                    </span>
                                                                </span>
                                                            );
                                                        }
                                                        
                                                        return (
                                                            <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1">
                                                                {children} <ExternalLinkIcon />
                                                            </a>
                                                        );
                                                    },
                                                    p: ({children}) => <p className="mb-3 last:mb-0">{children}</p>
                                                }}
                                            >
                                                {msg.text}
                                            </ReactMarkdown>
                                        </div>
                                    )}
                                </div>
                                {msg.role === 'user' && (
                                    <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center flex-shrink-0">
                                       <UserIcon />
                                    </div>
                                )}
                            </div>
                        )
                    })}
                    {isLive && history.length <= 1 && (
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center text-gray-500 pointer-events-none">
                             <WaveformIcon className="w-16 h-16 mx-auto mb-2 text-blue-400 animate-pulse" />
                             <p>Assistant is listening...</p>
                        </div>
                    )}
                </div>

                <footer className="p-3 border-t border-gray-200 bg-white rounded-b-none md:rounded-b-2xl">
                    <div className="relative flex items-center gap-2">
                         {/* Live Mode Toggle */}
                        <button
                            onClick={toggleVoiceMode}
                            className={`p-3 rounded-full transition-all duration-300 ${
                                isLive 
                                ? 'bg-red-500 text-white hover:bg-red-600 animate-pulse shadow-lg ring-4 ring-red-200' 
                                : isConnectingLive 
                                    ? 'bg-gray-200 text-gray-500 cursor-wait'
                                    : 'bg-gray-100 text-gray-600 hover:bg-blue-50 hover:text-blue-600'
                            }`}
                            title={isLive ? "Stop Live Conversation" : "Start Live Conversation (Audio Only)"}
                        >
                             {isConnectingLive ? <div className="w-6 h-6 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div> : isLive ? <WaveformIcon className="w-6 h-6" /> : <MicIcon className="w-6 h-6" />}
                        </button>
                        
                        <div className="relative flex-1">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && !isLoading && !isLive && handleSend()}
                                placeholder={isLive ? "Voice mode active..." : "Ask about places in London..."}
                                className={`w-full text-base py-3 pl-4 pr-20 bg-gray-100 border-2 border-gray-200 text-gray-900 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-500 ${isLive ? 'opacity-50 cursor-not-allowed' : ''}`}
                                disabled={isLoading || isLive}
                            />
                            
                             {/* Dictation Mic */}
                             <button
                                onClick={handleDictation}
                                disabled={isLive || isLoading}
                                className={`absolute right-12 top-1/2 -translate-y-1/2 p-1.5 rounded-full transition-colors ${isDictating ? 'text-red-500 animate-pulse' : 'text-gray-400 hover:text-gray-600'}`}
                                title="Dictate"
                            >
                                <MicIcon className="w-5 h-5" />
                            </button>

                            {/* Send Button */}
                            <button
                                onClick={handleSend}
                                disabled={isLoading || !input.trim() || isLive}
                                className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-600 text-white rounded-full p-2.5 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                                aria-label="Send message"
                            >
                                <SendIcon className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </footer>
            </div>
            {mapModalData && <MapModal url={mapModalData.url} title={mapModalData.title} onClose={() => setMapModalData(null)} />}
        </>
    );
};

export default Chatbot;
