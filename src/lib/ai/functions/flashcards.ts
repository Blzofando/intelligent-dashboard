// src/lib/ai/functions/flashcards.ts
import { GoogleGenerativeAI } from "@google/generative-ai";
import { CoursePrompts } from "../prompts/types";
import { createGeminiModel } from "../gemini";

export interface Flashcard {
    front: string;
    back: string;
}

/**
 * Gera flashcards usando IA
 * Função genérica que funciona para qualquer curso
 * 
 * @param genAI - Cliente Gemini
 * @param prompts - Prompts específicos do curso
 * @param moduleTitle - Título do módulo
 * @param lessonTitles - Lista de títulos das aulas
 * @returns Array de flashcards
 */
export async function generateFlashcards(
    genAI: GoogleGenerativeAI,
    prompts: CoursePrompts,
    moduleTitle: string,
    lessonTitles: string[]
): Promise<Flashcard[]> {
    const model = createGeminiModel(genAI, { useJsonMode: true });

    const prompt = prompts.flashcards(moduleTitle, lessonTitles);

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    const flashcards = JSON.parse(text) as Flashcard[];

    return flashcards;
}
