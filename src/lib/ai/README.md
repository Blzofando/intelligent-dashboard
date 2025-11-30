# Estrutura de IA e APIs - LearnAI

## 📁 Nova Estrutura

```
src/
├── lib/
│   ├── ai/
│   │   ├── gemini.ts                    # Cliente Gemini reutilizável
│   │   ├── functions/
│   │   │   ├── flashcards.ts            # Função genérica de flashcards
│   │   │   ├── summary.ts               # Função genérica de resumo
│   │   │   ├── youtube.ts               # Função genérica de YouTube
│   │   │   └── quiz.ts                  # Função genérica de quiz
│   │   └── prompts/
│   │       ├── types.ts                 # Interfaces de prompts
│   │       ├── index.ts                 # Mapa de prompts por curso
│   │       ├── power-bi.ts              # Prompts do Power BI
│   │       ├── licitacao.ts             # Prompts de Licitação
│   │       └── template.ts.example      # Template para novos cursos
│   └── youtube/
│       └── search.ts                     # Busca no YouTube
└── app/
    └── api/
        ├── gemini/
        │   ├── flashcards/route.ts      # ✨ Refatorado
        │   ├── summary/route.ts         # ✨ Refatorado
        │   ├── youtube-recs/route.ts    # ✨ Refatorado
        │   ├── quiz/route.ts            # ✨ Refatorado
        │   ├── chat/route.ts            # (TODO)
        │   ├── generate-plan/route.ts   # ✅ Mantido (script)
        │   ├── reorganize-plan/route.ts # ⏸️ Mantido (refatorar depois)
        │   └── cron/route.ts            # ⏸️ Mantido (refatorar depois)
        ├── quiz/
        │   └── analyze-pbix/route.ts    # ✅ Mantido (específico PBI)
        └── pbix/route.ts                # ✅ Mantido (específico PBI)
```

---

## 🎯 Conceitos Principais

### 1. **Separação de Responsabilidades**

- **Funções Genéricas** (`lib/ai/functions`) - Lógica reutilizável
- **Prompts por Curso** (`lib/ai/prompts`) - Conteúdo específico
- **Rotas da API** (`app/api`) - Endpoints HTTP

### 2. **Fluxo de Funcionamento**

```
API Route
  ↓
getCoursePrompts(courseId) → Prompts do Curso
  ↓
createGeminiClient() → Cliente IA
  ↓
generateFlashcards(genAI, prompts, ...) → Função Genérica
  ↓
Resposta JSON
```

---

## 🚀 Como Usar

### Flashcards

```typescript
// Frontend - Adicione courseId
const response = await fetch('/api/gemini/flashcards', {
  method: 'POST',
  body: JSON.stringify({
    moduleTitle: 'DAX Básico',
    lessonTitles: ['Introdução ao DAX', 'Funções Calculate'],
    courseId: 'power-bi' // Opcional, padrão é 'power-bi'
  })
});
```

### Summary

```typescript
const response = await fetch('/api/gemini/summary', {
  method: 'POST',
  body: JSON.stringify({
    moduleTitle: 'DAX Básico',
    lessonTitles: ['Introdução ao DAX'],
    courseId: 'licitacao' // Usa prompts de licitação
  })
});
```

### YouTube

```typescript
const response = await fetch('/api/gemini/youtube-recs', {
  method: 'POST',
  body: JSON.stringify({
    moduleTitle: 'Pregão Eletrônico',
    focusArea: 'Vendas',
    courseId: 'licitacao'
  })
});
```

---

## ➕ Adicionando Funções de IA a um Novo Curso

Você criou um novo curso (ex: `java.ts` em `src/data/courses/`) e quer adicionar flashcards, resumo, quiz e recomendações do YouTube? Siga este passo a passo:

---

### 📋 **Passo 1: Clone um Arquivo de Prompts Existente**

```bash
# Na pasta src/lib/ai/prompts/
cp power-bi.ts java.ts
```

Ou use o template:
```bash
cp template.ts.example java.ts
```

---

### ✏️ **Passo 2: Adapte os Prompts ao Seu Curso**

Abra `src/lib/ai/prompts/java.ts` e personalize:

