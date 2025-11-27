
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, Chat, LiveServerMessage, Modality } from '@google/genai';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ChatMessage } from '../types';
import { CloseIcon, SendIcon, UserIcon, ExternalLinkIcon, BotIcon, DirectionsIcon, MapIcon, CopyIcon, CheckIcon, MicIcon, MicOffIcon, WaveformIcon, VolumeUpIcon, StopCircleIcon, SparkleIcon } from './icons';
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

type VoiceStatus = 'inactive' | 'connecting' | 'listening' | 'thinking' | 'speaking';

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
    const [voiceStatus, setVoiceStatus] = useState<VoiceStatus>('inactive');
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
    const [liveTranscript, setLiveTranscript] = useState<{user: string, model: string}>({user: '', model: ''});

    // Dictation & TTS State
    const [isDictating, setIsDictating] = useState(false);
    const [speakingMessageId, setSpeakingMessageId] = useState<number | null>(null);
    const recognitionRef = useRef<any>(null);

    const initChat = useCallback(() => {
        const baseInstruction = "You are a helpful assistant for the MeetApp London app. You specialize in London locations, transit, and culture. When a user asks for a list of places (e.g., restaurants, pubs, museums), you MUST format your response as a markdown-numbered list. For each item, you MUST prepend the venue name with a relevant emoji representing the venue type (e.g., ☕ for a cafe, 🍽️ for a restaurant, 🍺 for a pub, 🌳 for a park, 🏛️ for a museum). The venue name must be a **bolded markdown link** to its Google Maps location. Add a brief, single-paragraph description on a new line below the name. **Crucially, ensure there is a blank line separating each numbered item for readability.**\n\nThe link MUST be a full `https://www.google.com/maps/search/?api=1&query=...` URL. Do not use shortened URLs or links to other websites.";
        
        const example = "\n\nHere is a perfect example:\n\n1. ☕ [**The Folly**](https://www.google.com/maps/search/?api=1&query=The+Folly&query_place_id=ChIJc-Q3jA8bdkgR1lQwn_L0a4I)\nA garden-influenced restaurant and bar with a seasonal menu.\n\n2. 🍽️ [**Caravan City**](https://www.google.com/maps/search/?api=1&query=Caravan+City&query_place_id=ChIJiQUg_QcbdkgRj8d-2d_e8cI)\nEclectic global cooking in an industrial chic setting.";

        let systemInstruction = baseInstruction;
        
        if (userCoords) {
            systemInstruction += `\n\nCONTEXT: The user is currently located at Latitude: ${userCoords.latitude}, Longitude: ${userCoords.longitude}. NOTE: ONLY reference this location if the user explicitly asks for "near me", "nearby", or directions from their current spot. Otherwise, assume they are asking about the location specified in their query and do not mention their current coordinates.`;
        }
        
        systemInstruction += example;
        
        return systemInstruction;
    }, [userCoords]);

    // Specialized Prompt for Voice/Live Mode
    const getLiveSystemInstruction = useCallback(() => {
        let instruction = `You are a friendly, knowledgeable local guide for London, helping a user plan a meetup. 
        
        CRITICAL VOICE INSTRUCTIONS:
        1. You are having a spoken conversation. Do NOT use markdown formatting (no bold, no italics, no links).
        2. Do NOT use emojis. They are annoying when read aloud.
        3. When asked for recommendations (e.g., "coffee shops in Balham"), ALWAYS provide 3 distinct options to give the user variety.
        4. COMPLETE YOUR THOUGHTS. Do not stop in the middle of a sentence or list.
        5. For each option, clearly state the name and a short, punchy reason why it's good (e.g., "First is The Folly, great for its garden vibe.").
        6. Keep your total response concise (under 45 seconds).
        7. Do NOT list addresses or read out long URLs.`;

        if (userCoords) {
            instruction += `\n\nUser Context: Latitude ${userCoords.latitude}, Longitude ${userCoords.longitude}. Use this for relative distance (e.g. "It's nearby") but do not read coordinates.`;
        }

        return instruction;
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
                 try {
                     // @ts-ignore
                     if(typeof session.close === 'function') session.close();
                 } catch(e) { console.log('Session close error', e)}
             });
             sessionPromiseRef.current = null;
        }
        
        setIsLive(false);
        setVoiceStatus('inactive');
        setLiveTranscript({user: '', model: ''});
        currentInputTranscriptionRef.current = '';
        currentOutputTranscriptionRef.current = '';
    }, []);

    const startLiveSession = async () => {
        setVoiceStatus('connecting');
        try {
            // Use specialized prompt for voice
            const systemInstruction = getLiveSystemInstruction();
            
            // Audio setup
            const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 16000});
            const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
            
            inputAudioContextRef.current = inputAudioContext;
            outputAudioContextRef.current = outputAudioContext;
            
            const outputNode = outputAudioContext.createGain();
            outputNode.connect(outputAudioContext.destination);
            outputNodeRef.current = outputNode;
            
            // Request Echo Cancellation
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                } 
            });
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
                    outputAudioTranscription: {}, 
                    inputAudioTranscription: {},
                },
                callbacks: {
                    onopen: () => {
                        console.log('Live session opened');
                        setIsLive(true);
                        setVoiceStatus('listening');
                        
                        // Setup Audio Input Stream
                        const source = inputAudioContext.createMediaStreamSource(stream);
                        inputSourceRef.current = source;
                        
                        const scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
                        scriptProcessorRef.current = scriptProcessor;
                        
                        scriptProcessor.onaudioprocess = (e) => {
                            if (audioSourcesRef.current.size > 0) {
                                return;
                            }

                            const inputData = e.inputBuffer.getChannelData(0);
                            
                            // Convert Float32 to Int16
                            const l = inputData.length;
                            const int16 = new Int16Array(l);
                            for (let i = 0; i < l; i++) {
                                int16[i] = inputData[i] * 32768;
                            }
                            
                            const base64Data = bytesToBase64(new Uint8Array(int16.buffer));
                            
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
                         // Check for interruption signal from server
                        const interrupted = message.serverContent?.interrupted;
                        if (interrupted) {
                            console.log('Interrupted');
                            audioSourcesRef.current.forEach(source => source.stop());
                            audioSourcesRef.current.clear();
                            setVoiceStatus('listening');
                            return;
                        }

                        // Handle Transcriptions
                        if (message.serverContent?.outputTranscription) {
                            const text = message.serverContent.outputTranscription.text;
                            currentOutputTranscriptionRef.current += text;
                            setLiveTranscript(prev => ({ ...prev, model: currentOutputTranscriptionRef.current }));
                            
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
                            setLiveTranscript(prev => ({ ...prev, user: currentInputTranscriptionRef.current }));
                            
                             setHistory(prev => {
                                const newHistory = [...prev];
                                const lastMsg = newHistory[newHistory.length - 1];
                                if (lastMsg && lastMsg.role === 'user' && lastMsg.isLive) {
                                     lastMsg.text = currentInputTranscriptionRef.current;
                                     return newHistory;
                                } else {
                                     if (lastMsg && lastMsg.role === 'model') {
                                         return [...prev, { role: 'user', text: currentInputTranscriptionRef.current, isLive: true }];
                                     }
                                     return [...prev, { role: 'user', text: currentInputTranscriptionRef.current, isLive: true }];
                                }
                            });
                        }

                        if (message.serverContent?.turnComplete) {
                            console.log('Turn complete');
                            setVoiceStatus('thinking');
                            currentInputTranscriptionRef.current = '';
                            currentOutputTranscriptionRef.current = '';
                        }

                        // Handle Audio Output
                        const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                        if (base64Audio) {
                            const audioCtx = outputAudioContextRef.current;
                            if (!audioCtx) return;
                            
                            setVoiceStatus('speaking');

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
                                    if (audioSourcesRef.current.size === 0) {
                                        setVoiceStatus('listening');
                                    }
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
                        setVoiceStatus('inactive');
                        setIsLive(false);
                        alert("Connection to Voice Assistant failed. Please check your network and try again.");
                    }
                }
            });
            
            sessionPromiseRef.current = sessionPromise;

        } catch (error) {
            console.error('Failed to start live session:', error);
            setVoiceStatus('inactive');
            setIsLive(false);
        }
    };

    const toggleVoiceMode = () => {
        if (isLive) {
            stopLiveSession();
            startChatSession();
        } else {
            setChat(null); 
            setLiveTranscript({user: '', model: ''});
            currentInputTranscriptionRef.current = '';
            currentOutputTranscriptionRef.current = '';
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
        recognition.interimResults = true; 
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
            setIsDictating(true);
            setInput(''); 
        };

        recognition.onresult = (event: any) => {
            let interimTranscript = '';
            let finalTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                } else {
                    interimTranscript += event.results[i][0].transcript;
                }
            }
            
            const currentText = finalTranscript || interimTranscript;
            setInput(currentText);
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
        
        stopSpeaking(); 
        
        let cleanText = text
            .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
            .replace(/https?:\/\/[^\s]+/g, '')
            .replace(/[*_#`~]/g, '')
            .replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, '')
            .trim();

        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.lang = 'en-GB';
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
            setTimeout(() => setCopiedLink(null), 2000); 
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
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" onClick={onClose}></div>
            <div className="fixed bottom-0 right-0 md:bottom-6 md:right-6 w-full h-full md:w-[400px] md:h-[650px] bg-white text-gray-800 rounded-none md:rounded-[28px] shadow-2xl flex flex-col transform transition-all duration-300 z-50 border border-gray-100 overflow-hidden" onClick={(e) => e.stopPropagation()}>
                
                {/* Standard Chat Header */}
                <header className="flex items-center justify-between p-4 bg-white border-b border-gray-100 z-20 relative">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-900"><BotIcon/></div>
                       <h2 className="text-xl font-medium text-gray-900 font-google-sans">MeetApp Assistant</h2>
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800 p-2 rounded-full hover:bg-gray-100 transition-colors">
                        <CloseIcon />
                    </button>
                </header>

                {/* --- LIVE VOICE OVERLAY --- */}
                {isLive ? (
                    <div className="absolute inset-0 top-[72px] bg-white z-30 flex flex-col">
                        <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-8 relative overflow-hidden">
                             {/* Background Decorative Rings */}
                             <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
                                 <div className={`absolute w-64 h-64 rounded-full border-2 border-blue-500 ${voiceStatus === 'speaking' ? 'animate-ping' : ''}`}></div>
                                 <div className={`absolute w-48 h-48 rounded-full border-2 border-blue-400 ${voiceStatus === 'speaking' ? 'animate-ping [animation-delay:-0.5s]' : ''}`}></div>
                             </div>

                             {/* Status Visualizer */}
                             <div className="relative z-10 flex flex-col items-center">
                                {voiceStatus === 'connecting' && (
                                     <div className="w-24 h-24 rounded-full border-4 border-gray-200 border-t-blue-500 animate-spin mb-4"></div>
                                )}
                                
                                {voiceStatus === 'listening' && (
                                    <div className="relative">
                                        <div className="w-24 h-24 rounded-full bg-red-50 text-red-500 flex items-center justify-center ring-4 ring-red-100 animate-pulse">
                                            <MicIcon className="w-10 h-10" />
                                        </div>
                                        <div className="absolute -inset-2 rounded-full border border-red-200 animate-ping opacity-20"></div>
                                    </div>
                                )}
                                
                                {voiceStatus === 'thinking' && (
                                     <div className="relative w-24 h-24 flex items-center justify-center">
                                         <SparkleIcon className="w-16 h-16 text-amber-400 animate-pulse" />
                                     </div>
                                )}
                                
                                {voiceStatus === 'speaking' && (
                                    <div className="relative w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 ring-4 ring-blue-100">
                                         <WaveformIcon className="w-12 h-12 animate-pulse" />
                                    </div>
                                )}

                                <p className="mt-6 text-xl font-medium text-gray-700 font-google-sans">
                                    {voiceStatus === 'connecting' && "Connecting..."}
                                    {voiceStatus === 'listening' && "Listening..."}
                                    {voiceStatus === 'thinking' && "Thinking..."}
                                    {voiceStatus === 'speaking' && "Speaking..."}
                                </p>
                             </div>
                             
                             {/* Transcripts */}
                             <div className="w-full max-w-sm mt-8 space-y-4 min-h-[120px] flex flex-col justify-end">
                                 {liveTranscript.user && (
                                     <div className="bg-gray-100 p-4 rounded-[20px] rounded-tr-none self-end ml-8 text-right">
                                         <p className="text-gray-600 text-xs uppercase tracking-wide mb-1">You</p>
                                         <p className="text-gray-900 font-medium">{liveTranscript.user}</p>
                                     </div>
                                 )}
                                 {liveTranscript.model && (
                                      <div className="bg-blue-50 p-4 rounded-[20px] rounded-tl-none self-start mr-8">
                                         <p className="text-blue-600 text-xs uppercase tracking-wide mb-1">Assistant</p>
                                         <p className="text-gray-900 font-medium">{liveTranscript.model}</p>
                                      </div>
                                 )}
                             </div>
                        </div>

                        {/* Footer Controls */}
                        <div className="p-6 border-t border-gray-100 bg-white flex justify-center gap-6">
                            <button 
                                onClick={toggleVoiceMode}
                                className="flex flex-col items-center gap-1 group"
                            >
                                <div className="w-14 h-14 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors text-gray-600">
                                    <CloseIcon className="w-6 h-6" />
                                </div>
                                <span className="text-xs font-medium text-gray-500 mt-2">End Voice</span>
                            </button>
                        </div>
                    </div>
                ) : (
                    // Standard Text Chat Body
                    <div ref={chatContainerRef} className="flex-1 p-4 overflow-y-auto custom-scrollbar bg-white relative">
                        {history.map((msg, index) => {
                            const isLastMessage = index === history.length - 1;
                            const showTypingIndicator = msg.role === 'model' && isLoading && isLastMessage && msg.text === '';
                            const isSpeakingThis = speakingMessageId === index;

                            return (
                                <div key={index} className={`flex items-start gap-3 my-4 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                                    {msg.role === 'model' && (
                                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-900 flex items-center justify-center flex-shrink-0">
                                        <BotIcon/>
                                        </div>
                                    )}
                                    <div className={`max-w-xs md:max-w-sm px-5 py-3 shadow-sm ${
                                        msg.role === 'user' 
                                            ? 'bg-blue-600 text-white rounded-[20px] rounded-br-none' 
                                            : 'bg-gray-100 text-gray-900 rounded-[20px] rounded-bl-none'
                                    }`}>
                                        {showTypingIndicator ? (
                                            <div className="flex items-center">
                                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s] mx-1"></div>
                                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                            </div>
                                        ) : (
                                            <div className="prose prose-base max-w-none prose-a:font-medium hover:prose-a:underline">
                                                <ReactMarkdown
                                                    remarkPlugins={[remarkGfm]}
                                                    components={{
                                                        a: ({ href, children }) => {
                                                            const isInternalLink = href && (href.includes('google.com/maps/search') || href.includes('google.com/maps/dir'));
                                                            
                                                            if (isInternalLink) {
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
                                                                    <span className="inline-flex flex-col items-start my-2 p-3 bg-white/50 rounded-xl border border-blue-200/50 w-full">
                                                                        <a 
                                                                            href={href} 
                                                                            onClick={handleViewOnMap}
                                                                            className={`inline-flex items-center gap-1 font-bold hover:underline cursor-pointer text-lg mb-2 ${msg.role === 'user' ? 'text-white' : 'text-blue-700'}`}
                                                                        >
                                                                            {children} <ExternalLinkIcon className="w-4 h-4 opacity-70" />
                                                                        </a>
                                                                        <span className="flex items-center gap-2 flex-wrap w-full">
                                                                            <button
                                                                                onClick={handleViewOnMap}
                                                                                className="flex-1 inline-flex justify-center items-center gap-1.5 text-xs font-medium text-blue-700 bg-white hover:bg-blue-50 px-3 py-2 rounded-full transition-colors border border-blue-100 shadow-sm"
                                                                            >
                                                                                <MapIcon className="!w-4 !h-4" /> Map
                                                                            </button>
                                                                            <button
                                                                                onClick={handleDirections}
                                                                                className="flex-1 inline-flex justify-center items-center gap-1.5 text-xs font-medium text-blue-700 bg-white hover:bg-blue-50 px-3 py-2 rounded-full transition-colors border border-blue-100 shadow-sm"
                                                                            >
                                                                                <DirectionsIcon className="!w-4 !h-4" /> Directions
                                                                            </button>
                                                                            
                                                                            <div className="flex gap-2">
                                                                                <button
                                                                                    onClick={() => handleCopyLink(href)}
                                                                                    className={`w-8 h-8 inline-flex items-center justify-center rounded-full transition-colors border shadow-sm ${
                                                                                        isCopied
                                                                                            ? 'text-green-700 bg-green-100 border-green-200'
                                                                                            : 'text-gray-600 bg-white hover:bg-gray-50 border-gray-200'
                                                                                    }`}
                                                                                    disabled={isCopied}
                                                                                >
                                                                                    {isCopied ? <CheckIcon className="!w-4 !h-4" /> : <CopyIcon className="!w-4 !h-4" />}
                                                                                </button>
                                                                                
                                                                                <button
                                                                                    onClick={() => speakMessage(msg.text, index)}
                                                                                    className={`w-8 h-8 inline-flex items-center justify-center rounded-full transition-colors border shadow-sm ${
                                                                                        isSpeakingThis 
                                                                                        ? 'text-red-600 bg-red-50 border-red-200' 
                                                                                        : 'text-gray-600 bg-white hover:bg-gray-50 border-gray-200'
                                                                                    }`}
                                                                                    title={isSpeakingThis ? "Stop reading" : "Read aloud"}
                                                                                >
                                                                                    {isSpeakingThis ? <StopCircleIcon className="!w-4 !h-4" /> : <VolumeUpIcon className="!w-4 !h-4" />}
                                                                                </button>
                                                                            </div>
                                                                        </span>
                                                                    </span>
                                                                );
                                                            }
                                                            
                                                            return (
                                                                <a href={href} target="_blank" rel="noopener noreferrer" className={`inline-flex items-center gap-1 underline ${msg.role === 'user' ? 'text-white' : 'text-blue-700'}`}>
                                                                    {children} <ExternalLinkIcon />
                                                                </a>
                                                            );
                                                        },
                                                        p: ({children}) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>
                                                    }}
                                                >
                                                    {msg.text}
                                                </ReactMarkdown>
                                            </div>
                                        )}
                                    </div>
                                    {msg.role === 'user' && (
                                        <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center flex-shrink-0">
                                        <UserIcon />
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                )}

                {/* Footer Input Area */}
                {!isLive && (
                    <footer className="p-4 border-t border-gray-100 bg-white">
                        <div className="relative flex items-center gap-2">
                             {/* Start Live Mode */}
                            <button
                                onClick={toggleVoiceMode}
                                className="p-3 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                                title="Start Live Conversation"
                            >
                                 <WaveformIcon className="w-6 h-6" />
                            </button>
                            
                            <div className="relative flex-1">
                                {isDictating ? (
                                    <div className="w-full h-[56px] flex items-center pl-4 pr-12 bg-red-50 border border-red-200 rounded-full animate-pulse">
                                        <span className="text-red-600 font-medium">Listening... {input}</span>
                                        <button
                                            onClick={handleDictation}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 bg-white text-red-500 rounded-full p-2 hover:bg-red-100 transition-colors shadow-sm"
                                        >
                                            <StopCircleIcon className="w-5 h-5" />
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <input
                                            type="text"
                                            value={input}
                                            onChange={(e) => setInput(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSend()}
                                            placeholder="Ask about places in London..."
                                            className="w-full text-base py-4 pl-6 pr-24 bg-gray-50 border-none text-gray-900 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white placeholder:text-gray-500 transition-all"
                                            disabled={isLoading}
                                        />
                                        
                                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                            <button
                                                onClick={handleDictation}
                                                disabled={isLoading}
                                                className="p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                                                title="Dictate"
                                            >
                                                <MicIcon className="w-5 h-5" />
                                            </button>

                                            <button
                                                onClick={handleSend}
                                                disabled={isLoading || !input.trim()}
                                                className="bg-blue-600 text-white rounded-full p-2 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors shadow-sm"
                                                aria-label="Send message"
                                            >
                                                <SendIcon className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </footer>
                )}
            </div>
            {mapModalData && <MapModal url={mapModalData.url} title={mapModalData.title} onClose={() => setMapModalData(null)} />}
        </>
    );
};

export default Chatbot;
