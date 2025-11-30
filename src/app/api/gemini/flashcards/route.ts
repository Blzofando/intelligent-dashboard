// src/app/api/gemini/flashcards/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createGeminiClient } from '@/lib/ai/gemini';
import { getCoursePrompts } from '@/lib/ai/prompts';
import { generateFlashcards } from '@/lib/ai/functions/flashcards';

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

        // Gera flashcards usando a função genérica
        const flashcards = await generateFlashcards(
            genAI,
            prompts,
            moduleTitle,
            lessonTitles
        );

        return NextResponse.json(flashcards);

    } catch (error) {
        console.error("Erro na API Route do Gemini Flashcards:", error);
        return NextResponse.json(
            { error: 'Erro ao gerar os flashcards' },
            { status: 500 }
        );
    }
}