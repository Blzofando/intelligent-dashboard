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
            <div className="fixed bottom-8 right-8 z-40">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-16 h-16 bg-primary-600 text-white rounded-full shadow-lg flex items-center justify-center text-2xl hover:bg-primary-700 transition-transform transform hover:scale-110"
                    aria-label="Open AI Chat"
                >
                    <i className="fas fa-robot"></i>
                </button>
            </div>

            {isOpen && (
                <div className="fixed bottom-28 right-8 w-full max-w-md h-[60vh] bg-white dark:bg-gray-800 rounded-lg shadow-2xl flex flex-col z-50 transition-all duration-300">
                    <header className="p-4 bg-primary-600 text-white flex justify-between items-center rounded-t-lg">
                        <h3 className="font-bold text-lg">Assistente IA do Curso</h3>
                        <button onClick={() => setIsOpen(false)}>&times;</button>
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
                                className="flex-1 p-2 border rounded-l-lg dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                disabled={isLoading}
                            />
                            <button type="submit" className="bg-primary-600 text-white p-2 rounded-r-lg" disabled={isLoading}>
                                <i className="fas fa-paper-plane"></i>
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </>
    );
};

export default ChatWidget;
