import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { moduleTitle, lessonTitles } = await req.json();

    if (!moduleTitle || !lessonTitles) {
      return NextResponse.json({ error: 'Parâmetros ausentes' }, { status: 400 });
    }

    const systemPrompt = `
      Você é um designer instrucional sênior de Power BI.
      Sua missão é criar um desafio prático COMPLETO e detalhado.
      A resposta DEVE ser um OBJETO JSON VÁLIDO.

      O JSON deve ter exatamente 2 chaves de nível superior: "files" e "tasks".

      1. "files": [ ... ]
         (Gere 1 ou 2 objetos de arquivo Excel aqui, com "fileName", "description", "sheets", "columns" e "rows", como você já configurou)
         Exemplo:
         {
           "fileName": "vendas.xlsx",
           "description": "Dados de vendas e produtos.",
           "sheets": [
             { "sheetName": "Vendas", "columns": ["IDVenda", "IDProduto", "Data", "Valor"], "rows": [[1, 10, "2024-01-01", 100], [2, 20, "2024-01-02", 150]] },
             { "sheetName": "Produtos", "columns": ["IDProduto", "Nome", "Categoria"], "rows": [[10, "Produto A", "Cat 1"], [20, "Produto B", "Cat 2"]] }
           ]
         }

      2. "tasks": [ ... ]
         (Gere um array de 4-6 objetos de tarefa. CADA tarefa DEVE ter esta estrutura:)
         {
           "title": "1. Importação e Limpeza de Dados",
           "description": "Importe as planilhas 'Vendas' e 'Produtos' do arquivo 'vendas.xlsx'. Na consulta 'Vendas', remova valores nulos da coluna 'Valor' e renomeie 'Data' para 'Data da Venda'.",
           "hint": "Para importar, vá em 'Página Inicial' > 'Obter Dados' > 'Excel'. No Power Query, clique com o botão direito na coluna para 'Remover Nulos' ou 'Renomear'.",
           "spec": [
             "powerQuery: Importar planilha 'Vendas'",
             "powerQuery: Importar planilha 'Produtos'",
             "powerQuery: Remover nulos da coluna 'Valor' (na consulta Vendas)",
             "powerQuery: Renomear coluna 'Data' para 'Data da Venda' (na consulta Vendas)"
           ]
         }
         (Gere outras tarefas para Modelagem, DAX e Visuais, seguindo a mesma estrutura)
    `;

    const userMessage = `
      Gere um desafio completo para o módulo: "${moduleTitle}"
      Aulas do módulo:
      ${lessonTitles.map((title: string) => `- ${title}`).join('\n')}
    `;

    const response = await openai.chat.completions.create({
      model: 'gpt-4.1-2025-04-14',
      response_format: { type: "json_object" },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
    });

    const jsonResponse = response.choices[0].message?.content;
    if (!jsonResponse) {
      throw new Error("A resposta da OpenAI estava vazia.");
    }

    // Retorna o JSON completo: { files, tasks }
    return NextResponse.json(JSON.parse(jsonResponse));

  } catch (error) {
    console.error('Erro ao gerar desafio PBIX com OpenAI:', error);
    return NextResponse.json({ error: 'Erro interno ao gerar desafio' }, { status: 500 });
  }
}