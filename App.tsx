
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { fetchGrammarQuestions } from './services/geminiService';
import { GrammarQuestion, GameState, AnswerStatus, QuestionHistory, GrammarTopic } from './types';
import { Button } from './components/Button';
import { ScoreBoard } from './components/ScoreBoard';
import { Feedback } from './components/Feedback';

const TOPICS: { id: GrammarTopic; title: string; desc: string; color: string; icon: string }[] = [
  { 
    id: 'present_progressive', 
    title: 'Present Progressive', 
    desc: 'am/is/are + verb-ing', 
    color: 'bg-indigo-500',
    icon: '🏃'
  },
  { 
    id: 'pronouns', 
    title: 'Subject Pronouns', 
    desc: 'He, She, It, They...', 
    color: 'bg-green-500',
    icon: '👥'
  },
  { 
    id: 'has_have', 
    title: 'Has vs Have', 
    desc: 'Possession', 
    color: 'bg-orange-500',
    icon: '🎒'
  },
  { 
    id: 'am_is_are', 
    title: 'To Be (Am/Is/Are)', 
    desc: 'States and Descriptions', 
    color: 'bg-blue-500',
    icon: '🙂'
  },
  { 
    id: 'negatives', 
    title: 'Negatives', 
    desc: "isn't, aren't, 'm not", 
    color: 'bg-red-500',
    icon: '🚫'
  },
  {
    id: 'adjectives_adverbs',
    title: 'Adj. vs Adverbs',
    desc: 'Describing Things vs Actions',
    color: 'bg-pink-500',
    icon: '🎨'
  },
  {
    id: 'past_tense',
    title: 'Past Tense',
    desc: 'Yesterday, Last week...',
    color: 'bg-yellow-500',
    icon: '⏪'
  }
];

