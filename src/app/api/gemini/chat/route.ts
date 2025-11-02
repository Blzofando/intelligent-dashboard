// src/app/api/gemini/chat/route.ts

import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from 'next/server';

// Pega a API Key do arquivo .env.local (de forma segura)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);

export async function POST(request: NextRequest) {
  try {
    // 1. Pega os dados enviados pelo frontend (a pergunta e o contexto)
    const { question, context } = await request.json();

    if (!question) {
      return NextResponse.json({ error: 'Pergunta é obrigatória' }, { status: 400 });
    }

    // 2. Prepara o prompt para o Gemini
    const prompt = `Você é um assistente de IA especializado no curso de Power BI Impressionador. Responda a seguinte pergunta do aluno com base no contexto fornecido.
    
    Contexto do Módulo Atual: ${context || 'Geral'}
    
    Pergunta do Aluno: "${question}"
    
    Forneça uma resposta clara, direta e útil.`;

    // 3. Faz a chamada segura para a IA (no backend)
    // Usando o gemini-1.5-flash que é rápido e eficiente
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" }); 
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // 4. Retorna a resposta da IA para o frontend
    return NextResponse.json({ answer: text });

  } catch (error) {
    console.error("Erro na API Route do Gemini Chat:", error);
    return NextResponse.json({ error: 'Erro ao processar a pergunta' }, { status: 500 });
  }
}