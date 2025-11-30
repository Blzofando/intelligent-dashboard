// src/lib/ai/functions/youtube.ts
import { GoogleGenerativeAI } from "@google/generative-ai";
import { CoursePrompts } from "../prompts/types";
import { createGeminiModel, cleanGeminiJsonResponse } from "../gemini";
import { searchYouTube, YouTubeApiItem } from "../../youtube/search";
import { YouTubeVideo } from "@/types";

/**
 * Filtra vídeos do YouTube usando IA
 * 
 * @param genAI - Cliente Gemini
 * @param prompts - Prompts específicos do curso
 * @param videos - Lista de vídeos para filtrar
 * @param query - Query original
 * @param focus - Foco de carreira do aluno
 * @returns Lista de vídeos filtrados
 */
async function filterWithGemini(
    genAI: GoogleGenerativeAI,
    prompts: CoursePrompts,
    videos: YouTubeApiItem[],
    query: string,
    focus: string
): Promise<YouTubeApiItem[]> {
    if (videos.length === 0) return [];

    const model = createGeminiModel(genAI);

    const prompt = `
    ${prompts.youtubeFilter(query, focus)}

    Lista de vídeos para analisar:
    ${JSON.stringify(videos)}
  `;

    try {
        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        const cleanedJson = cleanGeminiJsonResponse(responseText);
        const filteredVideos: YouTubeApiItem[] = JSON.parse(cleanedJson);
        return filteredVideos;

    } catch (e) {
        console.error("Erro do Gemini ao filtrar vídeos:", e);
        return videos.slice(0, 10); // Retorna os 10 primeiros se a IA falhar
    }
}

/**
 * Gera recomendações de vídeos do YouTube usando IA
 * Função genérica que funciona para qualquer curso
 * 
 * @param genAI - Cliente Gemini
 * @param prompts - Prompts específicos do curso
 * @param focusArea - Área de foco do aluno
 * @param moduleTitle - Título do módulo atual
 * @returns Lista de vídeos recomendados
 */
export async function generateYouTubeRecommendations(
    genAI: GoogleGenerativeAI,
    prompts: CoursePrompts,
    focusArea: string,
    moduleTitle: string
): Promise<YouTubeVideo[]> {
    const hasFocus = focusArea && focusArea !== "Sem foco definido";

    // Gera queries usando os prompts do curso
    const queries = prompts.youtubeQuery(moduleTitle, focusArea);
    const [topicQuery, focusQuery] = queries;

    // Buscar vídeos no YouTube
    let searchResults: YouTubeApiItem[] = [];

    if (hasFocus && focusQuery) {
        const [topicVideos, focusVideos] = await Promise.all([
            searchYouTube(topicQuery, 10),
            searchYouTube(focusQuery, 10)
        ]);
        searchResults = [...topicVideos, ...focusVideos];
    } else {
        searchResults = await searchYouTube(topicQuery, 20);
    }

    // Filtrar com IA
    const finalQuery = hasFocus && focusQuery ? `${topicQuery} E ${focusQuery}` : topicQuery;
    const filteredVideos = await filterWithGemini(genAI, prompts, searchResults, finalQuery, focusArea);

    // Formatar vídeos
    const videos: YouTubeVideo[] = filteredVideos.map(item => {
        const videoId = item.id.videoId;
        return {
            id: videoId,
            title: item.snippet.title,
            description: item.snippet.description,
            thumbnail: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
            embedUrl: `https://www.youtube.com/embed/${videoId}`,
        };
    });

    return videos;
}
