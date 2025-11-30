// src/lib/youtube/search.ts

/**
 * Biblioteca para busca no YouTube
 * Separa a lógica de busca da lógica de filtro com IA
 */

export interface YouTubeApiItem {
    id: { videoId: string };
    snippet: { title: string; description: string };
}

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY as string;
const YOUTUBE_API_URL = 'https://www.googleapis.com/youtube/v3/search';

/**
 * Busca vídeos no YouTube
 * 
 * @param query - Query de busca
 * @param count - Número de resultados
 * @returns Lista de vídeos encontrados
 */
export async function searchYouTube(
    query: string,
    count: number
): Promise<YouTubeApiItem[]> {
    const params = new URLSearchParams({
        part: 'snippet',
        q: query,
        key: YOUTUBE_API_KEY,
        type: 'video',
        videoDuration: 'medium', // Exclui Shorts
        maxResults: String(count),
        relevanceLanguage: 'pt',
    });

    const response = await fetch(`${YOUTUBE_API_URL}?${params.toString()}`);

    if (!response.ok) {
        console.warn(`Aviso na busca do YouTube por "${query}": Status ${response.status}`);
        return [];
    }

    const data = await response.json();
    return data.items || [];
}
