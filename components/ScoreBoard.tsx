
import React from 'react';
import { GameState, GameMode } from '../types';

interface ScoreBoardProps {
  gameState: GameState;
  gameMode: GameMode;
}

export const ScoreBoard: React.FC<ScoreBoardProps> = ({ gameState, gameMode }) => {
  return (
    <div className="flex items-center justify-between bg-slate-800/80 backdrop-blur-sm p-4 rounded-2xl shadow-lg border border-slate-700 mb-6">
      
      {/* Score */}
      <div className="flex items-center gap-3">
        <div className="bg-indigo-900/50 p-2 rounded-lg text-indigo-400 border border-indigo-800">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Score</p>
          <p className="text-2xl font-black text-white">{gameState.score}</p>
        </div>
      </div>

      {/* Timer (Visible only in Timed Mode) */}
      {gameMode === 'timed' && (
        <div className="flex items-center gap-3">
           <div className={`p-2 rounded-lg border ${gameState.timeLeft < 10 ? 'bg-red-900/50 text-red-400 border-red-800 animate-pulse' : 'bg-slate-700 text-slate-300 border-slate-600'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="text-center">
             <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Time</p>
             <p className={`text-2xl font-black font-mono ${gameState.timeLeft < 10 ? 'text-red-400' : 'text-white'}`}>
               {gameState.timeLeft}s
             </p>
          </div>
        </div>
      )}

      {/* Streak */}
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg transition-colors duration-300 border ${gameState.streak > 2 ? 'bg-orange-900/50 text-orange-400 border-orange-800 animate-pulse' : 'bg-slate-700 text-slate-500 border-slate-600'}`}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
          </svg>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Streak</p>
          <p className={`text-2xl font-black ${gameState.streak > 2 ? 'text-orange-400' : 'text-slate-500'}`}>
            {gameState.streak} <span className="text-sm font-normal text-slate-600">x</span>
          </p>
        </div>
      </div>
    </div>
  );
};
