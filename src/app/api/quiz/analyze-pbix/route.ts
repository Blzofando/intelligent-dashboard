// app/api/quiz/analyze/route.ts
import { NextRequest, NextResponse } from 'next/server';

const BASE_URL = process.env.PYTHON_API_URL || 'http://localhost:8080';
const PYTHON_ENDPOINT = `${BASE_URL}/api/quiz/analyze`;

export const maxDuration = 300; // 5 minutos timeout

export async function POST(req: NextRequest) {
  try {
    console.log(`🚀 Enviando para: ${PYTHON_ENDPOINT}`);

    const formData = await req.formData();
    
    // Validação básica
    const file = formData.get('file');
    if (!file) {
      return NextResponse.json(
        { error: 'Nenhum arquivo foi enviado' },
        { status: 400 }
      );
    }

    const response = await fetch(PYTHON_ENDPOINT, {
      method: "POST",
      body: formData,
    });

    const contentType = response.headers.get("content-type") || "";

    if (!response.ok) {
      console.error(`❌ Erro ${response.status} do backend Python`);
      
      // Se retornou JSON de erro
      if (contentType.includes("application/json")) {
        const errJson = await response.json();
        return NextResponse.json(errJson, { status: response.status });
      }
      
      // Se retornou HTML (erro do Fly.io)
      const text = await response.text();
      if (text.startsWith("<!DOCTYPE") || text.startsWith("<html")) {
        return NextResponse.json(
          {
            feedback: [{
              title: "Servidor Temporariamente Indisponível",
              status: "red",
              feedback: "O servidor de análise está reiniciando. Por favor, aguarde 30 segundos e tente novamente."
            }]
          },
          { status: 503 }
        );
      }

      return NextResponse.json(
        { error: `Erro ${response.status}: ${text.substring(0, 200)}` },
        { status: response.status }
      );
    }

    // Sucesso
    if (!contentType.includes("application/json")) {
      const text = await response.text();
      console.error("⚠️ Resposta não-JSON:", text.substring(0, 500));
      
      return NextResponse.json(
        {
          feedback: [{
            title: "Erro de Formato",
            status: "red",
            feedback: "O servidor retornou uma resposta em formato inesperado."
          }]
        },
        { status: 500 }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error: any) {
    console.error("❌ Erro na API Next.js:", error);
    
    if (error.name === 'AbortError' || error.code === 'ETIMEDOUT') {
      return NextResponse.json(
        {
          feedback: [{
            title: "Timeout",
            status: "red",
            feedback: "A análise demorou muito. Tente com um arquivo menor ou aguarde alguns minutos."
          }]
        },
        { status: 504 }
      );
    }

    if (error.cause?.code === "ECONNREFUSED") {
      return NextResponse.json(
        {
          feedback: [{
            title: "Servidor Offline",
            status: "red",
            feedback: "Não foi possível conectar ao servidor de análise. Ele pode estar desligado no Fly.io."
          }]
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        feedback: [{
          title: "Erro Interno",
          status: "red",
          feedback: `Erro inesperado: ${error.message}`
        }]
      },
      { status: 500 }
    );
  }
}