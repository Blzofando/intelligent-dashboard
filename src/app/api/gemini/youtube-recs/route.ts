import { NextRequest, NextResponse } from 'next/server';
import { YouTubeVideo } from '@/types';
import { GoogleGenerativeAI } from "@google/generative-ai";

// --- CHAVES (YouTube e Gemini) ---
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY as string;
const YOUTUBE_API_URL = 'https://www.googleapis.com/youtube/v3/search';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY as string;
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const geminiModel = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });

// Interfaces
interface YouTubeApiItem {
  id: { videoId: string };
  snippet: { title: string; description: string; };
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
  if (!response.ok) {
    console.warn(`Aviso na busca do YouTube por "${query}": Status ${response.status}`);
    return [];
  }
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
    const cleanedJson = responseText.replace(/```json\n|```/g, "").trim();
    const filteredVideos: YouTubeApiItem[] = JSON.parse(cleanedJson);
    return filteredVideos;

  } catch (e) {
    console.error("Erro do Gemini ao filtrar:", e);
    return videos.slice(0, 10); // Retorna os 10 primeiros se a IA falhar
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
    
    // --- MUDANÇA NAS QUERIES (MAIS AMPLAS) ---
    // Em vez de usar 'nextTopic' (a aula), usamos 'moduleTitle' (o módulo).
    
    // Busca 1: Tópico Geral do Módulo
    // Ex: "tutorial Power BI DAX"
    const topicQuery = `tutorial Power BI "${moduleTitle}"`;
    
    // Busca 2: Foco aplicado ao Módulo
    // Ex: "Power BI DAX para Vendas"
    const focusQuery = `Power BI "${moduleTitle}" aplicado a "${focusArea}"`;
    // --- FIM DA MUDANÇA ---

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

    // 3. Usar o Gemini para filtrar os 20 resultados
    const finalQuery = hasFocus ? `${topicQuery} E ${focusQuery}` : topicQuery;
    const filteredVideos = await filterWithGemini(searchResults, finalQuery, focusArea);

    // 4. Formatar os 10 vídeos finais
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

    return NextResponse.json(videos);

  } catch (error) {
    console.error("Erro na API Youtube Recs (IA Filter):", error);
    return NextResponse.json({ error: 'Erro ao gerar recomendações' }, { status: 500 });
  }
}