```typescript
import { CoursePrompts } from './types';

export const javaPrompts: CoursePrompts = {
  // 1️⃣ FLASHCARDS
  flashcards: (moduleTitle: string, lessonTitles: string[]) => `
    Crie 5 flashcards para o módulo de Java "${moduleTitle}", 
    baseado nos tópicos: ${lessonTitles.join(", ")}.
    
    Foque em conceitos de POO, APIs do Java e boas práticas.
    
    JSON: [{"front": "...", "back": "..."}]
  `,

  // 2️⃣ RESUMO
  summary: (moduleTitle: string, lessonTitles: string[]) => `
    Gere um resumo de 100 palavras para o módulo "${moduleTitle}".
    Tópicos: ${lessonTitles.join(", ")}.
    
    Foque em conceitos práticos de programação Java.
  `,

  // 3️⃣ QUIZ
  quiz: (moduleTitle: string, lessonTitles: string[]) => `
    Crie 3 perguntas sobre Java no módulo "${moduleTitle}".
    Tópicos: ${lessonTitles.join(", ")}.
    
    JSON: [{"question": "...", "options": [...], "correctAnswer": "..."}]
  `,

  // 4️⃣ YOUTUBE - Queries de busca
  youtubeQuery: (moduleTitle: string, focusArea?: string) => {
    const topicQuery = `tutorial Java "${moduleTitle}"`;
    if (focusArea && focusArea !== "Sem foco definido") {
      const focusQuery = `Java "${moduleTitle}" ${focusArea}`;
      return [topicQuery, focusQuery];
    }
    return [topicQuery];
  },

  // 5️⃣ YOUTUBE - Filtro com IA
  youtubeFilter: (query: string, focus: string) => `
    Você é curador de vídeos de programação Java.
    Aluno busca: "${query}"
    Foco: "${focus}"
    
    Dos 20 vídeos, selecione os 10 MELHORES sobre Java.
    Priorize tutoriais práticos e atualizados.
  `,

  // 6️⃣ CHAT (opcional)
  chat: (context: string, userMessage: string) => `
    Você é assistente de Java.
    Contexto: ${context}
    Pergunta: ${userMessage}
    
    Responda com exemplos de código quando relevante.
  `,
};
```

**💡 Dicas:**
- **Flashcards**: Foque em termos técnicos do seu curso
- **Summary**: Máximo 100 palavras, conceitos-chave
- **Quiz**: 3 perguntas práticas, não decoreba
- **YouTube**: Adapte as queries para palavras-chave do seu nicho

---

### 🔗 **Passo 3: Registre no Mapa de Prompts**

Edite `src/lib/ai/prompts/index.ts`:

```typescript
// 1. Adicione o import
import { javaPrompts } from './java';

// 2. Registre no mapa (use o mesmo ID do curso!)
export const coursePromptsMap: Record<string, CoursePrompts> = {
  'power-bi': powerBiPrompts,
  'lic': licitacaoPrompts,
  'licitacao': licitacaoPrompts,
  'java': javaPrompts,  // ← ADICIONE AQUI
};
```

**⚠️ IMPORTANTE**: O ID aqui deve ser **EXATAMENTE** igual ao `id` do seu curso em `src/data/courses/java.ts`!

Se o seu curso tem:
```typescript
export const courseData: Course = {
  id: "java",  // ← Use este ID
  // ...
};
```

---

### ✅ **Passo 4: Teste!**

As funções já funcionam automaticamente! Quando o aluno completar um módulo:

1. **Flashcards** → Usa `javaPrompts.flashcards()`
2. **Resumo** → Usa `javaPrompts.summary()`
3. **Quiz** → Usa `javaPrompts.quiz()`
4. **YouTube** → Usa `javaPrompts.youtubeQuery()` + `youtubeFilter()`

**Não precisa mexer em mais nada!** 🎉

---

### 🔍 **Exemplo Completo: Adicionando Curso de Python**

```bash
# 1. Clone o template
cp src/lib/ai/prompts/power-bi.ts src/lib/ai/prompts/python.ts

# 2. Edite python.ts (troque "Power BI" por "Python", adapte exemplos)
# 3. Registre em index.ts:
```

