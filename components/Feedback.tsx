
import React from 'react';
import { AnswerStatus } from '../types';

interface FeedbackProps {
  status: AnswerStatus;
  correctAnswer: string;
  explanation: string;
  onNext: () => void;
}

export const Feedback: React.FC<FeedbackProps> = ({ status, correctAnswer, explanation, onNext }) => {
  if (status === AnswerStatus.IDLE) return null;

  const isCorrect = status === AnswerStatus.CORRECT;

  return (
    <div className={`mt-6 p-6 rounded-2xl animate-in fade-in slide-in-from-bottom-4 duration-300 ${
      isCorrect ? 'bg-green-900/20 border border-green-800' : 'bg-red-900/20 border border-red-800'
    }`}>
      <div className="flex items-start gap-4">
        <div className={`p-2 rounded-full shrink-0 ${isCorrect ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}>
          {isCorrect ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
        </div>
        <div className="flex-1">
          <h3 className={`text-lg font-bold ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>
            {isCorrect ? 'Great Job!' : 'Not quite right'}
          </h3>
          <p className="text-slate-300 mt-1 text-base leading-relaxed">
            {!isCorrect && (
              <span className="block font-semibold mb-1 text-slate-400">
                Correct answer: <span className="text-indigo-400">{correctAnswer}</span>
              </span>
            )}
            {explanation}
          </p>
        </div>
      </div>
      <div className="mt-6 flex justify-end">
        <button
          onClick={onNext}
          className={`px-6 py-2 rounded-lg font-bold text-white transition-all transform hover:scale-105 ${
            isCorrect 
              ? 'bg-green-600 hover:bg-green-500 shadow-lg shadow-green-900/20' 
              : 'bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-900/20'
          }`}
        >
          Next Question →
        </button>
      </div>
    </div>
  );
};
