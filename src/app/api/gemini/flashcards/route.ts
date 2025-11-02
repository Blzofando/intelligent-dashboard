// src/app/api/gemini/flashcards/route.ts

import { GoogleGenerativeAI, GenerationConfig, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { NextRequest, NextResponse } from 'next/server';

// Pega a API Key do arquivo .env.local (de forma segura)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);

// Configuração para garantir que o Gemini GERE o JSON
const generationConfig: GenerationConfig = {
    responseMimeType: "application/json",
};

// Configuração de segurança
const safetySettings = [
    {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
];

export async function POST(request: NextRequest) {
    try {
        // 1. Pega os dados enviados pelo frontend
        const { moduleTitle, lessonTitles } = await request.json();

        if (!moduleTitle || !lessonTitles) {
            return NextResponse.json({ error: 'Dados do módulo são obrigatórios' }, { status: 400 });
        }

        // 2. Prepara o prompt para o Gemini
        const prompt = `
            Crie 5 flashcards para o módulo de Power BI "${moduleTitle}", 
            baseado nos tópicos: ${lessonTitles.join(", ")}.
            
            Seu JSON deve seguir exatamente esta estrutura:
            [
                {
                    "front": "Termo ou pergunta curta (ex: O que é DAX?)",
                    "back": "Definição ou resposta clara e concisa."
                },
                {
                    "front": "Termo 2",
                    "back": "Resposta 2"
                }
            ]
            
            Gere 5 flashcards.
        `;

        // 3. Faz a chamada segura para a IA (no backend)
        const model = genAI.getGenerativeModel({ 
            model: "gemini-2.5-pro",
            generationConfig, // Diz ao Gemini para responder em JSON
            safetySettings 
        });
        
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // 4. Retorna os flashcards (já em formato JSON) para o frontend
        return NextResponse.json(JSON.parse(text));

    } catch (error) {
        console.error("Erro na API Route do Gemini Flashcards:", error);
        return NextResponse.json({ error: 'Erro ao gerar os flashcards' }, { status: 500 });
    }
}