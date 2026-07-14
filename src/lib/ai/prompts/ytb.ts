import { CoursePrompts } from './types';

/**
 * Todos os prompts específicos do curso de YouTube / Influencer Milionário
 * Centralizados em um único arquivo para fácil manutenção
 */
export const ytbPrompts: CoursePrompts = {
  flashcards: (moduleTitle: string, lessonTitles: string[]) => `
    Crie 5 flashcards para o módulo de YouTube/Influencer "${moduleTitle}", 
    baseado nos tópicos: ${lessonTitles.join(", ")}.
    
    Seu JSON deve seguir exatamente esta estrutura:
    [
        {
            "front": "Termo ou pergunta curta sobre o módulo de YouTube/Criação de Conteúdo que foi trabalhado",
            "back": "Definição clara, estratégia ou hack objetivo"
        }
    ]
    
    Gere 5 flashcards focados em conceitos práticos de YouTube, algoritmos, roteiros, edição e crescimento de canais.
  `,

  summary: (moduleTitle: string, lessonTitles: string[]) => `
    Gere um resumo conciso para o módulo do curso de YouTube/Influencer "${moduleTitle}", 
    que aborda os seguintes tópicos: ${lessonTitles.join(", ")}.
    
    O resumo deve:
    - Ter no máximo 100 palavras
    - Focar em aspectos práticos de crescimento no YouTube, edição de vídeo, estratégias virais ou monetização
    - Ser objetivo e direto
    - Mencionar aplicações reais e dicas para bombar canais (incluindo canais dark)
  `,

  youtubeFilter: (query: string, focus: string) => `
    Você é um especialista em YouTube, algoritmo e SEO de vídeo.
    O aluno está estudando criação de conteúdo para YouTube e tem o seguinte foco: "${focus}"
    Ele está buscando vídeos sobre: "${query}"

    Analise os 20 vídeos encontrados e selecione os 10 MELHORES e MAIS RELEVANTES.
    
    Critérios de seleção:
    - Priorize conteúdo atualizado e prático sobre YouTube e edição de vídeo
    - Foque em dicas aplicáveis de roteiro, edição, design de thumbnails ou estratégias de engajamento
    - Evite vídeos puramente promocionais ou com clickbait vazio
    - Prefira criadores experientes que mostram resultados reais
    - Considere a clareza e didática do conteúdo
    
    Responda APENAS com um array JSON dos 10 vídeos selecionados, no formato original.
  `,

  youtubeQuery: (moduleTitle: string, focusArea?: string) => {
    const topicQuery = `como crescer canal youtube "${moduleTitle}"`;

    if (focusArea && focusArea !== "Sem foco definido") {
      const focusQuery = `youtube tutorial "${moduleTitle}" ${focusArea}`;
      return [topicQuery, focusQuery];
    }

    return [topicQuery];
  },

  quiz: (moduleTitle: string, lessonTitles: string[]) => `
    Crie um quiz com 3 perguntas de múltipla escolha sobre YouTube e criação de conteúdo no módulo "${moduleTitle}", 
    com base nos tópicos: ${lessonTitles.join(", ")}.
    
    Formato JSON:
    [
        {
            "question": "Pergunta prática sobre YouTube/Criação de Conteúdo?",
            "options": ["Opção A", "Opção B", "Opção C", "Opção D"],
            "correctAnswer": "Opção correta (deve ser igual a uma das options)"
        }
    ]
    
    Requisitos:
    - 3 perguntas práticas sobre estratégias, algoritmos, edição, ou SEO de YouTube
    - Baseados em situações reais de criação de canais (incluindo dark e gringo)
    - Foque em situações reais que Youtubers enfrentam para reter público e monetizar
    - Evite perguntas teóricas desnecessárias
  `,

  chat: (context: string, userMessage: string) => `
    Você é um consultor estratégico e assistente especializado em YouTube, algoritmo, roteiros virais e canais Dark/Gringos.
    
    Contexto do aluno:
    ${context}
    
    Pergunta:
    ${userMessage}
    
    Responda de forma:
    - Clara, prática e direto ao ponto
    - Focada em dicas de alto valor sobre YouTube (retenção, CTR, SEO, edição)
    - Com exemplos práticos de canais ou hacks de crescimento
    - Sempre incentivando a consistência e boas práticas de produção
  `,
};
