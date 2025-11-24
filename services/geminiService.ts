
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { GrammarQuestion, GrammarTopic, Difficulty } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

// Schema for the expected JSON response
const questionSchema: Schema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      sentencePre: {
        type: Type.STRING,
        description: "The part of the sentence before the blank.",
      },
      sentencePost: {
        type: Type.STRING,
        description: "The part of the sentence after the blank.",
      },
      baseVerb: {
        type: Type.STRING,
        description: "The hint word(s) to appear in brackets (e.g., the verb to conjugate, or the noun to replace).",
      },
      correctAnswer: {
        type: Type.STRING,
        description: "The correct answer to fill in the blank.",
      },
      explanation: {
        type: Type.STRING,
        description: "A short, helpful explanation for a 10-14 year old.",
      },
      options: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "A list of 4 options: 1 correct answer and 3 distractors.",
      },
    },
    required: ["sentencePre", "sentencePost", "baseVerb", "correctAnswer", "explanation", "options"],
  },
};

const getPromptForTopic = (topic: GrammarTopic, subTopic: string | undefined, count: number, difficulty: Difficulty): string => {
  // Add a random seed to ensure unique generations every time
  const randomSeed = Math.floor(Math.random() * 100000);
  
  const basePrompt = `Generate ${count} unique, fun, random, and engaging English grammar questions for 10-14 year olds. Random Seed: ${randomSeed}.`;
  
  let difficultyInstruction = "";
  switch (difficulty) {
    case 'easy':
      difficultyInstruction = "DIFFICULTY: EASY. Use short, simple SVO sentences (Subject-Verb-Object). Use high-frequency vocabulary. Distractors should be visually distinct and obviously wrong.";
      break;
    case 'intermediate':
      difficultyInstruction = "DIFFICULTY: INTERMEDIATE. Use slightly longer sentences. Include simple compound sentences (using 'and', 'but'). Vocabulary should be common school level. Distractors should check for basic agreement errors.";
      break;
    case 'medium':
      difficultyInstruction = "DIFFICULTY: MEDIUM. Use mixed sentence structures. Include time markers and context clues. Distractors should include common grammatical misconceptions.";
      break;
    case 'advanced':
      difficultyInstruction = "DIFFICULTY: ADVANCED. Use complex sentence structures with dependent clauses. Context should be richer. Distractors should be plausible but grammatically incorrect in the specific context.";
      break;
    case 'hard':
      difficultyInstruction = "DIFFICULTY: HARD. Use sophisticated sentence structures and diverse contexts (Science, History, Literature). Focus on exceptions to rules and subtle nuances. Distractors should differ by only minor grammatical features.";
      break;
  }

  const instructions = `
    ${basePrompt}
    ${difficultyInstruction}
    ${subTopic ? `FOCUS SUB-TOPIC: "${subTopic}". Ensure all questions strictly practice this specific aspect.` : ''}
    Ensure the "baseVerb" acts as a helpful hint.
    CRITICAL: Ensure the questions are RANDOM and varied. Do not repeat the same patterns.
  `;
  
  switch (topic) {
    case 'present_progressive':
      return `
        ${instructions}
        Topic: "Present Progressive" (Present Continuous).
        Contexts: School, Hobbies, Friends, Technology, Sports, Animals, Space, Fantasy.
        
        Task:
        1. Create a sentence with a missing verb in Present Progressive form.
        2. "baseVerb" should be the infinitive verb (e.g., "run").
        3. Options should include common spelling mistakes (runing vs running) or wrong auxiliaries.
        
        Example:
        Sentence: "She _______ (run) to the park."
        baseVerb: "run"
        correctAnswer: "is running"
        options: ["is running", "are running", "runing", "running"]
      `;
    
    case 'pronouns':
      return `
        ${instructions}
        Topic: "Subject Pronouns" (He, She, It, They, We, You).
        
        Task:
        1. Create a sentence where a name or noun phrase needs to be replaced by a pronoun.
        2. "baseVerb" should be the Noun/Name being replaced (e.g., "My Dad", "The cats", "Sarah and I").
        3. Options should be subject pronouns.
        
        Example:
        Sentence: "_______ is my best friend."
        baseVerb: "Tom"
        correctAnswer: "He"
        options: ["He", "She", "They", "It"]
      `;

    case 'has_have':
      return `
        ${instructions}
        Topic: "Has vs Have" (Present Simple).
        
        Task:
        1. Create a sentence about possession or attributes.
        2. "baseVerb" should be "have".
        3. Options should mix has, have, having, etc.
        
        Example:
        Sentence: "The dog _______ a big bone."
        baseVerb: "have"
        correctAnswer: "has"
        options: ["has", "have", "having", "haves"]
      `;

    case 'am_is_are':
      return `
        ${instructions}
        Topic: "To Be" (Am, Is, Are) - Affirmative.
        
        Task:
        1. Create a sentence describing a state, age, or quality.
        2. "baseVerb" should be "be".
        3. Options: am, is, are, be.
        
        Example:
        Sentence: "They _______ very happy today."
        baseVerb: "be"
        correctAnswer: "are"
        options: ["are", "is", "am", "be"]
      `;

    case 'negatives':
      return `
        ${instructions}
        Topic: "Negative Forms".
        
        Task:
        1. Create a sentence that implies a negative state using "to be" or "do/does".
        2. "baseVerb" should be "not + verb".
        3. Options should include: isn't, aren't, doesn't, don't.
        
        Example:
        Sentence: "He _______ at school, he is at home."
        baseVerb: "not be"
        correctAnswer: "isn't"
        options: ["isn't", "aren't", "not is", "amn't"]
      `;

    case 'adjectives_adverbs':
      return `
        ${instructions}
        Topic: "Adjectives vs Adverbs".
        
        Task:
        1. Create a sentence where the student must choose between an adjective (describing a noun) or an adverb (describing a verb).
        2. "baseVerb" should be the root word (e.g. "quick", "loud").
        3. Options should include the adjective, the adverb (-ly), and distractors (spelling or wrong form).
        
        Example:
        Sentence: "The turtle walks very _______."
        baseVerb: "slow"
        correctAnswer: "slowly"
        options: ["slowly", "slow", "slowness", "slowing"]
      `;

    case 'past_tense':
      return `
        ${instructions}
        Topic: "Past Simple Verbs" (Regular and Irregular).
        Contexts: Adventure, History, School, Funny Accidents, Science, Mystery, Daily Life.
        
        Task:
        1. Create interesting sentences describing completed actions in the past.
        2. CRITICAL: Use a 50/50 mix of Regular verbs (walk->walked) and Irregular verbs (go->went, buy->bought).
        3. CRITICAL: Vary the sentence structures significantly. 
           - Do NOT start every sentence with "Yesterday" or "Last week".
           - Use time clauses at the start: "When the volcano erupted...", "After the movie ended...", "In 1969...".
           - Use complex sentences suitable for 10-14 year olds.
        4. "baseVerb" must be the infinitive form.
        5. Options must include: the correct past tense, the base form, the present tense, and a common mistake (like "buyed", "eated", "gode").
        
        Example:
        Sentence: "When the lights went out, I _______ a loud noise."
        baseVerb: "hear"
        correctAnswer: "heard"
        options: ["heard", "heared", "hear", "hearing"]
      `;
      
    default:
      return basePrompt;
  }
};

