import { GoogleGenerativeAI } from "@google/generative-ai";
import { CoursePrompts } from "../prompts/types";
import { createGeminiModel } from "../gemini";

export interface FileData {
  nome: string;
  conteudo: string;
}

export interface StandardText {
  titulo: string;
  valor: string;
}

export interface CssChallengeResponse {
  historia_contexto: string;
  instrucoes: string[];
  textos_padronizados: StandardText[];
  arquivos_base?: FileData[];
  gabarito_codigo: FileData[];
}

/**
 * Gera desafio de CSS usando IA
 *
 * @param genAI - Cliente Gemini
 * @param prompts - Prompts específicos do curso
 * @param moduleTitle - Título do módulo
 * @param lessonTitles - Lista de títulos das aulas
 * @param context - Histórico ou contexto extra (opcional)
 * @returns Um desafio prático de código
 */
export async function generateCssChallenge(
  genAI: GoogleGenerativeAI,
  prompts: CoursePrompts,
  moduleTitle: string,
  lessonTitles: string[],
  context?: string,
): Promise<CssChallengeResponse> {
  if (!prompts.challenge) {
    throw new Error("O prompt 'challenge' não está definido para este curso.");
  }

  const prompt = prompts.challenge(moduleTitle, lessonTitles, context);

  // Modelos de fallback definidos pelo usuário (tenta o 1º, se falhar, vai pro 2º, etc)
  const fallbackModels = [
    "gemini-3.1-pro-preview",
    "gemini-3.1-flash-lite-preview",
    "gemini-2.5-pro",
    "gemini-2.5-flash",
  ];

  let lastError = null;

  for (const modelName of fallbackModels) {
    try {
      console.log(`Tentando gerar desafio com modelo: ${modelName}`);
      const model = createGeminiModel(genAI, {
        useJsonMode: true,
        model: modelName,
      });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      const challengeData = JSON.parse(text) as CssChallengeResponse;

      return challengeData; // Retorna na primeira tentativa bem-sucedida!
    } catch (err) {
      console.warn(`Erro no modelo ${modelName}:`, err);
      lastError = err;
      // Continua para o próximo modelo no loop
    }
  }

  // Se esgotou todos os modelos
  throw new Error(
    "Falha ao gerar desafio. Todos os modelos falharam. Erro original: " +
      (lastError as Error)?.message,
  );
}
