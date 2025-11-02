// src/app/api/gemini/quiz/route.ts

import { GoogleGenerativeAI, GenerationConfig, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { NextRequest, NextResponse } from 'next/server';

// Pega a API Key do arquivo .env.local (de forma segura)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);

// Configuração para garantir que o Gemini GERE o JSON
const generationConfig: GenerationConfig = {
    responseMimeType: "application/json",
};

// Configuração de segurança (pode ser útil se o Gemini bloquear perguntas legítimas)
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
            Crie um quiz com 3 perguntas de múltipla escolha sobre o módulo de Power BI "${moduleTitle}", 
            com base nos tópicos: ${lessonTitles.join(", ")}.
            
            Seu JSON deve seguir exatamente esta estrutura:
            [
                {
                    "question": "Texto da pergunta 1?",
                    "options": ["Opção A", "Opção B", "Opção C", "Opção D"],
                    "correctAnswer": "Opção B"
                },
                {
                    "question": "Texto da pergunta 2?",
                    "options": ["Opção 1", "Opção 2", "Opção 3", "Opção 4"],
                    "correctAnswer": "Opção 3"
                }
            ]
            
            Gere 3 perguntas. As opções e a resposta correta devem ser de texto simples.
            A resposta correta (correctAnswer) deve ser EXATAMENTE igual a um dos textos das 'options'.
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

        // 4. Retorna o quiz (já em formato JSON) para o frontend
        // O Next.js vai re-converter para JSON, por isso parseamos primeiro
        return NextResponse.json(JSON.parse(text));

    } catch (error) {
        console.error("Erro na API Route do Gemini Quiz:", error);
        return NextResponse.json({ error: 'Erro ao gerar o quiz' }, { status: 500 });
    }
}