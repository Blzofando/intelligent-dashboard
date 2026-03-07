"use client";

import React, { useState } from "react";
import MarkdownStyled from "@/components/MarkdownStyled";
import JSZip from "jszip"; // For reading zip files on the client

interface FileData {
  nome: string;
  conteudo: string;
}

export interface CssChallengeResponse {
  historia_contexto: string;
  instrucoes: string[];
  textos_padronizados: { titulo: string; valor: string }[];
  arquivos_base?: FileData[];
  gabarito_codigo: FileData[];
}

interface Props {
  challenge: CssChallengeResponse;
  courseId: string;
  moduleTitle: string;
}

const CssChallenge: React.FC<Props> = ({
  challenge,
  courseId,
  moduleTitle,
}) => {
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [feedback, setFeedback] = useState<any[] | null>(null);
  const [error, setError] = useState("");

  const handleOpenGabarito = () => {
    sessionStorage.setItem(
      "challenge_gabarito",
      JSON.stringify(challenge.gabarito_codigo),
    );
    sessionStorage.setItem("challenge_module", moduleTitle);
    window.open("/challenge/code", "_blank");
  };

  const handleOpenVisual = () => {
    sessionStorage.setItem(
      "challenge_gabarito",
      JSON.stringify(challenge.gabarito_codigo),
    );
    window.open("/challenge/preview", "_blank");
  };

  const [filesSelected, setFilesSelected] = useState<FileList | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFilesSelected(e.target.files);
      setZipFile(e.target.files[0]); // Keep for backwards compatibility check
      setFeedback(null);
      setError("");
    }
  };

  const handleSubmitAnalysis = async () => {
    if (!filesSelected) {
      setError("Por favor, selecione os arquivos do seu projeto.");
      return;
    }

    setAnalyzing(true);
    setFeedback(null);
    setError("");

    try {
      const studentFiles: FileData[] = [];

      // Check if it's a ZIP or a Folder/Multiple Files
      if (
        filesSelected.length === 1 &&
        filesSelected[0].name.endsWith(".zip")
      ) {
        const zip = new JSZip();
        const loadedZip = await zip.loadAsync(filesSelected[0]);

        for (const [filename, file] of Object.entries(loadedZip.files)) {
          if (
            !file.dir &&
            (filename.endsWith(".html") ||
              filename.endsWith(".css") ||
              filename.endsWith(".js"))
          ) {
            // ignoring __MACOSX or hidden files if needed
            if (!filename.includes("__MACOSX") && !filename.startsWith(".")) {
              const content = await file.async("string");
              studentFiles.push({ nome: filename, conteudo: content });
            }
          }
        }
      } else {
        // Handle folder upload / raw files
        for (let i = 0; i < filesSelected.length; i++) {
          const file = filesSelected[i];
          const filename = file.webkitRelativePath || file.name;
          if (
            filename.endsWith(".html") ||
            filename.endsWith(".css") ||
            filename.endsWith(".js")
          ) {
            if (
              !filename.includes("__MACOSX") &&
              !filename.split("/").pop()?.startsWith(".")
            ) {
              const content = await file.text();
              // We keep just the filename or partial path if needed, usually just filename is enough
              const baseName = filename.split("/").pop() || filename;
              studentFiles.push({ nome: baseName, conteudo: content });
            }
          }
        }
      }

      if (studentFiles.length === 0) {
        throw new Error("Nenhum arquivo HTML, CSS ou JS encontrado.");
      }

      // 2. Send to evaluation API
      const response = await fetch("/api/gemini/css-evaluation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          moduleTitle,
          courseId,
          challenge,
          studentFiles,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText || "Erro ao processar a análise.");
      }

      const data = await response.json();
      setFeedback(Array.isArray(data.feedback) ? data.feedback : [data]);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Erro durante a avaliação do código.");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="space-y-8 mt-4">
      {/* SEÇÃO 1: O DESAFIO E OS ATIVOS */}
      <div className="p-6 bg-gray-800 rounded-lg shadow-md space-y-4">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <i className="fas fa-laptop-code text-blue-500"></i>
          Seu Desafio Prático
        </h2>
        {/* História de Fundo */}
        <div className="text-gray-300">
          <div className="markdown-body">
            <MarkdownStyled content={challenge.historia_contexto} />
          </div>
        </div>

        {/* Instruções */}
        {challenge.instrucoes && challenge.instrucoes.length > 0 && (
          <div className="mt-4 bg-gray-900 border border-gray-700 rounded-lg p-5">
            <h3 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
              <i className="fas fa-list-check text-blue-400"></i>
              Instruções
            </h3>
            <ul className="space-y-2">
              {challenge.instrucoes.map((instrucao, idx) => (
                <li key={idx} className="flex gap-3 text-gray-300">
                  <i className="fas fa-check-circle text-gray-500 mt-1"></i>
                  <span>{instrucao}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Textos Padronizados */}
        {challenge.textos_padronizados &&
          challenge.textos_padronizados.length > 0 && (
            <div className="mt-4">
              <h3 className="text-lg font-semibold text-gray-200 mb-3 flex items-center gap-2">
                <i className="fas fa-font text-blue-400"></i>
                Textos Padronizados
              </h3>
              <div className="grid gap-3">
                {challenge.textos_padronizados.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col md:flex-row md:items-center justify-between bg-gray-900 border border-gray-700 p-3 rounded-md group"
                  >
                    <div className="flex-1 mr-4">
                      <span className="text-xs text-gray-500 uppercase font-bold tracking-wider block mb-1">
                        {item.titulo}
                      </span>
                      <span className="text-gray-300">{item.valor}</span>
                    </div>
                    <button
                      onClick={() => navigator.clipboard.writeText(item.valor)}
                      className="mt-2 md:mt-0 px-3 py-1.5 bg-gray-800 text-gray-300 text-sm rounded hover:bg-gray-700 hover:text-white transition-colors flex items-center justify-center gap-2 border border-gray-600"
                      title="Copiar Valor"
                    >
                      <i className="fas fa-copy"></i> Copiar Valor
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

        {/* Action Buttons for Gabarito (Code and Visual) */}
        <div className="mt-6 flex flex-wrap gap-4 border-t border-gray-700 pt-6">
          <button
            onClick={handleOpenGabarito}
            className="px-4 py-2 bg-gray-700 text-white font-medium rounded-md hover:bg-gray-600 transition-colors flex items-center gap-2"
          >
            <i className="fas fa-file-code text-green-400"></i>
            Ver Código do Gabarito
          </button>

          <button
            onClick={handleOpenVisual}
            className="px-4 py-2 bg-gray-700 text-white font-medium rounded-md hover:bg-gray-600 transition-colors flex items-center gap-2"
          >
            <i className="fas fa-eye text-blue-400"></i>
            Ver Referência Visual
          </button>
        </div>
      </div>

      {/* SEÇÃO 2: ARQUIVOS BASE (Se houver) */}
      {challenge.arquivos_base && challenge.arquivos_base.length > 0 && (
        <div className="p-6 bg-gray-800 rounded-lg shadow-md space-y-4">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <i className="fas fa-download text-blue-500"></i>
            Arquivos Base
          </h2>
          <p className="text-gray-400">
            Use estes arquivos para começar o seu desafio. Copie o conteúdo ou
            crie os arquivos com os mesmos nomes no seu projeto.
          </p>
          <div className="grid gap-4 mt-4">
            {challenge.arquivos_base.map((file, idx) => (
              <div
                key={idx}
                className="border border-gray-700 rounded-lg bg-gray-900 overflow-hidden"
              >
                <div className="bg-gray-700 p-2 px-4 flex justify-between items-center text-sm text-gray-200">
                  <span className="font-mono">{file.nome}</span>
                  <button
                    onClick={() => navigator.clipboard.writeText(file.conteudo)}
                    className="hover:text-blue-400 transition-colors"
                    title="Copiar código"
                  >
                    <i className="fas fa-copy"></i> Copiar
                  </button>
                </div>
                <div className="p-4 max-h-[300px] overflow-y-auto">
                  <pre className="text-xs text-gray-300 font-mono whitespace-pre-wrap">
                    {file.conteudo}
                  </pre>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SEÇÃO 3: UPLOAD DA SOLUÇÃO */}
      <div className="p-6 bg-gray-800 rounded-lg shadow-md space-y-6 border-t-4 border-blue-500">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <i className="fas fa-upload text-blue-500"></i>
          Envie sua Solução (.zip)
        </h2>

        <div className="space-y-2">
          <label
            htmlFor="folder-upload"
            className="block text-sm font-medium text-gray-300"
          >
            Selecione a pasta do seu projeto contendo os arquivos (index.html,
            style.css) ou envie um arquivo .zip:
          </label>
          <input
            id="folder-upload"
            type="file"
            // @ts-ignore - webkitdirectory is non-standard but widely supported
            webkitdirectory=""
            directory=""
            multiple
            onChange={handleFileChange}
            disabled={analyzing}
            className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-gray-700 file:text-gray-200"
          />
          <div className="flex items-center gap-2 text-sm text-gray-500 mt-2">
            <span>Ou envie um .zip diretamente:</span>
            <input
              id="zip-upload"
              type="file"
              accept=".zip"
              onChange={handleFileChange}
              disabled={analyzing}
              className="text-sm file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:bg-gray-700 file:text-gray-300"
            />
          </div>
        </div>

        <button
          onClick={handleSubmitAnalysis}
          disabled={analyzing || !filesSelected}
          className={`w-full p-4 rounded-lg text-white font-bold text-lg flex justify-center items-center gap-3 transition-all ${analyzing || !filesSelected ? "bg-gray-600 cursor-not-allowed" : "bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700"}`}
        >
          {analyzing ? (
            <>
              <i className="fas fa-spinner fa-spin"></i> Avaliando Código...
            </>
          ) : (
            <>
              <i className="fas fa-robot"></i> Enviar para Correção da IA
            </>
          )}
        </button>

        {error && (
          <div className="p-4 bg-red-900/30 border border-red-800 text-red-300 rounded-lg">
            <strong>Erro:</strong> {error}
          </div>
        )}

        {feedback && (
          <div className="mt-6 border-t border-gray-700 pt-6 space-y-4">
            <h3 className="text-2xl font-bold text-white mb-4">
              Relatório de Correção
            </h3>
            {feedback.map((item, index) => {
              const statusClass =
                item.status === "green" || item.status === "light-green"
                  ? "border-green-500 bg-green-900/50"
                  : item.status === "yellow"
                    ? "border-yellow-500 bg-yellow-900/50"
                    : "border-red-500 bg-red-900/50";

              const iconClass =
                item.status === "green" || item.status === "light-green"
                  ? "fa-check-circle text-green-400"
                  : item.status === "yellow"
                    ? "fa-exclamation-triangle text-yellow-400"
                    : "fa-times-circle text-red-400";

              return (
                <div
                  key={index}
                  className={`border-l-4 rounded-r-lg overflow-hidden p-4 ${statusClass}`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <i className={`fas ${iconClass} text-xl`}></i>
                    <span className="font-semibold text-lg text-white">
                      {item.title}
                    </span>
                  </div>
                  <div className="text-gray-300 markdown-body">
                    <MarkdownStyled content={item.feedback} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default CssChallenge;
