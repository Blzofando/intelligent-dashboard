import { NextRequest, NextResponse } from "next/server";
import { createGeminiClient } from "@/lib/ai/gemini";
import { getCoursePrompts } from "@/lib/ai/prompts";
import { generateCssChallenge } from "@/lib/ai/functions/cssChallenge";

export async function POST(request: NextRequest) {
  try {
    const { moduleTitle, lessonTitles, courseId, context } =
      await request.json();

    if (!moduleTitle || !lessonTitles) {
      return NextResponse.json(
        { error: "Dados do módulo são obrigatórios" },
        { status: 400 },
      );
    }

    const effectiveCourseId = courseId || "css";
    const prompts = getCoursePrompts(effectiveCourseId);
    const genAI = createGeminiClient();

    if (!prompts.challenge) {
      return NextResponse.json(
        { error: "Curso não suporta Desafios Práticos Baseados em Cenários." },
        { status: 400 },
      );
    }

    const challenge = await generateCssChallenge(
      genAI,
      prompts,
      moduleTitle,
      lessonTitles,
      context,
    );

    return NextResponse.json(challenge);
  } catch (error) {
    console.error("Erro na API Route do CSS Challenge:", error);
    return NextResponse.json(
      { error: "Erro ao gerar o desafio prático" },
      { status: 500 },
    );
  }
}
