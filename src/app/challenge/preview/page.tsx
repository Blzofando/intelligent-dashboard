"use client";

import React, { useEffect, useState, useRef } from "react";

export default function VisualReferencePage() {
  const [files, setFiles] = useState<{ nome: string; conteudo: string }[]>([]);
  const [currentPath, setCurrentPath] = useState<string>("index.html");
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    try {
      const dataStr = sessionStorage.getItem("challenge_gabarito");
      if (dataStr) {
        setFiles(JSON.parse(dataStr));
      }
    } catch (e) {
      console.error(e);
    }

    // Protection Against DevTools context menu
    const preventContext = (e: MouseEvent) => e.preventDefault();
    document.addEventListener("contextmenu", preventContext);

    // Some basic protection against keyboard shortcuts
    const preventKeys = (e: KeyboardEvent) => {
      if (
        e.key === "F12" ||
        (e.ctrlKey && e.shiftKey && e.key === "I") ||
        (e.ctrlKey && e.shiftKey && e.key === "C") ||
        (e.ctrlKey && e.key === "u")
      ) {
        e.preventDefault();
      }
    };
    window.addEventListener("keydown", preventKeys);

    return () => {
      document.removeEventListener("contextmenu", preventContext);
      window.removeEventListener("keydown", preventKeys);
    };
  }, []);

  const renderCurrentFile = () => {
    if (!iframeRef.current) return;

    // Normalize path to find in our list
    let targetFile = currentPath.startsWith("/")
      ? currentPath.slice(1)
      : currentPath;
    if (targetFile === "") targetFile = "index.html"; // default routing

    const fileData = files.find((f) => f.nome === targetFile);

    if (!fileData) {
      const errorHtml = `<html><body><h1>404 Not Found: ${targetFile}</h1></body></html>`;
      injectIframeContent(errorHtml);
      return;
    }

    // If it's HTML, we inject it. But what about linked CSS?!
    // The students challenge might have <link rel="stylesheet" href="style.css">
    // To make this work offline, we must inject our local CSS strings manually.
    let content = fileData.conteudo;

    // VERY BASIC Regex to inject known CSS files directly into <style> tags
    files
      .filter((f) => f.nome.endsWith(".css"))
      .forEach((cssFile) => {
        // Find where it's linked
        const linkRegex = new RegExp(
          `<link[^>]*href=["']?\/?${cssFile.nome}["']?[^>]*>`,
          "gi",
        );
        if (linkRegex.test(content)) {
          content = content.replace(
            linkRegex,
            `<style>${cssFile.conteudo}</style>`,
          );
        }
      });

    injectIframeContent(content);
  };

  const injectIframeContent = (htmlContent: string) => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    // Make sure we get frame document
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) return;

    doc.open();
    // inject a base script to hijack clicks within iframe
    const hijackScript = `
      <script>
        document.addEventListener('click', function(e) {
          const a = e.target.closest('a');
          if (a && a.getAttribute('href') && !a.getAttribute('href').startsWith('http') && !a.getAttribute('href').startsWith('#')) {
            e.preventDefault();
            window.parent.postMessage({ type: 'NAVIGATE', path: a.getAttribute('href') }, '*');
          }
        });
        
        // Block context menu inside iframe as well
        document.addEventListener('contextmenu', e => e.preventDefault());

        // Block keyboard shortcuts inside iframe
        document.addEventListener('keydown', function(e) {
          if (
            e.key === 'F12' ||
            (e.ctrlKey && e.shiftKey && e.key === 'I') ||
            (e.ctrlKey && e.shiftKey && e.key === 'C') ||
            (e.ctrlKey && e.key === 'u')
          ) {
            e.preventDefault();
          }
        });
      </script>
    `;

    // Inject hijack string right before closing body or end of HTML
    if (htmlContent.includes("</body>")) {
      htmlContent = htmlContent.replace("</body>", hijackScript + "</body>");
    } else {
      htmlContent += hijackScript;
    }

    doc.write(htmlContent);
    doc.close();
  };

  useEffect(() => {
    if (files.length > 0) {
      renderCurrentFile();
    }
  }, [files, currentPath]);

  // Handle messages from iframe (our hijack script)
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data && e.data.type === "NAVIGATE") {
        const path = e.data.path;
        console.log("Navigating virtually to:", path);
        setCurrentPath(path);
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  if (files.length === 0) {
    return (
      <div className="flex bg-gray-900 min-h-screen items-center justify-center text-gray-400">
        <p>Nenhuma referência visual encontrada. Retorne para a plataforma.</p>
      </div>
    );
  }

  return (
    <div className="w-full h-screen overflow-hidden bg-white">
      <iframe
        ref={iframeRef}
        className="w-full h-full border-none"
        title="Visual Reference"
        sandbox="allow-scripts allow-same-origin"
      />
    </div>
  );
}
