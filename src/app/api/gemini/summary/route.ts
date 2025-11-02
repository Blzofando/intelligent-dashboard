// src/app/api/gemini/summary/route.ts

import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from 'next/server';

// Pega a API Key do arquivo .env.local (de forma segura)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);

export async function POST(request: NextRequest) {
  try {
    // 1. Pega os dados enviados pelo frontend
    const { moduleTitle, lessonTitles } = await request.json();

    if (!moduleTitle || !lessonTitles) {
      return NextResponse.json({ error: 'Dados do módulo são obrigatórios' }, { status: 400 });
    }

    // 2. Prepara o prompt para o Gemini
    const prompt = `Gere um resumo conciso para o módulo do curso "${moduleTitle}", que aborda os seguintes tópicos: ${lessonTitles.join(", ")}. O resumo deve ter no máximo 100 palavras e focar nos conceitos chave.`;

    // 3. Faz a chamada segura para a IA (no backend)
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // 4. Retorna o resumo para o frontend
    return NextResponse.json({ summary: text });

  } catch (error) {
    console.error("Erro na API Route do Gemini Summary:", error);
    return NextResponse.json({ error: 'Erro ao gerar o resumo' }, { status: 500 });
  }
}   