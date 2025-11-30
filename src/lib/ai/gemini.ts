// src/lib/ai/gemini.ts
import { GoogleGenerativeAI, GenerationConfig, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

/**
 * Cliente Gemini reutilizável
 * Centraliza configurações padrão para todas as chamadas de IA
 */

// Configuração padrão para geração de JSON
export const jsonGenerationConfig: GenerationConfig = {
    responseMimeType: "application/json",
};

// Configuração de segurança padrão
export const defaultSafetySettings = [
    {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
];

/**
 * Cria uma instância do cliente Gemini
 */
export function createGeminiClient(): GoogleGenerativeAI {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        throw new Error("GEMINI_API_KEY não está configurada no ambiente");
    }

    return new GoogleGenerativeAI(apiKey);
}

/**
 * Cria um modelo Gemini com configurações padrão
 */
export function createGeminiModel(
    genAI: GoogleGenerativeAI,
    options: {
        model?: string;
        useJsonMode?: boolean;
        customConfig?: GenerationConfig;
    } = {}
) {
    const {
        model = "gemini-2.5-flash",
        useJsonMode = false,
        customConfig
    } = options;

    return genAI.getGenerativeModel({
        model,
        generationConfig: useJsonMode ? jsonGenerationConfig : customConfig,
        safetySettings: defaultSafetySettings,
    });
}

/**
 * Utilitário para limpar JSON retornado pelo Gemini
 * Remove markdown code blocks se presentes
 */
export function cleanGeminiJsonResponse(text: string): string {
    return text.replace(/```json\n|```/g, "").trim();
}
