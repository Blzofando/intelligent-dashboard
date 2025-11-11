import { NextRequest, NextResponse } from 'next/server';
import { YouTubeVideo } from '@/types';
// --- IMPORTA O GEMINI ---
import { GoogleGenerativeAI, GenerationConfig } from "@google/generative-ai";

// --- CHAVE DO YOUTUBE ---
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY as string;
const YOUTUBE_API_URL = 'https://www.googleapis.com/youtube/v3/search';

// --- CHAVE DO GEMINI ---
const GEMINI_API_KEY = process.env.GEMINI_API_KEY as string;
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const geminiModel = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });

// Interfaces da API do YouTube
interface YouTubeApiItem {
  id: { videoId: string };
  snippet: {
    title: string;
    description: string;
  };
}

// --- FUNÇÃO DE BUSCA (YOUTUBE) ---
async function searchYouTube(query: string, count: number): Promise<YouTubeApiItem[]> {
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
  if (!response.ok) return [];
  const data = await response.json();
  return data.items || [];
}

// --- FUNÇÃO DE FILTRO (GEMINI) ---
async function filterWithGemini(videos: YouTubeApiItem[], query: string, focus: string): Promise<YouTubeApiItem[]> {
  if (videos.length === 0) return [];

  const prompt = `
    Você é um curador de conteúdo sênior.
    O aluno está estudando Power BI e tem o seguinte foco de carreira: "${focus}"
    Ele está buscando vídeos sobre este tópico: "${query}"

    Eu busquei 20 vídeos no YouTube. Analise esta lista (títulos e descrições) e selecione os 10 MELHORES e MAIS RELEVANTES.
    Priorize vídeos que realmente pareçam tutoriais úteis e que conectem o tópico ao foco do aluno.
    
    Responda APENAS com um array JSON dos 10 vídeos selecionados, no formato original.
    Exemplo: [{"id": {"videoId": "..."}, "snippet": {"title": "...", "description": "..."}}, ...]

    Lista de vídeos para analisar:
    ${JSON.stringify(videos)}
  `;

  try {
    const result = await geminiModel.generateContent(prompt);
    const responseText = result.response.text();
    
    // Limpa a resposta da IA (remove ```json e ```)
    const cleanedJson = responseText.replace(/```json\n|```/g, "").trim();
    
    const filteredVideos: YouTubeApiItem[] = JSON.parse(cleanedJson);
    return filteredVideos;

  } catch (e) {
    console.error("Erro do Gemini ao filtrar:", e);
    // Se o Gemini falhar, apenas retorne os 10 primeiros da busca original
    return videos.slice(0, 10);
  }
}

// --- FUNÇÃO PRINCIPAL (POST) ---
export async function POST(request: NextRequest) {
  try {
    const { focusArea, nextTopic, moduleTitle } = await request.json() as {
      focusArea: string;
      nextTopic: string;
      moduleTitle: string;
    };

    const hasFocus = focusArea && focusArea !== "Sem foco definido";
    
    // 1. Criar as queries de busca
    const topicQuery = `tutorial Power BI "${moduleTitle}" "${nextTopic}"`;
    const focusQuery = `Power BI "${nextTopic}" aplicado a "${focusArea}"`;

    // 2. Buscar 20 vídeos no YouTube (10 de cada)
    let searchResults: YouTubeApiItem[] = [];
    if (hasFocus) {
      const [topicVideos, focusVideos] = await Promise.all([
        searchYouTube(topicQuery, 10),
        searchYouTube(focusQuery, 10)
      ]);
      searchResults = [...topicVideos, ...focusVideos];
    } else {
      searchResults = await searchYouTube(topicQuery, 20);
    }

    // 3. Usar o Gemini para filtrar os 20 resultados e selecionar 10
    const finalQuery = hasFocus ? `${topicQuery} E ${focusQuery}` : topicQuery;
    const filteredVideos = await filterWithGemini(searchResults, finalQuery, focusArea);

    // 4. Formatar os 10 vídeos finais
    const videos: YouTubeVideo[] = filteredVideos.map(item => {
      const videoId = item.id.videoId;
      return {
        id: videoId,
        title: item.snippet.title,
        description: item.snippet.description, // Ainda pegamos, mas o front vai esconder
        thumbnail: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
        embedUrl: `https://www.youtube.com/embed/${videoId}`,
      };
    });

    return NextResponse.json(videos);

  } catch (error) {
    console.error("Erro na API Youtube Recs (IA Filter):", error);
    return NextResponse.json({ error: 'Erro ao gerar recomendações' }, { status: 500 });
  }
}