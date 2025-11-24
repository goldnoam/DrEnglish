
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { fetchGrammarQuestions } from './services/geminiService';
import { GrammarQuestion, GameState, AnswerStatus, QuestionHistory, GrammarTopic, Difficulty, GameMode } from './types';
import { Button } from './components/Button';
import { ScoreBoard } from './components/ScoreBoard';
import { Feedback } from './components/Feedback';

interface SubCategory {
  id: string;
  label: string;
  desc: string;
}

interface TopicConfig {
  id: GrammarTopic;
  title: string;
  desc: string;
  color: string;
  icon: string;
  subCategories: SubCategory[];
}

const TOPICS: TopicConfig[] = [
  { 
    id: 'present_progressive', 
    title: 'Present Progressive', 
    desc: 'am/is/are + verb-ing', 
    color: 'bg-indigo-600',
    icon: '🏃',
    subCategories: [
      { id: 'actions_now', label: 'Happening Now', desc: 'Actions happening right at this moment.' },
      { id: 'temporary', label: 'Temporary Situations', desc: 'Things happening around now but not permanent.' },
      { id: 'future', label: 'Future Plans', desc: 'Fixed arrangements for the near future.' },
      { id: 'spelling', label: 'Spelling Rules', desc: 'Focus on -ing spelling (run -> running).' }
    ]
  },
  { 
    id: 'pronouns', 
    title: 'Subject Pronouns', 
    desc: 'He, She, It, They...', 
    color: 'bg-green-600',
    icon: '👥',
    subCategories: [
      { id: 'singular', label: 'Singular Pronouns', desc: 'I, You, He, She, It.' },
      { id: 'plural', label: 'Plural Pronouns', desc: 'We, You, They.' },
      { id: 'mixed', label: 'Mixed Practice', desc: 'All pronouns mixed together.' }
    ]
  },
  { 
    id: 'has_have', 
    title: 'Has vs Have', 
    desc: 'Possession', 
    color: 'bg-orange-600',
    icon: '🎒',
    subCategories: [
      { id: 'affirmative', label: 'Positive Sentences', desc: 'I have, She has...' },
      { id: 'questions', label: 'Questions', desc: 'Do you have...? Does she have...?' },
      { id: 'mixed', label: 'Mixed', desc: 'Both sentences and questions.' }
    ]
  },
  { 
    id: 'am_is_are', 
    title: 'To Be (Am/Is/Are)', 
    desc: 'States and Descriptions', 
    color: 'bg-blue-600',
    icon: '🙂',
    subCategories: [
      { id: 'statements', label: 'Statements', desc: 'I am happy. She is tall.' },
      { id: 'questions', label: 'Questions', desc: 'Are you ready? Is he here?' },
      { id: 'contractions', label: 'Contractions', desc: "I'm, You're, He's..." }
    ]
  },
  { 
    id: 'negatives', 
    title: 'Negatives', 
    desc: "isn't, aren't, 'm not", 
    color: 'bg-red-600',
    icon: '🚫',
    subCategories: [
      { id: 'to_be_neg', label: 'To Be Negatives', desc: "isn't, aren't, 'm not" },
      { id: 'do_does_neg', label: 'Do/Does Negatives', desc: "don't, doesn't" },
      { id: 'mixed', label: 'Mixed Negatives', desc: "Combined practice." }
    ]
  },
  {
    id: 'adjectives_adverbs',
    title: 'Adj. vs Adverbs',
    desc: 'Describing Things vs Actions',
    color: 'bg-pink-600',
    icon: '🎨',
    subCategories: [
      { id: 'basic', label: 'Basic Rules', desc: 'Slow vs Slowly, Quick vs Quickly.' },
      { id: 'irregular', label: 'Irregular Forms', desc: 'Good vs Well, Fast vs Fast.' },
      { id: 'mixed', label: 'Mixed Practice', desc: 'Challenging mix of all types.' }
    ]
  },
  {
    id: 'past_tense',
    title: 'Past Tense',
    desc: 'Yesterday, Last week...',
    color: 'bg-yellow-600',
    icon: '⏪',
    subCategories: [
      { id: 'regular', label: 'Regular Verbs', desc: 'Verbs ending in -ed.' },
      { id: 'irregular', label: 'Irregular Verbs', desc: 'Go -> Went, See -> Saw.' },
      { id: 'negatives_questions', label: 'Negatives & Questions', desc: "Didn't go, Did you see...?" },
      { id: 'mixed', label: 'Full Mix', desc: 'All past tense forms.' }
    ]
  }
];

