
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { fetchGrammarQuestions } from './services/geminiService';
import { GrammarQuestion, GameState, AnswerStatus, QuestionHistory, GrammarTopic, Difficulty, GameMode } from './types';
import { Button } from './components/Button';
import { ScoreBoard } from './components/ScoreBoard';
import { Feedback } from './components/Feedback';

const TOPICS: { id: GrammarTopic; title: string; desc: string; color: string; icon: string }[] = [
  { 
    id: 'present_progressive', 
    title: 'Present Progressive', 
    desc: 'am/is/are + verb-ing', 
    color: 'bg-indigo-600',
    icon: '🏃'
  },
  { 
    id: 'pronouns', 
    title: 'Subject Pronouns', 
    desc: 'He, She, It, They...', 
    color: 'bg-green-600',
    icon: '👥'
  },
  { 
    id: 'has_have', 
    title: 'Has vs Have', 
    desc: 'Possession', 
    color: 'bg-orange-600',
    icon: '🎒'
  },
  { 
    id: 'am_is_are', 
    title: 'To Be (Am/Is/Are)', 
    desc: 'States and Descriptions', 
    color: 'bg-blue-600',
    icon: '🙂'
  },
  { 
    id: 'negatives', 
    title: 'Negatives', 
    desc: "isn't, aren't, 'm not", 
    color: 'bg-red-600',
    icon: '🚫'
  },
  {
    id: 'adjectives_adverbs',
    title: 'Adj. vs Adverbs',
    desc: 'Describing Things vs Actions',
    color: 'bg-pink-600',
    icon: '🎨'
  },
  {
    id: 'past_tense',
    title: 'Past Tense',
    desc: 'Yesterday, Last week...',
    color: 'bg-yellow-600',
    icon: '⏪'
  }
];

const DIFFICULTY_OPTIONS: { id: Difficulty; label: string }[] = [
  { id: 'easy', label: 'Easy' },
  { id: 'medium', label: 'Medium' },
  { id: 'hard', label: 'Hard' },
];

const MODE_OPTIONS: { id: GameMode; label: string; desc: string }[] = [
  { id: 'practice', label: 'Practice', desc: 'No time limit' },
  { id: 'timed', label: 'Timed Blitz', desc: '60 Seconds' },
];

