// src/components/Quiz.tsx 
"use client";

import React, { useState } from 'react';
import { QuizQuestion } from '@/types'; // Corrigido para o alias @

interface QuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  questions: QuizQuestion[];
}

const QuizModal: React.FC<QuizModalProps> = ({ isOpen, onClose, questions }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [showResults, setShowResults] = useState(false);

  if (!isOpen) return null;

  const handleAnswerSelect = (option: string) => {
      setSelectedAnswers(prev => ({ ...prev, [currentQuestionIndex]: option }));
  };

  const handleNext = () => {
      if (currentQuestionIndex < questions.length - 1) {
          setCurrentQuestionIndex(prev => prev + 1);
      } else {
          setShowResults(true);
      }
  };

  const resetQuiz = () => {
      setCurrentQuestionIndex(0);
      setSelectedAnswers({});
      setShowResults(false);
      onClose();
  };

  const score = Object.keys(selectedAnswers).reduce((acc, key) => {
      const index = parseInt(key, 10);
      if (selectedAnswers[index] === questions[index].correctAnswer) {
          return acc + 1;
      }
      return acc;
  }, 0);

  return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
              <header className="p-4 flex justify-between items-center border-b dark:border-gray-700">
                  <h2 className="text-xl font-bold">{showResults ? 'Resultado do Quiz' : `Quiz - Pergunta ${currentQuestionIndex + 1} de ${questions.length}`}</h2>
                  <button onClick={resetQuiz} className="text-2xl">&times;</button>
              </header>

              <div className="p-6 overflow-y-auto">
                  {showResults ? (
                      <div className="text-center">
                          <h3 className="text-2xl font-bold mb-4">Você acertou {score} de {questions.length} perguntas!</h3>
                          <div className="space-y-4 text-left">
                              {questions.map((q, index) => (
                                  <div key={index} className={`p-3 rounded-lg ${selectedAnswers[index] === q.correctAnswer ? 'bg-green-100 dark:bg-green-900/50' : 'bg-red-100 dark:bg-red-900/50'}`}>
                                      <p className="font-semibold">{q.question}</p>
                                      <p>Sua resposta: {selectedAnswers[index] || "Não respondida"}</p>
                                      {selectedAnswers[index] !== q.correctAnswer && <p>Resposta correta: {q.correctAnswer}</p>}
                                  </div>
                              ))}
                          </div>
                      </div>
                  ) : (
                      <div>
                          <p className="text-lg font-semibold mb-6">{questions[currentQuestionIndex].question}</p>
                          <div className="space-y-3">
                              {questions[currentQuestionIndex].options.map(option => (
                                  <button
                                      key={option}
                                      onClick={() => handleAnswerSelect(option)}
                                      className={`w-full text-left p-3 border rounded-lg transition-colors ${selectedAnswers[currentQuestionIndex] === option ? 'bg-primary-500 text-white border-primary-500' : 'hover:bg-gray-100 dark:hover:bg-gray-700 dark:border-gray-600'}`}
                                  >
                                      {option}
                                  </button>
                              ))}
                          </div>
                      </div>
                  )}
              </div>
              
              <footer className="p-4 border-t dark:border-gray-700">
                  {!showResults && (
                      <button
                          onClick={handleNext}
                          disabled={!selectedAnswers[currentQuestionIndex]}
                          className="w-full px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-400"
                      >
                          {currentQuestionIndex < questions.length - 1 ? 'Próxima' : 'Finalizar Quiz'}
                      </button>
                  )}
              </footer>
          </div>
      </div>
  );
};

export default QuizModal;