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
      isCorrect ? 'bg-green-50 border-2 border-green-200' : 'bg-red-50 border-2 border-red-200'
    }`}>
      <div className="flex items-start gap-4">
        <div className={`p-2 rounded-full shrink-0 ${isCorrect ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
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
          <h3 className={`text-lg font-bold ${isCorrect ? 'text-green-800' : 'text-red-800'}`}>
            {isCorrect ? 'Great Job!' : 'Not quite right'}
          </h3>
          <p className="text-gray-700 mt-1 text-base leading-relaxed">
            {!isCorrect && (
              <span className="block font-semibold mb-1">
                Correct answer: <span className="text-indigo-600">{correctAnswer}</span>
              </span>
            )}
            {explanation}
          </p>
        </div>
      </div>
      <div className="mt-6 flex justify-end">
        <button
          onClick={onNext}
          className={`px-6 py-2 rounded-lg font-bold text-white transition-colors ${
            isCorrect 
              ? 'bg-green-500 hover:bg-green-600 shadow-green-200 shadow-lg' 
              : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200 shadow-lg'
          }`}
        >
          Next Question →
        </button>
      </div>
    </div>
  );
};
