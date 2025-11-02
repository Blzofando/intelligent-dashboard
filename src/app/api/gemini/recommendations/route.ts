// src/app/api/gemini/recommendations/route.ts

import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from 'next/server';

// Pega a API Key do arquivo .env.local (de forma segura)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);

export async function POST(request: NextRequest) {
  try {
    // 1. Pega os dados enviados pelo frontend
    const { completedModules } = await request.json(); // Espera um array de strings

    if (!completedModules || completedModules.length === 0) {
      return NextResponse.json({ error: 'Módulos concluídos são obrigatórios' }, { status: 400 });
    }

    // 2. Prepara o prompt para o Gemini
    const prompt = `
      Um aluno do curso de Power BI acabou de completar os seguintes módulos: ${completedModules.join(', ')}.
      
      Com base nesses tópicos, sugira 3 recomendações de estudo complementar em português do Brasil.
      As recomendações podem ser livros, vídeos do YouTube, artigos de blog ou documentações oficiais da Microsoft.
      
      Formate a resposta de forma clara e amigável (sem JSON), usando markdown simples.
      Exemplo:
      
      **1. Título da Recomendação:**
      Uma breve descrição (1-2 linhas) e o link, se aplicável.
      
      **2. Título da Recomendação 2:**
      ...
    `;

    // 3. Faz a chamada segura para a IA (no backend)
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // 4. Retorna a recomendação (texto puro) para o frontend
    return NextResponse.json({ recommendations: text });

  } catch (error) {
    console.error("Erro na API Route do Gemini Recommendations:", error);
    return NextResponse.json({ error: 'Erro ao gerar as recomendações' }, { status: 500 });
  }
}