```typescript
import { pythonPrompts } from './python';

export const coursePromptsMap = {
  'power-bi': powerBiPrompts,
  'lic': licitacaoPrompts,
  'python': pythonPrompts,  // Adicione aqui
};
```

Pronto! Agora `/courses/python/module/X` terá IA funcionando!

---

---

## 🧪 Testando

### Teste Rápido de Prompts

```typescript
import { getCoursePrompts } from '@/lib/ai/prompts';

const prompts = getCoursePrompts('power-bi');
console.log(prompts.flashcards('DAX', ['CALCULATE']));
```

### Teste de API

```bash
# Flashcards
curl -X POST http://localhost:3000/api/gemini/flashcards \
  -H "Content-Type: application/json" \
  -d '{
    "moduleTitle": "DAX Básico",
    "lessonTitles": ["CALCULATE", "FILTER"],
    "courseId": "power-bi"
  }'
```

---

## 🔧 Manutenção

### Atualizar Prompts

Edite apenas o arquivo do curso:
- Power BI → `src/lib/ai/prompts/power-bi.ts`
- Licitação → `src/lib/ai/prompts/licitacao.ts`

### Atualizar Funções

Edite as funções genéricas:
- `src/lib/ai/functions/flashcards.ts`
- `src/lib/ai/functions/summary.ts`
- etc.

**Vantagem**: Uma mudança afeta todos os cursos!

---

## 📊 Comparação: Antes vs Depois

### ❌ Antes

```typescript
// api/gemini/flashcards/route.ts
const prompt = `Crie flashcards para Power BI "${moduleTitle}"...`; // Hardcoded!
```

**Problema**: Para adicionar curso novo, precisava duplicar código.

### ✅ Depois

```typescript
// lib/ai/prompts/power-bi.ts
export const powerBiPrompts = {
  flashcards: (moduleTitle) => `Crie flashcards para Power BI...`
};

// lib/ai/prompts/excel.ts
export const excelPrompts = {
  flashcards: (moduleTitle) => `Crie flashcards para Excel...`
};

// api/gemini/flashcards/route.ts
const prompts = getCoursePrompts(courseId); // Dinâmico!
const flashcards = await generateFlashcards(genAI, prompts, ...);
```

**Vantagem**: 
- ✅ Funções reutilizáveis
- ✅ Prompts separados
- ✅ Fácil adicionar cursos

---

## 🗑️ Arquivos Removidos

- ❌ `api/gemini/study-plan` - Obsoleto (substituído por `generate-plan`)

## 📝 Arquivos Mantidos para Refatoração Futura

- ⏸️ `api/gemini/reorganize-plan` - Desabilitado, refatorar depois
- ⏸️ `api/gemini/cron` - Desabilitado, refatorar depois

---

## 🎓 Exemplos de Prompts por Curso

### Power BI
- **Foco**: DAX, Power Query, visualizações
- **Estilo**: Prático, orientado a BI

### Licitação
- **Foco**: Lei 14.133/2021, pregão, documentação
- **Estilo**: Técnico, baseado em legislação

### Template
- **Foco**: [Defina o seu]
- **Estilo**: [Adapte ao curso]

---

## 🔐 Variáveis de Ambiente

```env
GEMINI_API_KEY=sua_chave_aqui
YOUTUBE_API_KEY=sua_chave_aqui
```

---

## 📚 Referências

- [Google Generative AI Node.js](https://github.com/google/generative-ai-js)
- [YouTube Data API v3](https://developers.google.com/youtube/v3)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)

---

## ✨ Conclusão

Esta nova estrutura permite:

1. ✅ **Reutilização máxima** - Funções genéricas
2. ✅ **Fácil manutenção** - Prompts separados
3. ✅ **Escalabilidade** - Adicionar curso em minutos
4. ✅ **Organização** - Código limpo e estruturado
5. ✅ **Flexibilidade** - Cada curso com suas características

**Para adicionar um novo curso, você só precisa:**
1. Copiar template de prompts
2. Adaptar ao seu contexto
3. Registrar no mapa
4. Pronto! 🚀
