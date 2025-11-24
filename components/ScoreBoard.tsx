import React from 'react';
import { GameState } from '../types';

interface ScoreBoardProps {
  gameState: GameState;
}

export const ScoreBoard: React.FC<ScoreBoardProps> = ({ gameState }) => {
  return (
    <div className="flex items-center justify-between bg-white/80 backdrop-blur-sm p-4 rounded-2xl shadow-sm border border-indigo-50 mb-6">
      <div className="flex items-center gap-3">
        <div className="bg-indigo-100 p-2 rounded-lg text-indigo-600">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-indigo-400 font-bold">Score</p>
          <p className="text-2xl font-black text-indigo-900">{gameState.score}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg transition-colors duration-300 ${gameState.streak > 2 ? 'bg-orange-100 text-orange-600 animate-pulse' : 'bg-gray-100 text-gray-400'}`}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
          </svg>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase tracking-wider text-gray-400 font-bold">Streak</p>
          <p className={`text-2xl font-black ${gameState.streak > 2 ? 'text-orange-500' : 'text-gray-600'}`}>
            {gameState.streak} <span className="text-sm font-normal text-gray-400">x</span>
          </p>
        </div>
      </div>
    </div>
  );
};
