<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1kdD15Nann8L51O8vCupJeidl28AKvdOW

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Como Adicionar Novos Cursos

Para adicionar um novo curso ao painel, siga estes passos:

1.  **Crie o Arquivo de Dados do Curso:**
    *   Vá para a pasta `src/data/courses/`.
    *   Crie um novo arquivo `.ts` (ex: `meu-curso.ts`) ou duplique um existente.
    *   Defina a estrutura do curso seguindo o modelo (interface `Course`).
    *   **Importante:** Certifique-se de que os IDs das aulas (`lessons`) sejam únicos e sigam um padrão (ex: `curso-F01`, `curso-F02`). Isso evita conflitos de progresso entre cursos.

2.  **Exporte os Dados do Curso:**
    *   No arquivo criado, exporte a constante do curso:
        ```typescript
        export const courseData: Course = {
            id: "meu-curso-id",
            slug: "meu-curso-slug",
            // ... restante dos dados
        };
        ```

3.  **Registre o Curso no Índice:**
    *   Abra o arquivo `src/data/courses/index.ts`.
    *   Importe o seu novo curso no topo do arquivo:
        ```typescript
        import { courseData as meuCurso } from './meu-curso';
        ```
    *   Adicione a variável importada ao array `courses`:
        ```typescript
        export const courses: Course[] = [
            powerBiCourse,
            licCourse,
            meuCurso // Adicione aqui
        ];
        ```

4.  **Verifique:**
    *   O curso deve aparecer automaticamente na lista de "Meus Cursos" e no painel lateral.

5.  **Adicionar Imagem do Curso:**
    *   Crie uma pasta `courses` dentro da pasta `public` (se não existir): `public/courses/`.
    *   Coloque a imagem do curso lá (ex: `minha-imagem.png`).
    *   No arquivo de dados do curso (`src/data/courses/meu-curso.ts`), atualize a propriedade `thumbnail`:
        ```typescript
        thumbnail: "/courses/minha-imagem.png", // Use o caminho absoluto a partir da pasta public
        ```

