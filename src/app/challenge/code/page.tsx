"use client";

import React, { useEffect, useState } from "react";
import MarkdownStyled from "@/components/MarkdownStyled";

export default function CodeViewerPage() {
  const [files, setFiles] = useState<{ nome: string; conteudo: string }[]>([]);
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [moduleTitle, setModuleTitle] = useState("");

  useEffect(() => {
    try {
      const dataStr = sessionStorage.getItem("challenge_gabarito");
      const modTitle = sessionStorage.getItem("challenge_module");
      if (dataStr) {
        const parsed = JSON.parse(dataStr);
        setFiles(parsed);
        if (parsed.length > 0) setActiveFile(parsed[0].nome);
      }
      if (modTitle) setModuleTitle(modTitle);
    } catch (e) {
      console.error(e);
    }
  }, []);

  if (files.length === 0) {
    return (
      <div className="flex bg-gray-900 min-h-screen items-center justify-center text-gray-400">
        <p>
          Nenhum código encontrado. Retorne para a plataforma e tente novamente.
        </p>
      </div>
    );
  }

  const currentFileContent =
    files.find((f) => f.nome === activeFile)?.conteudo || "";
  // To use syntax highlighting on pure string, we can mock it inside a markdown block:
  const markdownCode = `\`\`\`html\n${currentFileContent}\n\`\`\``;

  return (
    <div className="flex h-screen w-full bg-[#1e1e1e] text-white font-sans overflow-hidden">
      {/* SIDEBAR */}
      <div className="w-64 border-r border-gray-700 bg-[#252526] flex flex-col">
        <div className="p-4 border-b border-gray-700 uppercase text-xs font-bold text-gray-400 tracking-wider">
          {moduleTitle || "Arquivos do Desafio"}
        </div>
        <div className="flex-1 overflow-auto py-2">
          {files.map((f) => (
            <button
              key={f.nome}
              onClick={() => setActiveFile(f.nome)}
              className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 transition-colors ${activeFile === f.nome ? "bg-[#37373d] text-blue-400" : "text-gray-300 hover:bg-[#2a2d2e]"}`}
            >
              <i
                className={
                  f.nome.endsWith(".css")
                    ? "fab fa-css3-alt text-blue-500"
                    : "fab fa-html5 text-orange-500"
                }
              ></i>
              {f.nome}
            </button>
          ))}
        </div>
      </div>

      {/* Editor Main */}
      <div className="flex-1 flex flex-col bg-[#1e1e1e] overflow-hidden">
        <div className="flex bg-[#2d2d2d]">
          <div className="px-4 py-2 bg-[#1e1e1e] text-sm text-gray-300 border-t-2 border-blue-500 flex items-center gap-2">
            <i
              className={
                activeFile?.endsWith(".css")
                  ? "fab fa-css3-alt text-blue-500"
                  : "fab fa-html5 text-orange-500"
              }
            ></i>
            {activeFile}
          </div>
        </div>
        <div className="flex-1 overflow-auto p-4 markdown-body markdown-dark break-words whitespace-pre-wrap">
          {/* Rendering Markdown code block ensures it gets prism/highlight.js applied by our component */}
          <MarkdownStyled content={markdownCode} />
        </div>
      </div>
    </div>
  );
}
