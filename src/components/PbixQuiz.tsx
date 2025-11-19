"use client";

import React, { useState } from "react";
// Certifique-se que o caminho para este componente está correto
import MarkdownStyled from "@/components/MarkdownStyled"; 

// --- Sub-Componentes Internos ---

// 1. O Acordeão de Tarefas (com botão de ajuda)
const TaskAccordion = ({ task }: { task: any }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showHint, setShowHint] = useState(false);

  return (
    <div className="border border-gray-700 rounded-lg overflow-hidden">
      {/* Título Clicável */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex justify-between items-center p-4 bg-gray-800 hover:bg-gray-700 transition-colors duration-200"
      >
        <span className="font-semibold text-lg text-white text-left">{task.title}</span>
        <i className={`fas ${isExpanded ? 'fa-chevron-up' : 'fa-chevron-down'} text-gray-400 transition-transform duration-200`}></i>
      </button>
      
      {/* Conteúdo Expansível */}
      {isExpanded && (
        <div className="p-4 bg-gray-800 border-t border-gray-700 space-y-4">
          <p className="text-gray-300">{task.description}</p>
          
          {/* Botão de Ajuda Discreto */}
          <button
            onClick={() => setShowHint(!showHint)}
            className="text-sm text-blue-400 hover:text-blue-300 hover:underline"
          >
            {showHint ? 'Esconder Ajuda' : 'Preciso de ajuda'}
          </button>

          {/* Ajuda Expansível */}
          {showHint && (
            <div className="p-3 bg-gray-900 border border-blue-900 rounded-md text-gray-400 text-sm">
              <p>{task.hint}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// 2. O Relatório de Feedback Colorido
const FeedbackReport = ({ feedback }: { feedback: any[] }) => {
  const getStatusColorClasses = (status: string) => {
    switch (status) {
      case 'green':
        return 'border-green-500 bg-green-900/50 hover:bg-green-900/80';
      case 'light-green':
        return 'border-lime-500 bg-lime-900/50 hover:bg-lime-900/80';
      case 'yellow':
        return 'border-yellow-500 bg-yellow-900/50 hover:bg-yellow-900/80';
      case 'red':
        return 'border-red-500 bg-red-900/50 hover:bg-red-900/80';
      default:
        return 'border-gray-700 bg-gray-800 hover:bg-gray-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'green':
      case 'light-green':
        return <i className="fas fa-check-circle text-green-400"></i>;
      case 'yellow':
        return <i className="fas fa-exclamation-triangle text-yellow-400"></i>;
      case 'red':
        return <i className="fas fa-times-circle text-red-400"></i>;
      default:
        return <i className="fas fa-info-circle text-gray-400"></i>;
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-2xl font-bold text-white mb-4">Relatório de Análise</h3>
      {feedback.map((item, index) => (
        <FeedbackAccordionItem 
          key={index} 
          item={item} 
          colorClasses={getStatusColorClasses(item.status)}
          icon={getStatusIcon(item.status)}
        />
      ))}
    </div>
  );
};

// Item do Acordeão de Feedback
const FeedbackAccordionItem = ({ item, colorClasses, icon }: { item: any, colorClasses: string, icon: React.ReactElement }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className={`border-l-4 rounded-r-lg overflow-hidden transition-colors duration-200 ${colorClasses}`}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex justify-between items-center p-4"
      >
        <div className="flex items-center gap-3">
          {icon}
          <span className="font-semibold text-lg text-white text-left">{item.title}</span>
        </div>
        <i className={`fas ${isExpanded ? 'fa-chevron-up' : 'fa-chevron-down'} text-gray-400 transition-transform duration-200`}></i>
      </button>

      {isExpanded && (
        <div className="p-4 border-t border-gray-700/50">
          {/* Usamos o MarkdownStyled para renderizar o feedback da IA */}
          <div className="markdown-body">
            <MarkdownStyled content={item.feedback} />
          </div>
        </div>
      )}
    </div>
  );
};


// --- Componente Principal (PbixQuiz) ---

// Tipos para os props
interface Sheet {
  sheetName: string;
  columns: string[];
  rows: any[][];
}
interface FileDescriptor {
  fileName: string;
  description: string;
  sheets: Sheet[];
}
interface Task {
  title: string;
  description: string;
  hint: string;
  spec: string[];
}
interface Props {
  files: FileDescriptor[];
  tasks: Task[];
}

const PbixQuiz: React.FC<Props> = ({ files = [], tasks = [] }) => {
  
  const [pbixFile, setPbixFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [feedback, setFeedback] = useState<any[] | null>(null); // Espera um array de feedback
  const [error, setError] = useState("");

  const downloadFile = async (file: FileDescriptor) => {
    try {
      const response = await fetch("/api/pbix/download", { method: "POST", body: JSON.stringify({ file }), headers: { "Content-Type": "application/json" }});
      if (!response.ok) { console.error("Erro ao baixar arquivo"); return; }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = file.fileName;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Erro ao fazer download:", error);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setPbixFile(e.target.files[0]);
      setFeedback(null); 
      setError("");
    }
  };

  const handleSubmitAnalysis = async () => {
    if (!pbixFile) {
      setError("Por favor, selecione um arquivo .pbix para enviar.");
      return;
    }

    setAnalyzing(true);
    setFeedback(null);
    setError("");

    const formData = new FormData();
    formData.append("file", pbixFile);
    formData.append("technical_spec", JSON.stringify(tasks));

    try {
      const response = await fetch("https://pbix-analyzer.fly.dev/api/quiz/analyze", {
        method: "POST",
        body: formData
      });

      // 🛑 1. Verifica se NÃO é JSON
      const contentType = response.headers.get("content-type") || "";

      if (!response.ok) {
        const raw = await response.text(); // Pega HTML ou erro cru
        console.error("ERRO DO BACKEND:", raw);

        // Se for HTML → provavelmente erro Fly.io/500
        if (raw.startsWith("<!DOCTYPE") || raw.startsWith("<html")) {
          throw new Error("O servidor retornou uma página HTML em vez de JSON. A API pode estar offline ou com erro interno.");
        }

        throw new Error(raw || "Erro ao processar a análise.");
      }

      // 🛑 2. Se a resposta não for JSON, capturar e mostrar
      if (!contentType.includes("application/json")) {
        const raw = await response.text();
        console.error("Resposta não-JSON recebida:", raw);

        throw new Error(
          "O servidor retornou um formato inesperado (não JSON). Verifique os logs."
        );
      }

      // 🟢 3. Agora sim podemos parsear JSON com segurança
      const data = await response.json();

      // 🟢 4. Normaliza o retorno
      if (data && Array.isArray(data.feedback)) {
        setFeedback(data.feedback);
      } else if (Array.isArray(data)) {
        setFeedback(data);
      } else {
        throw new Error("JSON inválido recebido da API.");
      }
    } catch (err: any) {
      console.error("Erro capturado:", err);
      setError(err.message || "Erro ao conectar com o servidor de análise.");
    } finally {
      setAnalyzing(false);
    }
  };



  return (
    <div className="space-y-8 mt-4"> 
      
      {/* SEÇÃO 1: TAREFAS (O Acordeão de Desafio) */}
      <div className="p-6 bg-gray-800 rounded-lg shadow-md space-y-4">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <i className="fas fa-tasks text-blue-500"></i> 
            Suas Tarefas
        </h2>
        {tasks.length === 0 ? (
          <p className="text-gray-400">Nenhuma tarefa disponível.</p>
        ) : (
          tasks.map((task, index) => (
            <TaskAccordion key={index} task={task} />
          ))
        )}
      </div>

      {/* SEÇÃO 2: DOWNLOADS */}
      <div className="p-6 bg-gray-800 rounded-lg shadow-md space-y-4">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <i className="fas fa-download text-blue-500"></i> 
            Arquivos do Desafio
        </h2>
        <div className="grid gap-4">
          {files.length === 0 ? (
            <p className="text-gray-400">Nenhum arquivo disponível para baixar.</p>
          ) : (
            files.map((file, index) => (
              <div key={index} className="border border-gray-700 rounded-lg p-4 bg-gray-900 flex justify-between items-center flex-wrap gap-2">
                <div>
                  <p className="font-semibold text-white">{file.fileName}</p>
                  <p className="text-sm text-gray-400">{file.description}</p>
                </div>
                <button
                  onClick={() => downloadFile(file)}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <i className="fas fa-file-excel"></i> Baixar
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* SEÇÃO 3: UPLOAD */}
      <div className="p-6 bg-gray-800 rounded-lg shadow-md space-y-6 border-t-4 border-blue-500">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <i className="fas fa-upload text-blue-500"></i>
            Envie sua Solução
        </h2>
        
        <div className="space-y-2">
            <label htmlFor="pbix-upload" className="block text-sm font-medium text-gray-300">
                Selecione seu arquivo .pbix finalizado:
            </label>
            <input
                id="pbix-upload"
                type="file"
                accept=".pbix"
                onChange={handleFileChange}
                disabled={analyzing}
                className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-gray-700 file:text-gray-200"
            />
        </div>

        <button 
            onClick={handleSubmitAnalysis} 
            disabled={analyzing || !pbixFile}
            className={`w-full p-4 rounded-lg text-white font-bold text-lg flex justify-center items-center gap-3 transition-all ${analyzing || !pbixFile ? 'bg-gray-600 cursor-not-allowed' : 'bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700'}`}
        >
            {analyzing ? <><i className="fas fa-spinner fa-spin"></i> Analisando...</> : <><i className="fas fa-robot"></i> Enviar para Correção da IA</>}
        </button>

        {/* EXIBIÇÃO DE ERROS */}
        {error && (
            <div className="p-4 bg-red-900/30 border border-red-800 text-red-300 rounded-lg">
                <strong>Erro:</strong> {error}
            </div>
        )}
        
        {/* EXIBIÇÃO DO FEEDBACK (O NOVO COMPONENTE) */}
        {feedback && (
            <div className="mt-6 border-t border-gray-700 pt-6">
              <FeedbackReport feedback={feedback} />
            </div>
        )}
      </div>

    </div>
  );
};

export default PbixQuiz;
