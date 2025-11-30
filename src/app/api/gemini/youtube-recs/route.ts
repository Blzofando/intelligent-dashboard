// src/app/api/gemini/youtube-recs/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createGeminiClient } from '@/lib/ai/gemini';
import { getCoursePrompts } from '@/lib/ai/prompts';
import { generateYouTubeRecommendations } from '@/lib/ai/functions/youtube';

export async function POST(request: NextRequest) {
  try {
    const { focusArea, moduleTitle, courseId } = await request.json() as {
      focusArea: string;
      moduleTitle: string;
      courseId?: string;
    };

    // Usa Power BI como padrão se courseId não for fornecido
    const effectiveCourseId = courseId || 'power-bi';

    // Busca os prompts do curso
    const prompts = getCoursePrompts(effectiveCourseId);

    // Cria cliente Gemini
    const genAI = createGeminiClient();

    // Gera recomendações usando a função genérica
    const videos = await generateYouTubeRecommendations(
      genAI,
      prompts,
      focusArea,
      moduleTitle
    );

    return NextResponse.json(videos);

  } catch (error) {
    console.error("Erro na API Youtube Recs:", error);
    return NextResponse.json(
      { error: 'Erro ao gerar recomendações' },
      { status: 500 }
    );
  }
}