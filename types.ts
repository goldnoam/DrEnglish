
export type GrammarTopic = 'present_progressive' | 'pronouns' | 'has_have' | 'am_is_are' | 'negatives' | 'adjectives_adverbs' | 'past_tense';

export type Difficulty = 'easy' | 'intermediate' | 'medium' | 'advanced' | 'hard';
export type GameMode = 'practice' | 'timed';

export interface GrammarQuestion {
  id: string;
  sentencePre: string;
  sentencePost: string;
  baseVerb: string; // Acts as the "Hint" in brackets (e.g., "run", "My Dad", "be")
  correctAnswer: string;
  explanation: string;
  options: string[];
}

export interface GameState {
  score: number;
  streak: number;
  totalAnswered: number;
  timeLeft: number; // in seconds
  isGameOver: boolean;
}

export interface QuestionHistory {
  question: GrammarQuestion;
  selectedOption: string;
  isCorrect: boolean;
  timestamp: number;
  timeTaken: number; // time taken to answer in seconds
}

export enum AnswerStatus {
  IDLE = 'IDLE',
  CORRECT = 'CORRECT',
  INCORRECT = 'INCORRECT',
}
