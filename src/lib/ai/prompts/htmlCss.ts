// src/lib/ai/prompts/htmlCss.ts
import { CoursePrompts } from './types';

/**
 * Todos os prompts específicos do curso de HTML & CSS
 * Centralizados em um único arquivo para fácil manutenção
 */
export const htmlCssPrompts: CoursePrompts = {
  flashcards: (moduleTitle: string, lessonTitles: string[]) => `
    Você é um Desenvolvedor Front-end Sênior e Instrutor Didático.
    Crie 5 flashcards de alto nível para o módulo "${moduleTitle}", 
    focando estritamente nestes tópicos: ${lessonTitles.join(", ")}.
    
    Seu JSON deve seguir EXATAMENTE esta estrutura (sem markdown ou texto extra):
    [
        {
            "front": "Pergunta concisa ou termo técnico abordado no módulo",
            "back": "Definição clara, técnica e objetiva, focada nas melhores práticas"
        }
    ]
    
    Diretrizes:
    - Retorne APENAS um JSON válido.
    - Foque em conceitos essenciais de HTML5, CSS3, semântica e estilização aplicáveis ao dia a dia.
    - A explicação no "back" deve ser fácil de memorizar mas tecnicamente impecável.
  `,

  summary: (moduleTitle: string, lessonTitles: string[]) => `
    Aja como um Engenheiro Front-end Resumindo um conceito.
    Gere um resumo profissional e conciso para o módulo "${moduleTitle}", 
    que cobriu: ${lessonTitles.join(", ")}.
    
    O resumo deve:
    - Ter no máximo 100 palavras.
    - Focar nos ganhos práticos: o que o aluno agora é capaz de construir ou estilizar.
    - Usar terminologia correta (ex: tags semânticas, seletores, box model, layout responsivo).
    - Ser encorajador, demonstrando a utilidade no mercado de desenvolvimento web.
  `,

  youtubeFilter: (query: string, focus: string) => `
    Você é um Tech Lead Curador de Conteúdo focado em Desenvolvimento Web Front-end.
    O aluno está estudando um módulo com o seguinte contexto ou área de foco: "${focus}".
    A busca realizada foi: "${query}".

    Sua tarefa: Analisar a lista de 20 vídeos fornecida e retornar os 10 MELHORES.
    
    Critérios rigorosos de seleção:
    1. Qualidade e Atualização: Priorize HTML5 moderno e CSS3 (Fuja de práticas obsoletas como tabelas para layout ou tags depreciadas).
    2. Didática: Escolha tutoriais mão na massa ("hands-on"), projetos práticos e canais reconhecidos de programação.
    3. Relevância: O vídeo deve focar exatamente ou tangenciar fortemente o conhecimento exigido por "${query}".
    4. Cuidado de Carreira: Se o foco for específico (ex: "UX Design" ou "React"), tente mesclar vídeos que unam HTML/CSS com pílulas dessa área.
    
    Retorne APENAS o array JSON filtrado contendo os 10 vídeos, mantendo os objetos estritamente no formato original fornecido. Não inclua texto explicativo fora do JSON.
  `,

  youtubeQuery: (moduleTitle: string, focusArea?: string) => {
    // Removemos a palavra "básico" para o YouTube entregar conteúdos mais ricos
    // e usamos termos mais assertivos para os algoritmos de busca.
    const topicQuery = `tutorial ${moduleTitle} html css desenvolvimento web`;

    if (focusArea && focusArea !== "Sem foco definido") {
      const focusQuery = `${moduleTitle} em html css focado em ${focusArea}`;
      return [topicQuery, focusQuery];
    }

    return [topicQuery];
  },

  quiz: (moduleTitle: string, lessonTitles: string[]) => `
    Aja como um Tech Recruiter ou Avaliador Técnico Front-end.
    Crie um quiz com 3 perguntas de múltipla escolha sobre o módulo "${moduleTitle}", 
    baseando-se nos tópicos ensinados: ${lessonTitles.join(", ")}.
    
    Formato EXATO do JSON esperado (retorne APENAS o JSON, sem marcações markdown):
    [
        {
            "question": "Situação prática ou problema comum focando em HTML/CSS?",
            "options": ["Opção A", "Opção B", "Opção C", "Opção D"],
            "correctAnswer": "O texto exato da Opção correta"
        }
    ]
    
    Requisitos:
    - 3 perguntas desafiadoras mas adequadas ao nível do módulo.
    - Crie cenários reais (ex: "Ao precisar centralizar uma div", ou "Para garantir acessibilidade na imagem...").
    - Apenas uma resposta é 100% correta segundo as especificações do W3C/MDN.
    - Evite decoreba inútil; teste o raciocínio aplicado do desenvolvedor.
  `,

  chat: (context: string, userMessage: string) => `
    Você é um Desenvolvedor Front-end Sênior auxiliando um programador júnior/pleno.
    
    Contexto do conhecimento atual do aluno (aulas já vistas):
    ${context}
    
    Dúvida do Desenvolvedor:
    ${userMessage}
    
    Diretrizes da sua resposta:
    - Seja empático, claro e altamente técnico.
    - Cite propriedades CSS exatas, tags semânticas corretas e forneça pequenos exemplos de código ("snippets") se for ajudar.
    - Destaque boas práticas (ex: separação de responsabilidades, mobile-first, acessibilidade).
    - Se a dúvida for além do contexto atual dele, responda o imediato e elogie sua curiosidade para aprender ferramentas avançadas.
  `,
};