const App: React.FC = () => {
  const [selectedTopic, setSelectedTopic] = useState<GrammarTopic | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [gameMode, setGameMode] = useState<GameMode>('practice');
  
  const [questions, setQuestions] = useState<GrammarQuestion[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [status, setStatus] = useState<AnswerStatus>(AnswerStatus.IDLE);
  const [questionStartTime, setQuestionStartTime] = useState<number>(0);
  
  const [history, setHistory] = useState<QuestionHistory[]>([]);
  
  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    streak: 0,
    totalAnswered: 0,
    timeLeft: 60,
    isGameOver: false,
  });

  const timerRef = useRef<number | null>(null);

  const loadQuestions = useCallback(async (topic: GrammarTopic, count = 10, diff: Difficulty, append = false) => {
    setLoading(true);
    setError(null);
    try {
      const newQuestions = await fetchGrammarQuestions(topic, count, diff);
      setQuestions(prev => append ? [...prev, ...newQuestions] : newQuestions);
    } catch (err) {
      setError("Oops! Couldn't load questions. Check your internet.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Timer Effect
  useEffect(() => {
    if (selectedTopic && gameMode === 'timed' && !gameState.isGameOver && !loading && questions.length > 0) {
      timerRef.current = window.setInterval(() => {
        setGameState(prev => {
          if (prev.timeLeft <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            return { ...prev, timeLeft: 0, isGameOver: true };
          }
          return { ...prev, timeLeft: prev.timeLeft - 1 };
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [selectedTopic, gameMode, gameState.isGameOver, loading, questions.length]);

  // Effect to load questions when topic changes
  useEffect(() => {
    if (selectedTopic) {
      loadQuestions(selectedTopic, 10, difficulty);
      setQuestionStartTime(Date.now());
    } else {
      setQuestions([]);
      setCurrentQIndex(0);
      setStatus(AnswerStatus.IDLE);
      setSelectedOption(null);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [selectedTopic, difficulty, loadQuestions]);

  // Pre-fetch more questions
  useEffect(() => {
    if (selectedTopic && questions.length > 0 && currentQIndex >= questions.length - 2 && !loading && !gameState.isGameOver) {
       fetchGrammarQuestions(selectedTopic, 5, difficulty).then(newQs => {
         setQuestions(prev => [...prev, ...newQs]);
       });
    }
  }, [currentQIndex, questions.length, loading, selectedTopic, difficulty, gameState.isGameOver]);

  const handleTopicSelect = (topic: GrammarTopic) => {
    setGameState({ 
      score: 0, 
      streak: 0, 
      totalAnswered: 0, 
      timeLeft: 60, 
      isGameOver: false 
    });
    setHistory([]);
    setSelectedTopic(topic);
  };

  const handleBackToMenu = () => {
    setSelectedTopic(null);
    setGameState(prev => ({ ...prev, isGameOver: false }));
  };

  const handleCheck = () => {
    if (!selectedOption) return;

    const currentQuestion = questions[currentQIndex];
    const isCorrect = selectedOption === currentQuestion.correctAnswer;
    const timeTaken = (Date.now() - questionStartTime) / 1000;

    setHistory(prev => [...prev, {
      question: currentQuestion,
      selectedOption: selectedOption,
      isCorrect: isCorrect,
      timestamp: Date.now(),
      timeTaken
    }]);

    if (isCorrect) {
      // Scoring Logic
      let points = 10;
      
      // Streak Bonus
      points += (gameState.streak * 2);

      // Speed Bonus (Max 5 points if answered within 5 seconds)
      const speedBonus = Math.floor(Math.max(0, 5 - timeTaken) * 2);
      points += speedBonus;

      setStatus(AnswerStatus.CORRECT);
      setGameState(prev => ({
        ...prev,
        score: prev.score + points,
        streak: prev.streak + 1,
        totalAnswered: prev.totalAnswered + 1,
      }));
    } else {
      setStatus(AnswerStatus.INCORRECT);
      setGameState(prev => ({
        ...prev,
        score: Math.max(0, prev.score - 5),
        streak: 0,
        totalAnswered: prev.totalAnswered + 1,
      }));
    }
  };

  const handleNext = () => {
    if (gameState.isGameOver) return; // Should not happen via button, but safe guard
    
    setSelectedOption(null);
    setStatus(AnswerStatus.IDLE);
    setCurrentQIndex(prev => prev + 1);
    setQuestionStartTime(Date.now());
  };

  const handleExport = () => {
    if (history.length === 0) return;
    const topicTitle = TOPICS.find(t => t.id === selectedTopic)?.title || "Grammar";
    const header = `GRAMMAR HERO - ${topicTitle.toUpperCase()} (${difficulty.toUpperCase()}) REPORT\nDate: ${new Date().toLocaleString()}\nFinal Score: ${gameState.score}\nTotal Answered: ${gameState.totalAnswered}\n\n---------------------------------------------------\n\n`;
    
    const content = history.map((h, i) => {
      const fullSentence = `${h.question.sentencePre} ______ (${h.question.baseVerb}) ${h.question.sentencePost}`;
      const result = h.isCorrect ? "CORRECT" : "INCORRECT";
      
      return `Question ${i + 1}: ${fullSentence}\nYour Answer: ${h.selectedOption}\nResult: ${result}\nCorrect Answer: ${h.question.correctAnswer}\nTime: ${h.timeTaken.toFixed(1)}s\n`;
    }).join('\n---------------------------------------------------\n\n');

    const blob = new Blob([header + content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `grammar_hero_${selectedTopic}_${new Date().toISOString().slice(0,10)}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const Footer = () => (
    <footer className="mt-12 border-t border-slate-800 pt-8 pb-4 text-center">
      <p className="text-slate-500 font-medium text-sm">
        (C) Noam Gold AI 2025
      </p>
      <a 
        href="mailto:gold.noam@gmail.com" 
        className="text-indigo-400 hover:text-indigo-300 text-sm mt-2 inline-block transition-colors"
      >
        Send Feedback: gold.noam@gmail.com
      </a>
    </footer>
  );

  // MENU SCREEN
  if (!selectedTopic) {
    return (
      <div className="min-h-screen bg-slate-950 py-12 px-4 font-sans text-slate-100">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-6xl font-black text-white mb-4 tracking-tight drop-shadow-lg">
              Grammar<span className="text-indigo-500">Hero</span>
            </h1>
            <p className="text-xl text-slate-400 font-medium">Master English Grammar with AI</p>
          </div>

          {/* Configuration Section */}
          <div className="bg-slate-900/50 backdrop-blur-md p-6 rounded-3xl border border-slate-800 mb-10 max-w-3xl mx-auto">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Game Mode Selector */}
                <div>
                   <label className="block text-slate-400 text-xs font-bold uppercase tracking-widest mb-3">Game Mode</label>
                   <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
                      {MODE_OPTIONS.map(mode => (
                        <button
                          key={mode.id}
                          onClick={() => setGameMode(mode.id)}
                          className={`flex-1 py-2 px-4 rounded-lg text-sm font-bold transition-all ${
                            gameMode === mode.id 
                            ? 'bg-indigo-600 text-white shadow-lg' 
                            : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          {mode.label}
                        </button>
                      ))}
                   </div>
                   <p className="text-xs text-slate-500 mt-2 ml-1 h-4">{MODE_OPTIONS.find(m => m.id === gameMode)?.desc}</p>
                </div>

                {/* Difficulty Selector */}
                <div>
                   <label className="block text-slate-400 text-xs font-bold uppercase tracking-widest mb-3">Difficulty</label>
                   <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
                      {DIFFICULTY_OPTIONS.map(diff => (
                        <button
                          key={diff.id}
                          onClick={() => setDifficulty(diff.id)}
                          className={`flex-1 py-2 px-4 rounded-lg text-sm font-bold transition-all ${
                            difficulty === diff.id 
                            ? 'bg-indigo-600 text-white shadow-lg' 
                            : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          {diff.label}
                        </button>
                      ))}
                   </div>
                </div>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {TOPICS.map((topic) => (
              <button
                key={topic.id}
                onClick={() => handleTopicSelect(topic.id)}
                className="group relative overflow-hidden bg-slate-900 p-6 rounded-3xl shadow-lg border border-slate-800 hover:border-indigo-500/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-indigo-500/10 text-left"
              >
                <div className={`absolute top-0 right-0 w-32 h-32 transform translate-x-8 -translate-y-8 rounded-full blur-2xl opacity-20 ${topic.color}`}></div>
                <div className="text-4xl mb-4 relative z-10">{topic.icon}</div>
                <h3 className="text-2xl font-bold text-white group-hover:text-indigo-400 transition-colors relative z-10">
                  {topic.title}
                </h3>
                <p className="text-slate-400 mt-2 font-medium text-sm relative z-10">
                  {topic.desc}
                </p>
                <div className={`mt-6 inline-flex items-center text-xs font-bold uppercase tracking-wider ${topic.color.replace('bg-', 'text-')} relative z-10`}>
                  Start {gameMode === 'timed' ? 'Blitz' : 'Practice'} <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </button>
            ))}
          </div>
          
          <Footer />
        </div>
      </div>
    );
  }

  // LOADING STATE
  if (loading && questions.length === 0) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
        <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <h2 className="text-xl font-bold text-slate-200">Generating {difficulty} Questions...</h2>
      </div>
    );
  }

  // ERROR STATE
  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="bg-slate-900 p-8 rounded-2xl shadow-xl text-center max-w-md border border-slate-800">
          <h2 className="text-xl font-bold text-white mb-2">Something went wrong</h2>
          <p className="text-slate-400 mb-6">{error}</p>
          <div className="flex gap-4 justify-center">
            <Button onClick={() => handleBackToMenu()} variant="secondary">Back to Menu</Button>
            <Button onClick={() => selectedTopic && loadQuestions(selectedTopic, 10, difficulty)}>Try Again</Button>
          </div>
        </div>
      </div>
    );
  }
  
  // GAME OVER STATE (Timed Mode)
  if (gameState.isGameOver) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 font-sans">
        <div className="bg-slate-900 p-8 rounded-3xl shadow-2xl border border-slate-800 max-w-lg w-full text-center animate-in fade-in zoom-in duration-300">
          <div className="w-20 h-20 bg-indigo-900/50 rounded-full flex items-center justify-center mx-auto mb-6 text-indigo-400 text-4xl">
             🏆
          </div>
          <h2 className="text-4xl font-black text-white mb-2">Time's Up!</h2>
          <p className="text-slate-400 mb-8">Great effort! Here is how you did:</p>
          
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <p className="text-slate-500 text-xs font-bold uppercase">Final Score</p>
              <p className="text-3xl font-black text-white">{gameState.score}</p>
            </div>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <p className="text-slate-500 text-xs font-bold uppercase">Answered</p>
              <p className="text-3xl font-black text-white">{gameState.totalAnswered}</p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
             <Button onClick={handleExport} variant="secondary">Download Report</Button>
             <Button onClick={handleBackToMenu}>Play Again</Button>
          </div>
        </div>
      </div>
    )
  }

  const currentQuestion = questions[currentQIndex];

  // GAME SCREEN
  return (
    <div className="min-h-screen bg-slate-950 py-8 px-4 font-sans selection:bg-indigo-500/30 text-slate-200">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <header className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={handleBackToMenu}
              className="p-2 bg-slate-900 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white shadow-sm border border-slate-800 transition-all"
              title="Back to Menu"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div>
              <h1 className="text-2xl font-extrabold text-white">
                {TOPICS.find(t => t.id === selectedTopic)?.title}
              </h1>
              <div className="flex items-center gap-2">
                 <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-400 uppercase">{difficulty}</span>
                 <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-400 uppercase">{gameMode}</span>
              </div>
            </div>
          </div>
          
          {history.length > 0 && (
            <button 
              onClick={handleExport}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 text-indigo-400 text-sm font-bold rounded-lg shadow-sm border border-slate-800 hover:bg-slate-800 transition-colors"
            >
              Export
            </button>
          )}
        </header>

        {/* Stats */}
        <ScoreBoard gameState={gameState} gameMode={gameMode} />

        {/* Question Card */}
        {currentQuestion && (
          <div className="bg-slate-900 rounded-3xl shadow-xl shadow-slate-950/50 border border-slate-800 overflow-hidden relative">
            {/* Progress Bar */}
            <div className="h-1 bg-slate-800 w-full">
              <div 
                className="h-full bg-indigo-500 transition-all duration-500 ease-out shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                style={{ width: `${((currentQIndex + 1) % 10) * 10}%` }}
              />
            </div>

            <div className="p-8 md:p-10">
              <div className="mb-8">
                <div className="flex justify-between items-center mb-6">
                   <span className="inline-block px-3 py-1 bg-indigo-500/10 text-indigo-400 rounded-full text-xs font-bold tracking-wide uppercase border border-indigo-500/20">
                     Question {gameState.totalAnswered + 1}
                   </span>
                </div>
                
                {/* Sentence Display */}
                <div className="text-2xl md:text-3xl font-medium leading-relaxed text-slate-100 my-6">
                  <span>{currentQuestion.sentencePre}</span>
                  <span className={`inline-block min-w-[120px] px-2 border-b-4 text-center mx-1 transition-colors duration-300
                    ${selectedOption ? 'text-indigo-400 border-indigo-500/50' : 'text-transparent border-slate-700'}
                    ${status === AnswerStatus.CORRECT ? '!text-green-400 !border-green-500' : ''}
                    ${status === AnswerStatus.INCORRECT ? '!text-red-400 !border-red-500' : ''}
                  `}>
                    {selectedOption || "_______"}
                  </span>
                  
                  {currentQuestion.baseVerb && (
                    <span className="text-slate-600 whitespace-nowrap text-xl ml-1 font-normal">
                       ({currentQuestion.baseVerb})
                    </span>
                  )}
                  
                  <span>{currentQuestion.sentencePost}</span>
                </div>

                {/* Options Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
                  {currentQuestion.options.map((option, idx) => {
                    let buttonStyle = "bg-slate-950 border-slate-800 text-slate-300 hover:border-indigo-500/50 hover:bg-slate-800";
                    let icon = null;
                    
                    if (selectedOption === option && status === AnswerStatus.IDLE) {
                      buttonStyle = "bg-indigo-900/20 border-indigo-500 text-indigo-300 ring-2 ring-indigo-900/50";
                    }

                    if (status !== AnswerStatus.IDLE) {
                      if (option === currentQuestion.correctAnswer) {
                        buttonStyle = "bg-green-900/20 border-green-500 text-green-400 ring-2 ring-green-900/20";
                        icon = (
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-green-500">
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                          </span>
                        );
                      } else if (selectedOption === option && status === AnswerStatus.INCORRECT) {
                        buttonStyle = "bg-red-900/20 border-red-500 text-red-400 ring-2 ring-red-900/20 opacity-100";
                        icon = (
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-red-500">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                          </span>
                        );
                      } else {
                        buttonStyle = "bg-slate-950 border-slate-800 text-slate-600 opacity-50 cursor-not-allowed";
                      }
                    }

                    return (
                      <button
                        key={`${currentQuestion.id}-opt-${idx}`}
                        onClick={() => status === AnswerStatus.IDLE && setSelectedOption(option)}
                        disabled={status !== AnswerStatus.IDLE}
                        className={`relative p-4 rounded-xl border-2 text-lg font-bold transition-all duration-200 transform active:scale-98 ${buttonStyle} shadow-lg`}
                      >
                        <span className="relative z-10">{option}</span>
                        {icon}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Action Area */}
              {status === AnswerStatus.IDLE ? (
                <Button 
                  onClick={handleCheck} 
                  disabled={!selectedOption}
                  className="w-full text-lg mt-2"
                >
                  Check Answer
                </Button>
              ) : (
                <Feedback 
                  status={status} 
                  correctAnswer={currentQuestion.correctAnswer} 
                  explanation={currentQuestion.explanation}
                  onNext={handleNext}
                />
              )}
            </div>
          </div>
        )}

        <Footer />
      </div>
    </div>
  );
};

export default App;
