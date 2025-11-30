// src/app/api/gemini/quiz/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createGeminiClient } from '@/lib/ai/gemini';
import { getCoursePrompts } from '@/lib/ai/prompts';
import { generateQuiz } from '@/lib/ai/functions/quiz';

export async function POST(request: NextRequest) {
    try {
        const { moduleTitle, lessonTitles, courseId } = await request.json();

        if (!moduleTitle || !lessonTitles) {
            return NextResponse.json(
                { error: 'Dados do módulo são obrigatórios' },
                { status: 400 }
            );
        }

        // Usa Power BI como padrão se courseId não for fornecido
        const effectiveCourseId = courseId || 'power-bi';

        // Busca os prompts do curso
        const prompts = getCoursePrompts(effectiveCourseId);

        // Cria cliente Gemini
        const genAI = createGeminiClient();

        // Gera quiz usando a função genérica
        const quiz = await generateQuiz(
            genAI,
            prompts,
            moduleTitle,
            lessonTitles
        );

        return NextResponse.json(quiz);

    } catch (error) {
        console.error("Erro na API Route do Gemini Quiz:", error);
        return NextResponse.json(
            { error: 'Erro ao gerar o quiz' },
            { status: 500 }
        );
    }
}