# YouTube Recommendations Architecture

Este documento descreve as recentes alterações implementadas na arquitetura de recomendações de vídeo do YouTube, substituindo o cache obsoleto do `localStorage` e a recomendação de vídeo "global" (`videoRecommendations` no documento raiz do usuário) por uma abordagem moderna baseada em subcoleções por curso no Firebase.

## O Problema Anterior

Anteriormente, as recomendações de vídeo eram globais. A tipagem do Firebase ditava que todo o perfil do usuário pudesse guardar apenas uma matriz (`videoRecommendations`) com vídeos do Youtube. Isso causava dois grandes problemas:

1. **Contexto Sobrescrito:** Quando o usuário estava focado no curso de "Power BI" (onde o Gemini usa os prompts específicos de BI) e, em seguida, passava para "HTML & CSS", a nova busca substituía os últimos vídeos salvos ou misturava os links de programação com os de análise de dados.
2. **Falta de Escalabilidade para Cursos:** Com a inserção de novos cursos via `src/data/courses`, todos eles competiam pelo mesmo espaço vazio de vídeo.
3. **Persistência Limitada:** Os vídeos do curso anterior eram mantidos via `localStorage` no Frontend, o que quebrava o sincronismo se o usuário utilizasse outro computador ou dispositivo móvel.

## A Solução (Subcoleções Inteligentes)

A solução arquitetural transferiu a responsabilidade de "propriedade" das recomendações do `UserProfile` para dentro do contexto de cada Curso (`courseId`), gerando documentos segregados.

### 1. Novo Schema no Firestore

A estrutura de banco de dados passa a acompanhar individualmente as intenções de estudo:
`users/{uid}/youtube/{courseId}`

Esse documento obedece a nova Interface definida em `src/types.ts`:

```typescript
export interface CourseYouTubeRecs {
  videos: YouTubeVideo[];
  lastUpdated: string; // "YYYY-MM-DD"
}
```

### 2. Controle via Zustand (Store)

O hook encarregado de salvar dados de perfis (`useProfileStore.ts`) foi refatorado.

- Removemos os campos estáticos/globais: `videoRecommendations` e `videoRecsLastUpdated`.
- Adicionamos a função `fetchVideoRecs(uid, courseId)` (Busca a informação guardada isoladamente no Firebase).
- Modificamos a assinatura do recarregamento de vídeos usando a mesma lógica individualista: `updateVideoRecs(uid, courseId, videos)`.

### 3. Integração com a UI do Dashboard

O arquivo `src/app/(dashboard)/courses/[courseId]/page.tsx` agora puxa seus dados inteiramente da persistência no Firebase invés de olhar pro `localStorage`.

Quando um módulo do Dashboard é renderizado:

1. Ele tenta ler a subcoleção `{courseId}` do Firestore associada ao usuário (`uid`).
2. Verifica se a recomendação existe ou se passaram-se 7 dias (lógica customizável).
3. Caso afirmativo (velho ou ausente): aciona `/api/gemini/youtube-recs` avisando qual é o `courseId`, `moduleTitle`, e `focusArea` do aluno.
4. Salva a resposta do Gemini em sua via dedicada.

### 4. Isolamento e Injeção de Prompts

A API `youtube-recs` já estava preparada em `route.ts`. O código captura a prop `courseId` do body e executa `getCoursePrompts(effectiveCourseId)`.
Isto significa que na injeção feita pelo Dashboard:

- O painel de `power-bi` irá procurar em `/lib/ai/prompts/powerBi.ts` e enviar somente queries formatadas pra Análise de Dados.
- O painel de `html` irá procurar em `/lib/ai/prompts/htmlCss.ts` e recuperar somentes queries sobre UX/UI web, Front-end.

E o mais importante: os novos dados de banco não colidem, garantindo que o progresso permaneça fixo.