const DIFFICULTY_OPTIONS: { id: Difficulty; label: string }[] = [
  { id: 'easy', label: 'Easy' },
  { id: 'intermediate', label: 'Intermediate' },
  { id: 'medium', label: 'Medium' },
  { id: 'advanced', label: 'Advanced' },
  { id: 'hard', label: 'Hard' },
];

const MODE_OPTIONS: { id: GameMode; label: string; desc: string }[] = [
  { id: 'practice', label: 'Practice', desc: 'No time limit' },
  { id: 'timed', label: 'Timed Blitz', desc: '60 Seconds' },
];

type ViewState = 'MENU' | 'SUBMENU' | 'GAME';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('MENU');
  const [selectedTopic, setSelectedTopic] = useState<GrammarTopic | null>(null);
  const [selectedSubTopic, setSelectedSubTopic] = useState<string | undefined>(undefined);
  
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [gameMode, setGameMode] = useState<GameMode>('practice');
  
  const [questions, setQuestions] = useState<GrammarQuestion[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [status, setStatus] = useState<AnswerStatus>(AnswerStatus.IDLE);
  const [questionStartTime, setQuestionStartTime] = useState<number>(0);
  
  // Dragging state
  const [isDragging, setIsDragging] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  
  const [history, setHistory] = useState<QuestionHistory[]>([]);
  
  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    streak: 0,
    totalAnswered: 0,
    timeLeft: 60,
    isGameOver: false,
  });

  const timerRef = useRef<number | null>(null);

  // Increased default count to 15
  const loadQuestions = useCallback(async (topic: GrammarTopic, subTopic: string | undefined, count = 15, diff: Difficulty, append = false) => {
    setLoading(true);
    setError(null);
    try {
      const newQuestions = await fetchGrammarQuestions(topic, subTopic, count, diff);
      setQuestions(prev => append ? [...prev, ...newQuestions] : newQuestions);
    } catch (err) {
      setError("Oops! Couldn't load questions. Check your internet.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Timer Effect
  useEffect(() => {
    if (view === 'GAME' && gameMode === 'timed' && !gameState.isGameOver && !loading && questions.length > 0) {
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
  }, [view, gameMode, gameState.isGameOver, loading, questions.length]);

  // Effect to load questions when entering game - Requesting 15
  useEffect(() => {
    if (view === 'GAME' && selectedTopic) {
      loadQuestions(selectedTopic, selectedSubTopic, 15, difficulty);
      setQuestionStartTime(Date.now());
    } else if (view !== 'GAME') {
      setQuestions([]);
      setCurrentQIndex(0);
      setStatus(AnswerStatus.IDLE);
      setSelectedOption(null);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [view, selectedTopic, selectedSubTopic, difficulty, loadQuestions]);

  // Pre-fetch more questions - Requesting 10 for buffer
  useEffect(() => {
    if (view === 'GAME' && selectedTopic && questions.length > 0 && currentQIndex >= questions.length - 2 && !loading && !gameState.isGameOver) {
       fetchGrammarQuestions(selectedTopic, selectedSubTopic, 10, difficulty).then(newQs => {
         setQuestions(prev => [...prev, ...newQs]);
       });
    }
  }, [currentQIndex, questions.length, loading, selectedTopic, selectedSubTopic, difficulty, gameState.isGameOver, view]);

  const handleTopicSelect = (topic: GrammarTopic) => {
    setSelectedTopic(topic);
    setView('SUBMENU');
  };

  const handleSubTopicSelect = (subTopicId: string) => {
    setSelectedSubTopic(subTopicId);
    setGameState({ 
      score: 0, 
      streak: 0, 
      totalAnswered: 0, 
      timeLeft: 60, 
      isGameOver: false 
    });
    setHistory([]);
    setView('GAME');
  };

  const handleBackToMenu = () => {
    setView('MENU');
    setSelectedTopic(null);
    setSelectedSubTopic(undefined);
    setGameState(prev => ({ ...prev, isGameOver: false }));
  };

  const handleBackToSubMenu = () => {
    setView('SUBMENU');
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
      let points = 10;
      points += (gameState.streak * 2);
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
    if (gameState.isGameOver) return;
    
    setSelectedOption(null);
    setStatus(AnswerStatus.IDLE);
    setCurrentQIndex(prev => prev + 1);
    setQuestionStartTime(Date.now());
  };

  const handleExport = () => {
    if (history.length === 0) return;
    const topicConfig = TOPICS.find(t => t.id === selectedTopic);
    const subTopicTitle = topicConfig?.subCategories.find(s => s.id === selectedSubTopic)?.label || "General";
    
    const header = `GRAMMAR HERO REPORT\nTopic: ${topicConfig?.title.toUpperCase()} - ${subTopicTitle.toUpperCase()}\nDifficulty: ${difficulty.toUpperCase()}\nDate: ${new Date().toLocaleString()}\nFinal Score: ${gameState.score}\nTotal Answered: ${gameState.totalAnswered}\n\n---------------------------------------------------\n\n`;
    
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

  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, option: string) => {
    if (status !== AnswerStatus.IDLE) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData("text/plain", option);
    e.dataTransfer.effectAllowed = "copy";
    setIsDragging(true);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    setIsDragOver(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (status !== AnswerStatus.IDLE) return;
    e.dataTransfer.dropEffect = "copy";
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    setIsDragOver(false);
    const option = e.dataTransfer.getData("text/plain");
    if (status === AnswerStatus.IDLE && option) {
      setSelectedOption(option);
    }
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

  // --- VIEWS ---

  // 1. MAIN MENU
  if (view === 'MENU') {
    return (
      <div className="min-h-screen bg-slate-950 py-12 px-4 font-sans text-slate-100">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-6xl font-black text-white mb-4 tracking-tight drop-shadow-lg">
              Grammar<span className="text-indigo-500">Hero</span>
            </h1>
            <p className="text-xl text-slate-400 font-medium">Master English Grammar with AI</p>
          </div>

          <div className="bg-slate-900/50 backdrop-blur-md p-6 rounded-3xl border border-slate-800 mb-10 max-w-4xl mx-auto">
             <div className="flex flex-col gap-6">
                {/* Game Mode */}
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
                </div>

                {/* Difficulty */}
                <div>
                   <label className="block text-slate-400 text-xs font-bold uppercase tracking-widest mb-3">Difficulty Level</label>
                   <div className="flex flex-wrap bg-slate-950 p-1 rounded-xl border border-slate-800">
                      {DIFFICULTY_OPTIONS.map(diff => (
                        <button
                          key={diff.id}
                          onClick={() => setDifficulty(diff.id)}
                          className={`flex-1 py-2 px-2 rounded-lg text-xs md:text-sm font-bold transition-all min-w-[80px] ${
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
                  Explore Topics <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </button>
            ))}
          </div>
          <Footer />
        </div>
      </div>
    );
  }

  // 2. SUB-CATEGORY MENU
  if (view === 'SUBMENU' && selectedTopic) {
    const topicConfig = TOPICS.find(t => t.id === selectedTopic);
    if (!topicConfig) return null;

    return (
      <div className="min-h-screen bg-slate-950 py-12 px-4 font-sans text-slate-100">
        <div className="max-w-4xl mx-auto">
          <button 
            onClick={handleBackToMenu}
            className="mb-8 flex items-center text-slate-400 hover:text-white transition-colors"
          >
            ← Back to Main Menu
          </button>
          
          <div className="text-center mb-12">
            <div className={`inline-block p-4 rounded-2xl mb-4 ${topicConfig.color} bg-opacity-20`}>
                <span className="text-4xl">{topicConfig.icon}</span>
            </div>
            <h1 className="text-4xl font-black text-white mb-2">{topicConfig.title}</h1>
            <p className="text-slate-400">Select a specific area to practice</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {topicConfig.subCategories.map(sub => (
               <button
                key={sub.id}
                onClick={() => handleSubTopicSelect(sub.id)}
                className="bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500/50 p-6 rounded-2xl text-left transition-all group"
               >
                 <h3 className="text-xl font-bold text-white group-hover:text-indigo-400 mb-1">{sub.label}</h3>
                 <p className="text-slate-400 text-sm">{sub.desc}</p>
               </button>
             ))}
          </div>
          <Footer />
        </div>
      </div>
    );
  }

  // 3. GAME LOADING STATE
  if (loading && questions.length === 0) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
        <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <h2 className="text-xl font-bold text-slate-200">Generating {difficulty} questions...</h2>
        <p className="text-slate-500 text-sm mt-2">Using Artificial Intelligence</p>
      </div>
    );
  }

  // 4. ERROR STATE
  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="bg-slate-900 p-8 rounded-2xl shadow-xl text-center max-w-md border border-slate-800">
          <h2 className="text-xl font-bold text-white mb-2">Something went wrong</h2>
          <p className="text-slate-400 mb-6">{error}</p>
          <div className="flex gap-4 justify-center">
            <Button onClick={() => handleBackToSubMenu()} variant="secondary">Back</Button>
            <Button onClick={() => selectedTopic && loadQuestions(selectedTopic, selectedSubTopic, 15, difficulty)}>Try Again</Button>
          </div>
        </div>
      </div>
    );
  }
  
  // 5. GAME OVER STATE
  if (gameState.isGameOver) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 font-sans">
        <div className="bg-slate-900 p-8 rounded-3xl shadow-2xl border border-slate-800 max-w-lg w-full text-center animate-in fade-in zoom-in duration-300">
          <div className="w-20 h-20 bg-indigo-900/50 rounded-full flex items-center justify-center mx-auto mb-6 text-indigo-400 text-4xl">
             🏆
          </div>
          <h2 className="text-4xl font-black text-white mb-2">{gameMode === 'timed' ? "Time's Up!" : "Session Complete"}</h2>
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
             <Button onClick={handleBackToSubMenu}>Play Again (Same Topic)</Button>
             <Button onClick={handleBackToMenu} variant="secondary" className="!bg-slate-800 !text-slate-400 hover:!text-white hover:!bg-slate-700">Main Menu</Button>
          </div>
        </div>
      </div>
    )
  }

  const currentQuestion = questions[currentQIndex];

  // 6. GAME SCREEN
  return (
    <div className="min-h-screen bg-slate-950 py-8 px-4 font-sans selection:bg-indigo-500/30 text-slate-200">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <header className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={handleBackToSubMenu}
              className="p-2 bg-slate-900 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white shadow-sm border border-slate-800 transition-all"
              title="Back to Topics"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div>
              <h1 className="text-2xl font-extrabold text-white">
                {TOPICS.find(t => t.id === selectedTopic)?.title}
              </h1>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                 <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-400 uppercase">
                    {TOPICS.find(t => t.id === selectedTopic)?.subCategories.find(s => s.id === selectedSubTopic)?.label}
                 </span>
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
                style={{ width: `${((currentQIndex + 1) % 15) * (100/15)}%` }}
              />
            </div>

            <div className="p-8 md:p-10">
              <div className="mb-8">
                <div className="flex justify-between items-center mb-6">
                   <span className="inline-block px-3 py-1 bg-indigo-500/10 text-indigo-400 rounded-full text-xs font-bold tracking-wide uppercase border border-indigo-500/20">
                     Question {gameState.totalAnswered + 1}
                   </span>
                </div>
                
                {/* Sentence Display - Now Drop Zone */}
                <div className="text-2xl md:text-3xl font-medium leading-relaxed text-slate-100 my-6">
                  <span>{currentQuestion.sentencePre}</span>
                  <span 
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`inline-block min-w-[140px] px-4 py-1 border-b-4 text-center mx-1 transition-all duration-300 rounded-lg relative align-bottom
                    ${selectedOption ? 'text-indigo-300 border-indigo-500/50 bg-indigo-900/10' : 'text-transparent border-slate-700 bg-slate-800/30'}
                    ${status === AnswerStatus.CORRECT ? '!text-green-400 !border-green-500 !bg-green-900/10' : ''}
                    ${status === AnswerStatus.INCORRECT ? '!text-red-400 !border-red-500 !bg-red-900/10' : ''}
                    ${isDragging && !selectedOption ? 'border-dashed border-indigo-400/50 animate-pulse' : ''}
                    ${isDragOver ? '!border-indigo-400 !bg-indigo-500/20 scale-105 shadow-[0_0_15px_rgba(99,102,241,0.3)]' : ''}
                  `}>
                    {selectedOption || (isDragging ? <span className="text-xs text-indigo-300 font-bold tracking-widest uppercase">Drop Here</span> : "_______")}
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
                    const canDrag = status === AnswerStatus.IDLE;
                    
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
                        draggable={canDrag}
                        onDragStart={(e) => handleDragStart(e, option)}
                        onDragEnd={handleDragEnd}
                        onClick={() => status === AnswerStatus.IDLE && setSelectedOption(option)}
                        disabled={status !== AnswerStatus.IDLE}
                        className={`relative p-4 rounded-xl border-2 text-lg font-bold transition-all duration-200 transform active:scale-98 ${buttonStyle} shadow-lg ${canDrag ? 'cursor-grab active:cursor-grabbing' : ''}`}
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
