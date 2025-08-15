import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Chat } from '@google/genai';
import type { ChatMessage } from '../types';
import { SparklesIcon, SendIcon } from './Icons';

interface AstroBotPanelProps {
    systemInstructionOverride?: string;
    initialMessage?: string;
}

const AstroBotPanel: React.FC<AstroBotPanelProps> = ({ systemInstructionOverride, initialMessage }) => {
    const [chat, setChat] = useState<Chat | null>(null);
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
    const [inputValue, setInputValue] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);

    const defaultSystemInstruction = "You are AstroBot, an expert AI assistant for the astrobiology community. Your purpose is to answer questions about astrobiology, astronomy, and machine learning, particularly in the context of the content on the current page. You should be helpful, friendly, and provide accurate, scientifically-grounded information. When asked about topics outside your expertise, politely state that you specialize in astrobiology and related fields.";
    const systemInstruction = systemInstructionOverride || defaultSystemInstruction;

    const defaultInitialMessage = "Hello! I'm AstroBot. Ask me anything about the content on this page.";
    const finalInitialMessage = initialMessage || defaultInitialMessage;


    useEffect(() => {
        try {
            if (!process.env.API_KEY) {
                throw new Error("API_KEY is not configured.");
            }
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const chatSession = ai.chats.create({
                model: 'gemini-2.5-flash',
                config: {
                    systemInstruction: systemInstruction,
                }
            });
            setChat(chatSession);
            setChatHistory([{
                role: 'model',
                content: finalInitialMessage
            }]);
        } catch (e: any) {
            setError(e.message || "Failed to initialize chatbot.");
            console.error(e);
        }
    }, [systemInstruction, finalInitialMessage]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatHistory, isLoading]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim() || isLoading || !chat) return;

        const userMessage: ChatMessage = { role: 'user', content: inputValue };
        setChatHistory(prev => [...prev, userMessage]);
        setInputValue('');
        setIsLoading(true);
        setError(null);

        try {
            const stream = await chat.sendMessageStream({ message: inputValue });
            let currentResponse = '';
            // Add a placeholder for the model's response
            setChatHistory(prev => [...prev, { role: 'model', content: '' }]);

            for await (const chunk of stream) {
                currentResponse += chunk.text;
                // Update the last message in the history
                setChatHistory(prev => {
                    const newHistory = [...prev];
                    newHistory[newHistory.length - 1] = { role: 'model', content: currentResponse };
                    return newHistory;
                });
            }
        } catch (e: any) {
            console.error(e);
            const errorMessage = "Sorry, I encountered an error. Please try again.";
            setChatHistory(prev => [...prev, { role: 'error', content: errorMessage }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-8rem)] max-h-[700px] bg-white rounded-lg border border-slate-200 shadow-lg">
            <header className="flex items-center gap-3 p-4 border-b border-slate-200">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white">
                    <SparklesIcon className="w-6 h-6" />
                </div>
                <div>
                    <h2 className="text-lg font-bold text-slate-800">AstroBot</h2>
                    <p className="text-sm text-slate-500">Your AI Assistant</p>
                </div>
            </header>

            <div className="flex-grow overflow-y-auto p-4 space-y-4">
                {chatHistory.map((msg, index) => (
                    <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                        {msg.role === 'model' && (
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white">
                                <SparklesIcon className="w-5 h-5" />
                            </div>
                        )}
                        <div className={`max-w-[85%] px-4 py-2 rounded-lg ${
                            msg.role === 'user' ? 'bg-cyan-500 text-white rounded-br-none' :
                            msg.role === 'model' ? 'bg-slate-100 text-slate-800 rounded-bl-none' :
                            'bg-red-100 text-red-700 rounded-bl-none'
                        }`}>
                            <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                        </div>
                    </div>
                ))}
                {isLoading && (
                     <div className="flex items-start gap-3">
                         <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white">
                            <SparklesIcon className="w-5 h-5 animate-pulse" />
                        </div>
                        <div className="bg-slate-100 text-slate-800 rounded-lg px-4 py-2">
                            <div className="flex items-center justify-center space-x-1">
                                <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce"></div>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={chatEndRef}></div>
            </div>

            <div className="p-4 border-t border-slate-200">
                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder={isLoading ? "AstroBot is thinking..." : "Ask a question..."}
                        disabled={isLoading || error !== null || !chat}
                        className="flex-grow p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-200 text-sm"
                        aria-label="Chat input"
                    />
                    <button
                        type="submit"
                        disabled={!inputValue.trim() || isLoading || !chat}
                        className="p-3 bg-indigo-500 text-white rounded-lg disabled:bg-indigo-300 disabled:cursor-not-allowed hover:bg-indigo-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        aria-label="Send message"
                    >
                        <SendIcon className="w-6 h-6" />
                    </button>
                </form>
                 {error && (
                    <p className="text-red-600 text-center text-sm mt-2">{error}</p>
                )}
            </div>
        </div>
    );
};

export default AstroBotPanel;