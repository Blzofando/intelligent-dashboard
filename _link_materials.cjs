/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');

// Define os caminhos dos arquivos
const csvPath = path.join(__dirname, 'links.csv');
const courseDataPath = path.join(__dirname, 'src', 'data', 'courseData.ts');

console.log("Iniciando o script de associação de links...");

/**
 * Parseia um CSV, lidando com vírgulas dentro de campos com aspas.
 * @param {string} content - O conteúdo do arquivo CSV.
 * @returns {Map<string, string>} - Um mapa de 'TituloLimpo' para 'LinkDownload'.
 */
function parseCSV(content) {
  const lines = content.split('\n');
  const headerLine = lines[0].trim();
  
  // Regex para splitar o CSV por vírgula, ignorando vírgulas dentro de aspas
  const regex = /,(?=(?:(?:[^"]*"){2})*[^"]*$)/;
  
  const headers = headerLine.split(regex).map(h => h.trim().replace(/^"|"$/g, ''));
  
  const titleIndex = headers.indexOf('TituloLimpo');
  const linkIndex = headers.indexOf('LinkDownload');

  if (titleIndex === -1 || linkIndex === -1) {
    throw new Error('CSV deve conter as colunas "TituloLimpo" e "LinkDownload". Verifique seu script do Google Apps.');
  }

  const linkMap = new Map();

  for (const line of lines.slice(1)) {
    if (!line) continue;
    
    const parts = line.split(regex);
    
    if (parts.length > Math.max(titleIndex, linkIndex)) {
      // Limpa aspas e espaços
      const title = parts[titleIndex]?.trim().replace(/^"|"$/g, '');
      const link = parts[linkIndex]?.trim().replace(/^"|"$/g, '');
      
      if (title && link) {
        linkMap.set(title, link);
      }
    }
  }
  return linkMap;
}

try {
  // --- 1. Ler e Parsear o CSV ---
  console.log(`Lendo ${csvPath}...`);
  if (!fs.existsSync(csvPath)) {
    throw new Error(`Arquivo links.csv não encontrado na raiz do projeto!`);
  }
  const csvContent = fs.readFileSync(csvPath, 'utf8');
  const linkMap = parseCSV(csvContent);
  console.log(`Encontrados ${linkMap.size} links únicos no CSV.`);

  // --- 2. Ler o courseData.ts ---
  console.log(`Lendo ${courseDataPath}...`);
  if (!fs.existsSync(courseDataPath)) {
    throw new Error(`Arquivo courseData.ts não encontrado em 'src/data/'!`);
  }
  let courseDataContent = fs.readFileSync(courseDataPath, 'utf8');

  // --- 3. Encontrar e Substituir ---
  let updatedCount = 0;
  
  // Regex para encontrar: { id: "...", title: "..." }
  // Captura 1: O objeto inteiro
  // Captura 2: O ID (ex: F008)
  // Captura 3: O Título (ex: 01. Importando Base de Dados)
  // (Lida com espaços extras)
  const lessonRegex = /({ *id: *"([^"]+)", *title: *"([^"]+)" *})/g;

  const updatedCourseData = courseDataContent.replace(lessonRegex, (match, fullLessonObject, lessonId, lessonTitle) => {
    // Tenta encontrar um link para este título
    const link = linkMap.get(lessonTitle);

    if (link) {
      // Link encontrado! Injeta a nova propriedade.
      updatedCount++;
      // Remove o '}' final, adiciona o link, e adiciona o '}' de volta
      const newLessonObject = fullLessonObject.slice(0, -1) + `, materialUrl: "${link}" }`;
      return newLessonObject;
    } else {
      // Link não encontrado, retorna o objeto original
      return fullLessonObject;
    }
  });
  
  // --- 4. Salvar o novo arquivo ---
  if (updatedCount > 0) {
    fs.writeFileSync(courseDataPath, updatedCourseData);
    console.log(`\n--- SUCESSO! ---`);
    console.log(`${updatedCount} aulas foram atualizadas com links de material.`);
    console.log(`O arquivo ${courseDataPath} foi salvo.`);
  } else {
    console.log("\n--- AVISO ---");
    console.log("Nenhuma aula foi atualizada. Verifique se os títulos do 'links.csv' (Coluna 'TituloLimpo') batem *exatamente* com os títulos no 'courseData.ts'.");
    console.log("Dica: Títulos com vírgulas (ex: 'Aula 1, 2 e 3') podem causar falhas.");
  }

} catch (error) {
  console.error('\n--- ERRO ---');
  console.error(error.message);
}