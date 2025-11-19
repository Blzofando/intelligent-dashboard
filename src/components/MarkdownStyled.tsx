"use client";

import React from "react";
import ReactMarkdown from "react-markdown";

export default function MarkdownStyled({ content }: { content: string }) {
    const components = {
        h1: ({ children }: any) => (
            <div className="bg-linear-to-r from-blue-600 to-blue-800 
                            text-white p-4 rounded-xl shadow-md mb-6">
                <h1 className="text-2xl font-bold">{children}</h1>
            </div>
        ),

        h2: ({ children }: any) => (
            <div className="border-l-4 border-blue-500 pl-4 my-4">
                <h2 className="text-xl font-semibold text-blue-300">{children}</h2>
            </div>
        ),

        strong: ({ children }: any) => (
            <strong className="font-semibold text-blue-400 bg-blue-900/40 px-1 rounded">
                {children}
            </strong>
        ),

        p: ({ children }: any) => (
            <p className="text-gray-300 leading-relaxed mb-4">{children}</p>
        ),

        ul: ({ children }: any) => (
            <ul className="list-disc ml-6 text-gray-300 mb-4">{children}</ul>
        ),

        li: ({ children }: any) => (
            <li className="mb-1">{children}</li>
        ),
    };

    return (
        <div className="markdown-body">
            <ReactMarkdown components={components}>
                {content}
            </ReactMarkdown>
        </div>
    );
}
