import { powerBiPrompts } from "./power-bi";
import { licitacaoPrompts } from "./licitacao";
import { htmlPrompts } from "./html";
import { htmlCssPrompts } from "./htmlCss";
import { ytbPrompts } from "./ytb";
import { CoursePrompts } from "./types";

/**
 * Mapa de prompts por ID do curso
 * Facilita a busca dinâmica baseada no courseId
 */
export const coursePromptsMap: Record<string, CoursePrompts> = {
  "power-bi": powerBiPrompts,
  lic: licitacaoPrompts,
  css: htmlCssPrompts, // <--- Modificado de 'css-course' para 'css' (Slug GERAL usado nas rotas)
  html: htmlPrompts, // <--- Modificado de 'html-course' para 'html' (Slug GERAL usado nas rotas)
  ytb: ytbPrompts,
  "ytb-course": ytbPrompts,
};

/**
 * Retorna os prompts para um curso específico
 * @param courseId - ID do curso (ex: 'power-bi', 'lic', 'licitacao')
 * @returns Prompts do curso ou prompts do Power BI como fallback
 */
export function getCoursePrompts(courseId: string): CoursePrompts {
  const prompts = coursePromptsMap[courseId];

  if (!prompts) {
    console.warn(
      `⚠️ Prompts não encontrados para curso "${courseId}". Usando Power BI como fallback.`,
    );
    return powerBiPrompts;
  }

  return prompts;
}

// Exportar os prompts individuais para uso direto se necessário
export { powerBiPrompts } from "./power-bi";
export { licitacaoPrompts } from "./licitacao";
export { htmlPrompts } from "./html";
export { htmlCssPrompts } from "./htmlCss";
export { ytbPrompts } from "./ytb";
export type { CoursePrompts, CourseMetadata } from "./types";