export const fetchGrammarQuestions = async (topic: GrammarTopic, subTopic: string | undefined, count: number = 30, difficulty: Difficulty = 'medium'): Promise<GrammarQuestion[]> => {
  try {
    const model = 'gemini-2.5-flash';
    const prompt = getPromptForTopic(topic, subTopic, count, difficulty);

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: questionSchema,
        temperature: 0.8, // Increased temperature for more randomness
      },
    });

    const jsonText = response.text;
    if (!jsonText) {
      throw new Error("No data received from Gemini.");
    }

    const rawQuestions = JSON.parse(jsonText);
    
    // Helper to shuffle arrays
    const shuffleArray = (array: any[]) => {
      return array.sort(() => Math.random() - 0.5);
    };

    // Add local IDs and ensure options are shuffled
    const processedQuestions = rawQuestions.map((q: any, index: number) => ({
      ...q,
      id: `q-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`,
      options: shuffleArray(q.options || [q.correctAnswer]), 
    }));
    
    // Shuffle the questions themselves so they aren't in generated order
    return shuffleArray(processedQuestions);

  } catch (error) {
    console.error("Error generating questions:", error);
    return getFallbackQuestions(topic);
  }
};

// Fallback data for offline/error mode
const getFallbackQuestions = (topic: GrammarTopic): GrammarQuestion[] => {
  // Simple fallbacks just to keep app running
  const base = {
      id: 'fb-1',
      sentencePre: "Example: The app is ",
      sentencePost: " offline mode.",
      baseVerb: "use",
      correctAnswer: "using",
      explanation: "This is a fallback question because the AI service is unreachable.",
      options: ["using", "used", "uses", "use"],
  };
  
  // Return a generic list for any topic if real fallbacks missing
  return [base, {...base, id: 'fb-2'}, {...base, id: 'fb-3'}];
};
