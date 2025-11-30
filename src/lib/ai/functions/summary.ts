// src/lib/ai/functions/summary.ts
import { GoogleGenerativeAI } from "@google/generative-ai";
import { CoursePrompts } from "../prompts/types";
import { createGeminiModel } from "../gemini";

/**
 * Gera resumo de módulo usando IA
 * Função genérica que funciona para qualquer curso
 * 
 * @param genAI - Cliente Gemini
 * @param prompts - Prompts específicos do curso
 * @param moduleTitle - Título do módulo
 * @param lessonTitles - Lista de títulos das aulas
 * @returns Texto do resumo
 */
export async function generateSummary(
    genAI: GoogleGenerativeAI,
    prompts: CoursePrompts,
    moduleTitle: string,
    lessonTitles: string[]
): Promise<string> {
    const model = createGeminiModel(genAI);

    const prompt = prompts.summary(moduleTitle, lessonTitles);

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const summary = response.text();

    return summary;
}
