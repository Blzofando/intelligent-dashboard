// src/components/ChatWidget.tsx
"use client"; 

import React, { useState, useRef, useEffect } from 'react';
import { answerCourseQuestion } from '../services/geminiService';

interface Message {
    sender: 'user' | 'ai';
    text: string;
}

const ChatWidget: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const chatBodyRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (chatBodyRef.current) {
            chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userInput.trim() || isLoading) return;

        const newMessages: Message[] = [...messages, { sender: 'user', text: userInput }];
        setMessages(newMessages);
        setUserInput('');
        setIsLoading(true);

        try {
            // In a real app, context would be dynamic based on the current page/module
            const context = "Curso de Power BI - geral";
            const aiResponse = await answerCourseQuestion(userInput, context);
            setMessages([...newMessages, { sender: 'ai', text: aiResponse }]);
        } catch (error) {
            setMessages([...newMessages, { sender: 'ai', text: "Desculpe, ocorreu um erro." }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <div className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-40">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-14 h-14 sm:w-16 sm:h-16 bg-primary-600 text-white rounded-full shadow-lg flex items-center justify-center text-xl sm:text-2xl hover:bg-primary-700 transition-transform transform hover:scale-110"
                    aria-label="Open AI Chat"
                >
                    <i className="fas fa-robot"></i>
                </button>
            </div>

            {isOpen && (
                <div className="fixed bottom-0 right-0 left-0 sm:left-auto sm:right-8 sm:bottom-28 w-full sm:max-w-md h-[75vh] sm:h-[60vh] bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-xl shadow-2xl flex flex-col z-50 transition-all duration-300 border border-gray-100 dark:border-gray-700/50">
                    <header className="p-4 bg-primary-600 text-white flex justify-between items-center rounded-t-2xl sm:rounded-t-xl">
                        <h3 className="font-bold text-lg">Assistente IA do Curso</h3>
                        <button onClick={() => setIsOpen(false)} className="text-white hover:text-gray-200 text-2xl font-bold leading-none p-1 transition-colors">&times;</button>
                    </header>
                    <div ref={chatBodyRef} className="flex-1 p-4 overflow-y-auto space-y-4">
                        {messages.map((msg, index) => (
                            <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`p-3 rounded-lg max-w-xs ${msg.sender === 'user' ? 'bg-primary-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'}`}>
                                    {msg.text}
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                             <div className="flex justify-start">
                                <div className="p-3 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                                   <i className="fas fa-spinner fa-spin"></i> 
                                </div>
                            </div>
                        )}
                    </div>
                    <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex items-center">
                            <input
                                type="text"
                                value={userInput}
                                onChange={(e) => setUserInput(e.target.value)}
                                placeholder="Pergunte sobre o curso..."
                                className="flex-1 p-2.5 border rounded-l-lg dark:bg-gray-700 dark:border-gray-600 focus:outline-hidden focus:ring-3 focus:ring-primary-500 text-sm"
                                disabled={isLoading}
                            />
                            <button type="submit" className="bg-primary-600 text-white p-2.5 rounded-r-lg flex items-center justify-center" disabled={isLoading}>
                                <i className="fas fa-paper-plane text-sm"></i>
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </>
    );
};

export default ChatWidget;
