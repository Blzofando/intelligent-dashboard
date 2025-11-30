// src/lib/ai/functions/quiz.ts
import { GoogleGenerativeAI } from "@google/generative-ai";
import { CoursePrompts } from "../prompts/types";
import { createGeminiModel } from "../gemini";

export interface QuizQuestion {
    question: string;
    options: string[];
    correctAnswer: string;
}

/**
 * Gera quiz usando IA
 * Função genérica que funciona para qualquer curso
 * 
 * @param genAI - Cliente Gemini
 * @param prompts - Prompts específicos do curso
 * @param moduleTitle - Título do módulo
 * @param lessonTitles - Lista de títulos das aulas
 * @returns Array de questões do quiz
 */
export async function generateQuiz(
    genAI: GoogleGenerativeAI,
    prompts: CoursePrompts,
    moduleTitle: string,
    lessonTitles: string[]
): Promise<QuizQuestion[]> {
    const model = createGeminiModel(genAI, { useJsonMode: true });

    const prompt = prompts.quiz(moduleTitle, lessonTitles);

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    const questions = JSON.parse(text) as QuizQuestion[];

    return questions;
}
