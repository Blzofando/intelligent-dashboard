// src/lib/ai/prompts/licitacao.ts
import { CoursePrompts } from './types';

/**
 * Todos os prompts específicos do curso de Licitação
 * Centralizados em um único arquivo para fácil manutenção
 */
export const htmlPrompts: CoursePrompts = {
  flashcards: (moduleTitle: string, lessonTitles: string[]) => `
    Crie 5 flashcards para o módulo de HTML "${moduleTitle}", 
    baseado nos tópicos: ${lessonTitles.join(", ")}.
    
    Seu JSON deve seguir exatamente esta estrutura:
    [
        {
            "front": "Termo ou pergunta curta sobre o módulo atual que foi trabalhado",
            "back": "Definição clara e objetiva"
        }
    ]
    
    Gere 5 flashcards focados em conceitos práticos de HTML e CSS mas foco principal no módulo que foi estudado.
    
  `,

  summary: (moduleTitle: string, lessonTitles: string[]) => `
    Gere um resumo conciso para o módulo do curso de HTML e CSS "${moduleTitle}", 
    que aborda os seguintes tópicos: ${lessonTitles.join(", ")}.
    
    O resumo deve:
    - Ter no máximo 100 palavras
    - Focar em aspectos práticos da HTML e CSS
    - Ser objetivo e direto
    - Mencionar aplicações no dia a dia de quem trabalha nesta área
  `,

  youtubeFilter: (query: string, focus: string) => `
    Você é um curador de conteúdo sênior especializado em HTML e CSS.
    O aluno está estudando HTML e CSS básico e tem o seguinte foco: "${focus}"
    Ele está buscando vídeos sobre: "${query}"

    Analise os 20 vídeos encontrados e selecione os 10 MELHORES e MAIS RELEVANTES.
    
    Critérios de seleção:
    - Priorize conteúdo atualizado (HTML e CSS básico)
    - Foque em aplicações práticas para quem trabalha nesta área
    - Evite conteúdo muito teórico ou acadêmico
    - Prefira vídeos de profissionais da área
    - Considere a clareza e didática do conteúdo
    
    Responda APENAS com um array JSON dos 10 vídeos selecionados, no formato original.
  `,

  youtubeQuery: (moduleTitle: string, focusArea?: string) => {
    const topicQuery = `tutorial html e css "${moduleTitle}" básico`;

    if (focusArea && focusArea !== "Sem foco definido") {
      const focusQuery = `html e css "${moduleTitle}" ${focusArea}`;
      return [topicQuery, focusQuery];
    }

    return [topicQuery];
  },

  quiz: (moduleTitle: string, lessonTitles: string[]) => `
    Crie um quiz com 3 perguntas de múltipla escolha sobre HTML e CSS no módulo "${moduleTitle}", 
    com base nos tópicos: ${lessonTitles.join(", ")}.
    
    Formato JSON:
    [
        {
            "question": "Pergunta sobre HTML e CSS?",
            "options": ["Opção A", "Opção B", "Opção C", "Opção D"],
            "correctAnswer": "Opção correta (deve ser igual a uma das options)"
        }
    ]
    
    Requisitos:
    - 3 perguntas práticas sobre HTML e CSS
    - Baseados em situações que envolva a area
    - Foque em situações reais que programadores iniciantes enfrentam
    - Evite pegadinhas ou questões muito decorebas
  `,

  chat: (context: string, userMessage: string) => `
    Você é um assistente especializado em HTML e CSS.
    
    Contexto do aluno:
    ${context}
    
    Pergunta:
    ${userMessage}
    
    Responda de forma:
    - Clara e prática
    - Baseada na HTML e CSS
    - Com exemplos do dia a dia de quem trabalha nesta area de programação de html e css iniciante
    - Incentivando boas práticas
  `,
};