const App: React.FC = () => {
  const [selectedTopic, setSelectedTopic] = useState<GrammarTopic | null>(null);
  
  const [questions, setQuestions] = useState<GrammarQuestion[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [status, setStatus] = useState<AnswerStatus>(AnswerStatus.IDLE);
  
  const [history, setHistory] = useState<QuestionHistory[]>([]);
  
  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    streak: 0,
    totalAnswered: 0,
  });

  const loadQuestions = useCallback(async (topic: GrammarTopic, count = 10, append = false) => {
    setLoading(true);
    setError(null);
    try {
      const newQuestions = await fetchGrammarQuestions(topic, count);
      setQuestions(prev => append ? [...prev, ...newQuestions] : newQuestions);
    } catch (err) {
      setError("Oops! Couldn't load questions. Check your internet.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Effect to load questions when topic changes
  useEffect(() => {
    if (selectedTopic) {
      loadQuestions(selectedTopic, 10);
    } else {
      setQuestions([]);
      setCurrentQIndex(0);
      setStatus(AnswerStatus.IDLE);
      setSelectedOption(null);
    }
  }, [selectedTopic, loadQuestions]);

  // Pre-fetch more questions
  useEffect(() => {
    if (selectedTopic && questions.length > 0 && currentQIndex >= questions.length - 2 && !loading) {
       fetchGrammarQuestions(selectedTopic, 5).then(newQs => {
         setQuestions(prev => [...prev, ...newQs]);
       });
    }
  }, [currentQIndex, questions.length, loading, selectedTopic]);

  const handleTopicSelect = (topic: GrammarTopic) => {
    setGameState({ score: 0, streak: 0, totalAnswered: 0 });
    setHistory([]);
    setSelectedTopic(topic);
  };

  const handleBackToMenu = () => {
    setSelectedTopic(null);
  };

  const handleCheck = () => {
    if (!selectedOption) return;

    const currentQuestion = questions[currentQIndex];
    const isCorrect = selectedOption === currentQuestion.correctAnswer;

    setHistory(prev => [...prev, {
      question: currentQuestion,
      selectedOption: selectedOption,
      isCorrect: isCorrect,
      timestamp: Date.now()
    }]);

    if (isCorrect) {
      setStatus(AnswerStatus.CORRECT);
      setGameState(prev => ({
        ...prev,
        score: prev.score + 10 + (prev.streak * 2),
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
    setSelectedOption(null);
    setStatus(AnswerStatus.IDLE);
    setCurrentQIndex(prev => prev + 1);
  };

  const handleExport = () => {
    if (history.length === 0) return;
    const topicTitle = TOPICS.find(t => t.id === selectedTopic)?.title || "Grammar";
    const header = `GRAMMAR HERO - ${topicTitle.toUpperCase()} REPORT\nDate: ${new Date().toLocaleString()}\nFinal Score: ${gameState.score}\nTotal Answered: ${gameState.totalAnswered}\n\n---------------------------------------------------\n\n`;
    
    const content = history.map((h, i) => {
      const fullSentence = `${h.question.sentencePre} ______ (${h.question.baseVerb}) ${h.question.sentencePost}`;
      const result = h.isCorrect ? "CORRECT" : "INCORRECT";
      
      return `Question ${i + 1}: ${fullSentence}\nYour Answer: ${h.selectedOption}\nResult: ${result}\nCorrect Answer: ${h.question.correctAnswer}\n`;
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

  // MENU SCREEN
  if (!selectedTopic) {
    return (
      <div className="min-h-screen bg-indigo-50 py-12 px-4 font-sans">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-extrabold text-indigo-900 mb-4 tracking-tight">
              Grammar<span className="text-indigo-600">Hero</span>
            </h1>
            <p className="text-xl text-indigo-600 font-medium">Choose your challenge!</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {TOPICS.map((topic) => (
              <button
                key={topic.id}
                onClick={() => handleTopicSelect(topic.id)}
                className="group relative overflow-hidden bg-white p-6 rounded-3xl shadow-lg border-2 border-transparent hover:border-indigo-200 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl text-left"
              >
                <div className={`absolute top-0 right-0 w-24 h-24 transform translate-x-8 -translate-y-8 rounded-full opacity-10 ${topic.color}`}></div>
                <div className="text-4xl mb-4">{topic.icon}</div>
                <h3 className="text-2xl font-bold text-gray-800 group-hover:text-indigo-600 transition-colors">
                  {topic.title}
                </h3>
                <p className="text-gray-500 mt-2 font-medium">
                  {topic.desc}
                </p>
                <div className={`mt-6 inline-flex items-center text-sm font-bold uppercase tracking-wider ${topic.color.replace('bg-', 'text-')}`}>
                  Start Game <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // LOADING STATE
  if (loading && questions.length === 0) {
    return (
      <div className="min-h-screen bg-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-bold text-indigo-900">Loading {TOPICS.find(t => t.id === selectedTopic)?.title}...</h2>
        </div>
      </div>
    );
  }

  // ERROR STATE
  if (error) {
    return (
      <div className="min-h-screen bg-indigo-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md">
          <h2 className="text-xl font-bold text-gray-800 mb-2">Something went wrong</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="flex gap-4 justify-center">
            <Button onClick={() => handleBackToMenu()} variant="secondary">Back to Menu</Button>
            <Button onClick={() => selectedTopic && loadQuestions(selectedTopic, 10)}>Try Again</Button>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQIndex];

  // GAME SCREEN
  return (
    <div className="min-h-screen bg-indigo-50 py-8 px-4 font-sans selection:bg-indigo-200">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <header className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={handleBackToMenu}
              className="p-2 bg-white rounded-lg text-indigo-600 hover:bg-indigo-50 shadow-sm border border-indigo-100 transition-all"
              title="Back to Menu"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div>
              <h1 className="text-2xl font-extrabold text-indigo-900">
                {TOPICS.find(t => t.id === selectedTopic)?.title}
              </h1>
              <p className="text-sm text-indigo-500 font-bold uppercase tracking-wider">Level {Math.floor(currentQIndex / 10) + 1}</p>
            </div>
          </div>
          
          {history.length > 0 && (
            <button 
              onClick={handleExport}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-white text-indigo-600 text-sm font-bold rounded-lg shadow-sm border border-indigo-100 hover:bg-indigo-50 transition-colors"
            >
              Export Results
            </button>
          )}
        </header>

        {/* Stats */}
        <ScoreBoard gameState={gameState} />

        {/* Question Card */}
        {currentQuestion && (
          <div className="bg-white rounded-3xl shadow-xl border-b-4 border-indigo-100 overflow-hidden">
            {/* Progress Bar */}
            <div className="h-2 bg-indigo-50 w-full">
              <div 
                className="h-full bg-indigo-500 transition-all duration-500 ease-out"
                style={{ width: `${((currentQIndex + 1) % 10) * 10}%` }}
              />
            </div>

            <div className="p-8 md:p-10">
              <div className="mb-8">
                <span className="inline-block px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold tracking-wide mb-4 uppercase">
                  Question {currentQIndex + 1}
                </span>
                
                {/* Sentence Display */}
                <div className="text-2xl md:text-3xl font-medium leading-relaxed text-gray-800 my-6">
                  <span>{currentQuestion.sentencePre}</span>
                  <span className={`inline-block min-w-[120px] px-2 border-b-4 text-center mx-1 transition-colors duration-300
                    ${selectedOption ? 'text-indigo-700 border-indigo-300' : 'text-transparent border-gray-300'}
                    ${status === AnswerStatus.CORRECT ? '!text-green-700 !border-green-500' : ''}
                    ${status === AnswerStatus.INCORRECT ? '!text-red-700 !border-red-500' : ''}
                  `}>
                    {selectedOption || "_______"}
                  </span>
                  
                  {/* Hint logic - if baseVerb is provided, show it. Context aware. */}
                  {currentQuestion.baseVerb && (
                    <span className="text-gray-400 whitespace-nowrap text-xl ml-1">
                       ({currentQuestion.baseVerb})
                    </span>
                  )}
                  
                  <span>{currentQuestion.sentencePost}</span>
                </div>

                {/* Options Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
                  {currentQuestion.options.map((option, idx) => {
                    let buttonStyle = "bg-white border-gray-200 text-gray-600 hover:border-indigo-300 hover:bg-gray-50";
                    let icon = null;
                    
                    if (selectedOption === option && status === AnswerStatus.IDLE) {
                      buttonStyle = "bg-indigo-50 border-indigo-500 text-indigo-700 ring-2 ring-indigo-200";
                    }

                    if (status !== AnswerStatus.IDLE) {
                      if (option === currentQuestion.correctAnswer) {
                        buttonStyle = "bg-green-100 border-green-500 text-green-800 ring-2 ring-green-200";
                        icon = (
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-green-600">
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                          </span>
                        );
                      } else if (selectedOption === option && status === AnswerStatus.INCORRECT) {
                        buttonStyle = "bg-red-100 border-red-500 text-red-800 ring-2 ring-red-200 opacity-100";
                        icon = (
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-red-600">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                          </span>
                        );
                      } else {
                        buttonStyle = "bg-gray-50 border-gray-100 text-gray-400 opacity-50 cursor-not-allowed";
                      }
                    }

                    return (
                      <button
                        key={`${currentQuestion.id}-opt-${idx}`}
                        onClick={() => status === AnswerStatus.IDLE && setSelectedOption(option)}
                        disabled={status !== AnswerStatus.IDLE}
                        className={`relative p-4 rounded-xl border-2 text-lg font-bold transition-all duration-200 transform active:scale-98 ${buttonStyle} shadow-sm`}
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

        <div className="mt-8 text-center text-gray-400 text-sm">
           AI Generated Content • Fun English Grammar
        </div>
      </div>
    </div>
  );
};

export default App;
