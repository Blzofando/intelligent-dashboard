import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI, GenerationConfig } from "@google/generative-ai";
import { YouTubeVideo } from '@/types';

// O Modelo Gemini com Search Tool
const geminiModelName = "gemini-1.5-flash-latest"; // Usando 'latest' para garantir compatibilidade
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);

const generationConfig: GenerationConfig = {
    responseMimeType: "application/json",
};

export async function POST(request: NextRequest) {
    try {
        const { focusArea, nextTopic } = await request.json() as { focusArea: string, nextTopic: string };

        // 1. O Prompt Forte para o Gemini usar a ferramenta de busca
        const prompt = `
          Sua tarefa é atuar como um Curador de Conteúdo de Carreira. O aluno está atualmente aprendendo sobre: "${nextTopic}".

          **Objetivo do Aluno:** O foco de carreira dele é: "${focusArea}".
         
          **Regra de Busca:** Encontre EXATAMENTE 3 vídeos do YouTube que sejam Relevantes e Complementares.
          Os vídeos devem atender a um destes critérios:
          1. **Alinhamento de Carreira:** Vídeos que mostrem como o Power BI se aplica à área de "${focusArea}".
          2. **Reforço:** Vídeos que aprofundem o tópico atual ("${nextTopic}").
          3. **Inspiração:** Tutoriais de dashboards avançados em Power BI.
         
          **Formato de Saída (JSON Obrigatório):**
          Responda APENAS com um array JSON de 3 objetos, usando as informações das fontes do Google Search Tool. Você DEVE usar o campo 'videoId' das fontes.
         
          [
            {
              "id": "[ID do Vídeo do YouTube (ex: 'dQw4w9WgXcQ')]",
              "title": "[Título Curto e Atraente]",
              "description": "[Resumo de uma linha sobre por que este vídeo é relevante para o foco de carreira]",
              "thumbnail": "https://img.youtube.com/vi/[ID do Vídeo do YouTube]/mqdefault.jpg",
              "embedUrl": "https://www.youtube.com/embed/[ID do Vídeo do YouTube]"
            }
          ]
        `;

        // 2. Chamada à IA com Google Search Tool ativada
        const model = genAI.getGenerativeModel({ 
            model: geminiModelName, 
            generationConfig,
            // --- CORREÇÃO AQUI ---
            // A ferramenta de busca se chama 'googleSearchRetrieval', e não 'google_search'
            tools: [{ googleSearchRetrieval: {} }] // Ativa a busca na web
        });
       
        const result = await model.generateContent(prompt);
        const responseText = result.response.text(); // Use .text()
       
        if (!responseText) {
            return NextResponse.json({ error: 'A IA não retornou conteúdo.' }, { status: 500 });
        }
       
        const videos: YouTubeVideo[] = JSON.parse(responseText);

        return NextResponse.json(videos);

    } catch (error) {
        console.error("Erro na API Youtube Recs:", error);
        return NextResponse.json({ error: 'Erro ao gerar recomendações' }, { status: 500 });
    }
}