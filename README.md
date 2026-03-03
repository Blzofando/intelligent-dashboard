# 📚 Guia Completo de Integração de Novos Cursos

Este é o guia definitivo para adicionar um novo curso ao **Intelligent Dashboard**. Siga este passo a passo para integrar completamente um novo curso com todas as funcionalidades de IA do sistema.

---

## 📋 Índice

1. [Visão Geral do Sistema](#visão-geral-do-sistema)
2. [Pré-requisitos](#pré-requisitos)
3. [Passo a Passo de Integração](#passo-a-passo-de-integração)
4. [Estrutura de Arquivos](#estrutura-de-arquivos)
5. [Testando a Integração](#testando-a-integração)
6. [Troubleshooting](#troubleshooting)

---

## 🔍 Visão Geral do Sistema

O Intelligent Dashboard é uma plataforma de estudos que oferece:

- 📖 **Gerenciamento de Cursos e Módulos**
- 🤖 **IA Integrada** (Gemini) para gerar resumos, flashcards, quizzes e recomendações
- 📊 **Planos de Estudo Personalizados** com reorganização automática
- 🎯 **Sistema de Ofensiva (Streak)** com verificação diária
- 🎥 **Recomendações de Vídeos do YouTube** filtradas por IA

Cada curso precisa estar integrado em **três camadas** principais:

1. **Camada de Dados** - Estrutura do curso (módulos, aulas, IDs)
2. **Camada de IA** - Prompts customizados para cada funcionalidade
3. **Camada Visual** - Imagem thumbnail do curso 

---

## ✅ Pré-requisitos

Antes de começar, você deve ter:

1. **Arquivo de Dados do Curso** (`.ts`) seguindo o padrão do projeto
2. **Imagem do Curso** (PNG/JPG, recomendado: 1200x600px)
3. **Conhecimento do Domínio** para criar prompts de IA eficazes

---

## 🚀 Passo a Passo de Integração

### **PASSO 1: Criar o Arquivo de Dados do Curso**

#### 📍 Local: `src/data/courses/`

Crie um novo arquivo seguindo o padrão `nome-do-curso.ts`.

**Exemplo:** `excel-avancado.ts`

```typescript
import { Course } from '../../types';

export const courseData: Course = {
    id: "excel",           // ID único (usado nas rotas e APIs)
    slug: "excel",         // Slug para URLs amigáveis
    title: "Excel Avançado",
    description: "Domine Excel com fórmulas avançadas, tabelas dinâmicas e automação",
    thumbnail: "/courses/excel-avancado.png",
    
    categories: [
        {
            name: "Todos os Módulos",
            moduleIds: ["excel-Module-1", "excel-Module-2", "excel-Module-3"]
        },
        {
            name: "Fórmulas",
            moduleIds: ["excel-Module-1"]
        }
    ],
    
    modules: [
        {
            id: "excel-Module-1",
            title: "Fórmulas Essenciais",
            lessons: [
                { id: "excel-F001", title: "PROCV e PROCH" },
                { id: "excel-F002", title: "SE e SE Aninhado" },
                { id: "excel-F003", title: "SOMASE e CONT.SE" }
            ]
        },
        {
            id: "excel-Module-2",
            title: "Tabelas Dinâmicas",
            lessons: [
                { id: "excel-F004", title: "Criando Tabelas Dinâmicas" },
                { id: "excel-F005", title: "Campos Calculados" }
            ]
        }
    ]
};
```

**⚠️ IMPORTANTE - Padrão de IDs:**

- **Course ID**: Único, minúsculas, sem espaços (ex: `excel`, `python`, `marketing`)
- **Module ID**: `{courseId}-Module-{número}` (ex: `excel-Module-1`)
- **Lesson ID**: `{courseId}-F{número}` com zero-padding (ex: `excel-F001`, `excel-F099`)

> [!CAUTION]
> **IDs devem ser únicos em TODO o sistema!** Usar IDs duplicados causará conflitos no progresso dos usuários.

---

### **PASSO 2: Registrar o Curso no Índice**

#### 📍 Local: `src/data/courses/index.ts`

```typescript
import { Course } from '../../types';
import { courseData as powerBiCourse } from './power-bi';
import { courseData as licCourse } from './lic-ext';
import { courseData as excelCourse } from './excel-avancado'; // ✅ ADICIONE ESTA LINHA

export const courses: Course[] = [
    powerBiCourse,
    licCourse,
    excelCourse  // ✅ ADICIONE SEU CURSO AQUI
];

export const getCourseBySlug = (slug: string): Course | undefined => {
    return courses.find(course => course.slug === slug);
};
```

---

### **PASSO 3: Criar Prompts de IA para o Curso**

#### 📍 Local: `src/lib/ai/prompts/`

#### 3.1 - Copie o Template

```bash
cp src/lib/ai/prompts/template.ts.example src/lib/ai/prompts/excel.ts
```

#### 3.2 - Adapte os Prompts

Edite `src/lib/ai/prompts/excel.ts` e customize cada função:

```typescript
import { CoursePrompts } from './types';

export const excelPrompts: CoursePrompts = {
    /**
     * Gera flashcards para o curso
     */
    flashcards: (moduleTitle: string, lessonTitles: string[]) => `
        Crie 5 flashcards para o módulo de Excel "${moduleTitle}", 
        baseado nos tópicos: ${lessonTitles.join(", ")}.
        
        Formato JSON: 
        [
            {
                "front": "Pergunta sobre fórmulas do Excel",
                "back": "Resposta clara com exemplo de uso"
            }
        ]
        
        Priorize:
        - Fórmulas práticas e aplicações reais
        - Atalhos de teclado importantes
        - Boas práticas de organização
    `,

    /**
     * Gera resumo do módulo
     */
    summary: (moduleTitle: string, lessonTitles: string[]) => `
        Gere um resumo conciso para o módulo "${moduleTitle}" do curso de Excel.
        Tópicos: ${lessonTitles.join(", ")}.
        
        O resumo deve:
        - Ter no máximo 100 palavras
        - Focar em aplicações práticas
        - Mencionar as principais fórmulas/recursos
    `,

    /**
     * Filtra vídeos do YouTube com IA
     */
    youtubeFilter: (query: string, focus: string) => `
        Você é um curador de conteúdo especializado em Excel.
        Foco do aluno: "${focus}"
        Busca: "${query}"
        
        Selecione os 10 MELHORES vídeos dentre os 20 encontrados.
        
        Priorize:
        - Tutoriais práticos e diretos
        - Instrutores com boa didática
        - Conteúdo em português
        - Vídeos atualizados (Excel 2019+)
        
        Responda APENAS com o array JSON dos 10 vídeos.
    `,

    /**
     * Gera queries de busca do YouTube
     */
    youtubeQuery: (moduleTitle: string, focusArea?: string) => {
        const topicQuery = `tutorial Excel "${moduleTitle}" português`;
        
        if (focusArea && focusArea !== "Sem foco definido") {
            const focusQuery = `Excel "${moduleTitle}" ${focusArea}`;
            return [topicQuery, focusQuery];
        }
        
        return [topicQuery];
    },

    /**
     * Gera quiz com múltipla escolha
     */
    quiz: (moduleTitle: string, lessonTitles: string[]) => `
        Crie 3 perguntas de múltipla escolha sobre Excel no módulo "${moduleTitle}".
        Tópicos: ${lessonTitles.join(", ")}.
        
        Formato JSON:
        [
            {
                "question": "Qual fórmula é usada para...?",
                "options": ["=PROCV()", "=SOMASE()", "=SE()", "=ÍNDICE()"],
                "correctAnswer": "=PROCV()"
            }
        ]
        
        Requisitos:
        - Perguntas práticas sobre fórmulas
        - Foque em situações reais de trabalho
        - Evite pegadinhas
    `,

    /**
     * Assistente de chat
     */
    chat: (context: string, userMessage: string) => `
        Você é um especialista em Excel.
        
        Contexto do aluno:
        ${context}
        
        Pergunta:
        ${userMessage}
        
        Responda de forma:
        - Clara e objetiva
        - Com exemplos de fórmulas quando aplicável
        - Incentivando boas práticas
    `
};
```

> [!TIP]
> **Dica de Qualidade:** Quanto mais específicos forem seus prompts, melhores serão as respostas da IA. Mencione:
> - Ferramentas/conceitos específicos do curso
> - Normas/padrões relevantes (ex: Lei 14.133 para Licitações)
> - Tipo de linguagem (técnica, didática, prática)

---

### **PASSO 4: Registrar os Prompts no Sistema**

#### 📍 Local: `src/lib/ai/prompts/index.ts`

```typescript
import { powerBiPrompts } from './power-bi';
import { licitacaoPrompts } from './licitacao';
import { excelPrompts } from './excel';  // ✅ ADICIONE ESTA LINHA
import { CoursePrompts } from './types';

export const coursePromptsMap: Record<string, CoursePrompts> = {
    'power-bi': powerBiPrompts,
    'lic': licitacaoPrompts,
    'licitacao': licitacaoPrompts,
    'excel': excelPrompts,  // ✅ ADICIONE O MAPEAMENTO
};

export function getCoursePrompts(courseId: string): CoursePrompts {
    const prompts = coursePromptsMap[courseId];

    if (!prompts) {
        console.warn(`⚠️ Prompts não encontrados para curso "${courseId}". Usando Power BI como fallback.`);
        return powerBiPrompts;
    }

    return prompts;
}

export { powerBiPrompts } from './power-bi';
export { licitacaoPrompts } from './licitacao';
export { excelPrompts } from './excel'; // ✅ ADICIONE ESTA LINHA
export type { CoursePrompts, CourseMetadata } from './types';
```

**⚠️ IMPORTANTE:** O `courseId` no `coursePromptsMap` deve ser **exatamente igual** ao `id` do curso no arquivo de dados.

---

### **PASSO 5: Adicionar Imagem do Curso**

#### 📍 Local: `public/courses/`

1. **Crie a pasta** (se não existir):
   ```
   public/courses/
   ```

2. **Adicione a imagem** do curso:
   - Nome sugerido: `{course-slug}.png` (ex: `excel-avancado.png`)
   - Tamanho recomendado: **1200x600px** (proporção 2:1)
   - Formato: PNG ou JPG
   - Peso ideal: < 500KB

3. **Atualize o `thumbnail`** no arquivo de dados:
   ```typescript
   thumbnail: "/courses/excel-avancado.png"
   ```

> [!NOTE]
> O caminho começa com `/` pois aponta para a pasta `public/`. O Next.js serve automaticamente os arquivos estáticos dessa pasta.

---

### **PASSO 6: (Opcional) Adicionar Durações das Aulas**

#### 📍 Local: `src/data/lessonDurations.json`

Se você tem as durações das aulas, adicione ao arquivo JSON:

```json
{
  "pbi-F001": 420,
  "lic-F01": 360,
  "excel-F001": 540,
  "excel-F002": 480,
  "excel-F003": 600
}
```

**Formato:** `"lessonId": duração_em_segundos`

> [!TIP]
> As durações são usadas para calcular o plano de estudos personalizado. Se não informar, o sistema usa um fallback de 300 segundos (5 minutos) por aula.

---

## 📁 Estrutura de Arquivos

Após a integração completa, você terá modificado/criado:

```
intelligent-dashboard/
├── public/
│   └── courses/
│       └── excel-avancado.png          # ✅ NOVA IMAGEM
│
├── src/
│   ├── data/
│   │   ├── courses/
│   │   │   ├── index.ts                # ✏️ MODIFICADO (import + array)
│   │   │   ├── excel-avancado.ts       # ✅ NOVO ARQUIVO
│   │   │   ├── power-bi.ts
│   │   │   └── lic-ext.ts
│   │   │
│   │   └── lessonDurations.json        # ✏️ OPCIONAL (adicionar durações)
│   │
│   └── lib/
│       └── ai/
│           └── prompts/
│               ├── index.ts            # ✏️ MODIFICADO (import + mapa)
│               ├── excel.ts            # ✅ NOVO ARQUIVO
│               ├── template.ts.example
│               ├── power-bi.ts
│               ├── licitacao.ts
│               └── types.ts
```

---

## 🧪 Testando a Integração

### Checklist de Testes

- [ ] **1. Curso aparece na lista**
  - Acesse `/` (home)
  - Verifique se o card do curso aparece em "Meus Cursos"
  - Confirme se a imagem está carregando

- [ ] **2. Painel do curso funciona**
  - Clique no curso
  - Verifique se os módulos e aulas estão listados
  - Tente marcar uma aula como completa

- [ ] **3. Funcionalidades de IA**
  - **Resumo**: Em um módulo, clique em "Gerar Resumo"
  - **Flashcards**: Clique em "Gerar Flashcards"
  - **Quiz**: Clique em "Gerar Quiz"
  - **Vídeos**: Verifique se o filtro de vídeos do YouTube funciona

- [ ] **4. Plano de Estudos**
  - Abra o modal de criação de plano
  - Selecione o novo curso
  - Gere um plano e verifique se as aulas aparecem corretamente

- [ ] **5. Chat (Assistente)**
  - Abra o chat
  - Faça uma pergunta sobre o conteúdo do curso
  - Verifique se a resposta está no contexto correto

### Testando via DevTools

Abra o console do navegador (F12) e procure por:

```javascript
// ✅ SEM ERROS
// ❌ "Prompts não encontrados para curso..."
// ❌ "Course not found"
```

---

## 🐛 Troubleshooting

### Problema: Curso não aparece na lista

**Possíveis causas:**
- ❌ Esqueceu de adicionar ao `courses[]` em `src/data/courses/index.ts`
- ❌ Erro de sintaxe no arquivo de dados do curso

**Solução:**
```bash
# Verifique erros de TypeScript
npx tsc --noEmit

# Reinicie o servidor
npm run dev
```

---

### Problema: Imagem do curso não carrega

**Possíveis causas:**
- ❌ Arquivo não está em `public/courses/`
- ❌ Caminho errado no `thumbnail`
- ❌ Nome do arquivo com erro de digitação

**Solução:**
```typescript
// ✅ CORRETO (caminho absoluto a partir de public/)
thumbnail: "/courses/excel-avancado.png"

// ❌ ERRADO
thumbnail: "public/courses/excel-avancado.png"
thumbnail: "./courses/excel-avancado.png"
```

---

### Problema: IA usa prompts errados

**Possíveis causas:**
- ❌ `courseId` no mapa de prompts diferente do `id` no arquivo de dados
- ❌ Esqueceu de adicionar o import em `src/lib/ai/prompts/index.ts`

**Solução:**
```typescript
// Verifique se os IDs são EXATAMENTE iguais:

// Em src/data/courses/excel-avancado.ts
id: "excel"  // ← Este ID

// Em src/lib/ai/prompts/index.ts
'excel': excelPrompts  // ← Deve ser igual
```

---

### Problema: Progresso compartilhado entre cursos

**Causa:**
- ❌ IDs de aulas duplicados entre cursos

**Solução:**
Sempre use prefixo único por curso:
```typescript
// ✅ CORRETO
{ id: "excel-F001", ... }  // Curso Excel
{ id: "pbi-F001", ... }    // Curso Power BI

// ❌ ERRADO (IDs iguais)
{ id: "F001", ... }  // Curso Excel
{ id: "F001", ... }  // Curso Power BI
```

---

### Problema: Plano de estudos não inclui o curso

**Possíveis causas:**
- ❌ Nenhuma aula foi marcada como "não completada"
- ❌ Todas as aulas já estão completas

**Solução:**
- Resete o progresso em: Perfil → Resetar Progresso
- Ou adicione novas aulas ao curso

---

## 📚 Referências Rápidas

### Interfaces TypeScript

```typescript
// Course (src/types.ts)
interface Course {
    id: string;
    slug: string;
    title: string;
    description?: string;
    thumbnail?: string;
    modules: Module[];
    categories?: CourseCategory[];
}

// Module
interface Module {
    id: string;
    title: string;
    lessons: Lesson[];
}

// Lesson
interface Lesson {
    id: string;
    title: string;
    materialUrl?: string;
}

// CoursePrompts (src/lib/ai/prompts/types.ts)
interface CoursePrompts {
    flashcards: (moduleTitle: string, lessonTitles: string[]) => string;
    summary: (moduleTitle: string, lessonTitles: string[]) => string;
    youtubeFilter: (query: string, focus: string) => string;
    youtubeQuery: (moduleTitle: string, focusArea?: string) => string[];
    quiz: (moduleTitle: string, lessonTitles: string[]) => string;
    chat: (context: string, userMessage: string) => string;
}
```

---

## 🎯 Checklist Final

Antes de considerar a integração completa:

- [ ] Arquivo de dados do curso criado
- [ ] Curso registrado no `index.ts` de courses
- [ ] Arquivo de prompts criado e customizado
- [ ] Prompts registrados no `index.ts` de prompts
- [ ] Imagem do curso adicionada em `public/courses/`
- [ ] IDs únicos para todas as aulas
- [ ] Testado: curso aparece na lista
- [ ] Testado: funcionalidades de IA funcionam
- [ ] Testado: plano de estudos inclui o curso
- [ ] (Opcional) Durações das aulas adicionadas

---

## 🚢 Deploy

Após integrar o curso localmente:

```bash
# 1. Commit das mudanças
git add .
git commit -m "feat: adicionar curso de Excel Avançado"

# 2. Push para o repositório
git push origin main

# 3. Deploy no Vercel
vercel --prod
```

O Vercel vai automaticamente fazer o build e deploy da aplicação.

---

## 💡 Dicas Finais

1. **Mantenha consistência:** Use o mesmo padrão de nomenclatura dos cursos existentes
2. **Prompts detalhados:** Quanto mais contexto você der à IA, melhores serão os resultados
3. **IDs únicos:** Sempre prefixe os IDs das aulas com o código do curso
4. **Teste tudo:** Não confie que "deve funcionar", teste todas as funcionalidades
5. **Documentação:** Anote peculiaridades do curso para manutenção futura

---

## 🆘 Precisa de Ajuda?

Se encontrou algum problema não coberto neste guia:

1. Verifique os logs do console do navegador (F12)
2. Rode `npx tsc --noEmit` para ver erros de TypeScript
3. Compare seu código com os cursos existentes (Power BI e Licitações)
4. Revise os 6 passos deste guia com atenção

---

**Pronto!** 🎉 Seu curso está integrado no Intelligent Dashboard com todas as funcionalidades de IA ativadas!
