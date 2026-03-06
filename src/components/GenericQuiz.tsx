import React, { useState } from "react";
import { QuizQuestion } from "@/types";

interface GenericQuizProps {
  questions: QuizQuestion[];
}

const GenericQuiz: React.FC<GenericQuizProps> = ({ questions }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<
    Record<number, string>
  >({});
  const [showResults, setShowResults] = useState(false);

  const handleSelect = (option: string) => {
    if (showResults) return;
    setSelectedAnswers((prev) => ({ ...prev, [currentIndex]: option }));
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setShowResults(true);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  if (!questions || questions.length === 0) return null;

  const currentQuestion = questions[currentIndex];
  const hasAnsweredCurrent = selectedAnswers[currentIndex] !== undefined;

  const score = Object.keys(selectedAnswers).reduce((acc, index) => {
    const qIndex = parseInt(index);
    if (selectedAnswers[qIndex] === questions[qIndex].correctAnswer) {
      return acc + 1;
    }
    return acc;
  }, 0);

  if (showResults) {
    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md text-center">
        <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">
          Resultado do Quiz
        </h2>
        <p className="text-xl mb-4 text-gray-700 dark:text-gray-300">
          Você acertou {score} de {questions.length} questões!
        </p>
        <div className="space-y-4 text-left mt-6">
          {questions.map((q, idx) => {
            const isCorrect = selectedAnswers[idx] === q.correctAnswer;
            return (
              <div
                key={idx}
                className={`p-4 border rounded-md ${isCorrect ? "border-green-500 bg-green-50 dark:bg-green-900/20" : "border-red-500 bg-red-50 dark:bg-red-900/20"}`}
              >
                <p className="font-semibold text-gray-800 dark:text-white">
                  {idx + 1}. {q.question}
                </p>
                <p className="text-sm mt-1 text-gray-700 dark:text-gray-300">
                  Sua resposta: {selectedAnswers[idx]}
                </p>
                {!isCorrect && (
                  <p className="text-sm text-green-600 dark:text-green-400 font-medium mt-1">
                    Resposta correta: {q.correctAnswer}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mt-6">
      <div className="flex justify-between items-center mb-6 border-b pb-4 border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">
          Quiz Prático
        </h2>
        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
          Questão {currentIndex + 1} de {questions.length}
        </span>
      </div>

      <div className="mb-8">
        <h3 className="text-lg font-medium mb-4 text-gray-800 dark:text-gray-200">
          {currentQuestion.question}
        </h3>
        <div className="space-y-3">
          {currentQuestion.options.map((option, idx) => (
            <button
              key={idx}
              onClick={() => handleSelect(option)}
              className={`w-full text-left p-4 rounded-lg border transition-colors ${
                selectedAnswers[currentIndex] === option
                  ? "border-primary-500 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300"
                  : "border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700 text-gray-700 dark:text-gray-300"
              }`}
            >
              <div className="flex items-center">
                <div
                  className={`w-5 h-5 rounded-full border mr-3 flex shrink-0 items-center justify-center ${
                    selectedAnswers[currentIndex] === option
                      ? "border-primary-500"
                      : "border-gray-400"
                  }`}
                >
                  {selectedAnswers[currentIndex] === option && (
                    <div className="w-3 h-3 rounded-full bg-primary-500" />
                  )}
                </div>
                <span>{option}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-between mt-6">
        <button
          onClick={handlePrevious}
          disabled={currentIndex === 0}
          className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md font-medium disabled:opacity-50 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
        >
          Anterior
        </button>
        <button
          onClick={handleNext}
          disabled={!hasAnsweredCurrent}
          className="px-4 py-2 bg-primary-600 text-white rounded-md font-medium disabled:opacity-50 hover:bg-primary-700 transition-colors"
        >
          {currentIndex === questions.length - 1 ? "Finalizar" : "Próxima"}
        </button>
      </div>
    </div>
  );
};

export default GenericQuiz;
