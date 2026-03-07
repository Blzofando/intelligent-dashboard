import { NextRequest, NextResponse } from "next/server";
import { createGeminiClient, createGeminiModel } from "@/lib/ai/gemini";

export async function POST(request: NextRequest) {
  try {
    const { moduleTitle, courseId, challenge, studentFiles } =
      await request.json();

    if (!studentFiles || studentFiles.length === 0) {
      return NextResponse.json(
        { error: "Nenhum arquivo enviado para avaliação." },
        { status: 400 },
      );
    }

    const genAI = createGeminiClient();
    const fallbackModels = [
      "gemini-3.1-flash-lite-preview",
      "gemini-2.5-pro",
      "gemini-2.5-flash",
      "gemini-1.5-pro",
    ];

    let evaluation = null;
    let lastError = null;

    const prompt = `
            Você é um Engenheiro de Software Sênior avaliando a submissão de um aluno de Front-end.
            O aluno devia resolver o seguinte desafio sobre "${moduleTitle}":
            
            CENÁRIO:
            ${challenge.historia_contexto}

            INSTRUÇÕES QUE O ALUNO DEVERIA SEGUIR:
            ${challenge.instrucoes ? challenge.instrucoes.map((i: string) => `- ${i}`).join("\n") : "N/A"}
            
            TEXTOS PADRONIZADOS QUE DEVERIAM SER USADOS:
            ${challenge.textos_padronizados ? JSON.stringify(challenge.textos_padronizados, null, 2) : "N/A"}
            
            GABARITO ESPERADO:
            ${JSON.stringify(challenge.gabarito_codigo, null, 2)}
            
            SUBMISSÃO DO ALUNO:
            ${JSON.stringify(studentFiles, null, 2)}
            
            Analise rigorosamente a submissão do aluno comparando-a com o briefing e o gabarito. Verifique as tags HTML, estrutura, seletores CSS e aderência às especificações do briefing.
            
            Sua resposta deve ser estritamente um array JSON contendo o feedback de cada parte ou arquivo.
            Use a estrutura:
            [
              {
                "title": "Avaliando index.html",
                "status": "green" | "yellow" | "red",
                "feedback": "Texto em Markdown explicando o que acertou e o que pode melhorar."
              }
            ]
            
            Se houver erros graves, use 'red'. Se houver pequenos detalhes faltando, 'yellow'. Se estiver perfeito ou muito próximo do gabarito, 'green'.
            Sempre escreva o feedback de fomma construtiva. Formate 'feedback' usando Markdown para destacar trechos de código quando necessário.
        `;

    for (const modelName of fallbackModels) {
      try {
        console.log(`Tentando avaliar desafio com modelo: ${modelName}`);
        const model = createGeminiModel(genAI, {
          useJsonMode: true,
          model: modelName,
        });
        const result = await model.generateContent(prompt);
        const responseText = await result.response.text();
        evaluation = JSON.parse(responseText);
        break; // Sucesso, sai do loop
      } catch (err) {
        console.warn(`Erro na avaliação com modelo ${modelName}:`, err);
        lastError = err;
      }
    }

    if (!evaluation) {
      throw new Error(
        "Todos os modelos falharam na avaliação. Erro: " +
          (lastError as Error)?.message,
      );
    }

    return NextResponse.json({ feedback: evaluation });
  } catch (error) {
    console.error("Erro na API Route de Avaliação CSS:", error);
    return NextResponse.json(
      { error: "Erro ao avaliar o código" },
      { status: 500 },
    );
  }
}
