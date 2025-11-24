
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
    <div className={`mt-6 p-6 rounded-2xl animate-in fade-in slide-in-from-bottom-4 duration-300 border ${
      isCorrect ? 'bg-green-900/10 border-green-800' : 'bg-red-900/10 border-red-800'
    }`}>
      <div className="flex items-start gap-4">
        <div className={`p-2 rounded-full shrink-0 mt-1 ${isCorrect ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}>
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
        <div className="flex-1 space-y-4">
          <h3 className={`text-2xl font-black ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>
            {isCorrect ? 'Great Job!' : 'Not quite right'}
          </h3>
          
          {!isCorrect && (
            <div className="bg-slate-900 p-4 rounded-xl border border-red-900/50 shadow-inner ring-1 ring-red-500/20">
               <p className="text-xs uppercase tracking-widest text-slate-500 font-bold mb-1">Correct Answer</p>
               <p className="text-xl font-black text-green-400 tracking-wide">{correctAnswer}</p>
            </div>
          )}

          <div className={`p-4 rounded-xl border shadow-sm ${isCorrect ? 'bg-green-900/20 border-green-800/50' : 'bg-slate-800/50 border-slate-700'}`}>
             <p className="text-xs uppercase tracking-widest text-slate-500 font-bold mb-2">Explanation</p>
             <p className="text-slate-200 text-base leading-relaxed font-medium">
               {explanation}
             </p>
          </div>
        </div>
      </div>
      <div className="mt-6 flex justify-end">
        <button
          onClick={onNext}
          className={`px-8 py-3 rounded-xl font-bold text-white transition-all transform hover:scale-105 shadow-xl ${
            isCorrect 
              ? 'bg-green-600 hover:bg-green-500 shadow-green-900/30' 
              : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-900/30'
          }`}
        >
          Next Question →
        </button>
      </div>
    </div>
  );
};
