
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { GrammarQuestion, GrammarTopic } from "../types";

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

const getPromptForTopic = (topic: GrammarTopic, count: number): string => {
  const basePrompt = `Generate ${count} unique, fun, and engaging English grammar questions for 10-14 year olds.`;
  
  switch (topic) {
    case 'present_progressive':
      return `
        ${basePrompt}
        Topic: "Present Progressive" (Present Continuous).
        Contexts: School, Hobbies, Friends, Technology, Sports, Animals.
        
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
        ${basePrompt}
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
        ${basePrompt}
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
        ${basePrompt}
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
        ${basePrompt}
        Topic: "Negative To Be" (isn't, aren't, 'm not).
        
        Task:
        1. Create a sentence that implies a negative state.
        2. "baseVerb" should be "not be".
        3. Options should include: isn't, aren't, 'm not, amn't (as distractor unless appropriate dialect), not is.
        
        Example:
        Sentence: "He _______ at school, he is at home."
        baseVerb: "not be"
        correctAnswer: "isn't"
        options: ["isn't", "aren't", "not is", "amn't"]
      `;

    case 'adjectives_adverbs':
      return `
        ${basePrompt}
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
        ${basePrompt}
        Topic: "Past Simple Verbs" (Regular and Irregular).
        Contexts: Adventure stories, Ancient History, School memories, Funny accidents, Weekend trips, Science discoveries.
        
        Task:
        1. Create interesting sentences describing completed actions in the past. 
        2. Use a good mix of Regular verbs (walk -> walked) and Irregular verbs (buy -> bought, catch -> caught).
        3. "baseVerb" must be the infinitive form.
        4. Vary the sentence structure. Don't just start with "Yesterday". Use clauses like "When the bell rang...", "In 1492...", "Last summer...".
        5. Options must include: the correct past tense, the base form, the present tense, and a common mistake (like "buyed" or "eated").
        
        Example:
        Sentence: "The explorer _______ a hidden treasure map in the cave."
        baseVerb: "find"
        correctAnswer: "found"
        options: ["found", "finded", "find", "finding"]
      `;
      
    default:
      return basePrompt;
  }
};

export const fetchGrammarQuestions = async (topic: GrammarTopic, count: number = 10): Promise<GrammarQuestion[]> => {
  try {
    const model = 'gemini-2.5-flash';
    const prompt = getPromptForTopic(topic, count);

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: questionSchema,
        temperature: 0.7,
      },
    });

    const jsonText = response.text;
    if (!jsonText) {
      throw new Error("No data received from Gemini.");
    }

    const rawQuestions = JSON.parse(jsonText);
    
    // Helper to shuffle options
    const shuffleArray = (array: string[]) => {
      return array.sort(() => Math.random() - 0.5);
    };

    // Add local IDs and ensure options are shuffled
    return rawQuestions.map((q: any, index: number) => ({
      ...q,
      id: `q-${Date.now()}-${index}`,
      options: shuffleArray(q.options || [q.correctAnswer]), 
    }));

  } catch (error) {
    console.error("Error generating questions:", error);
    return getFallbackQuestions(topic);
  }
};

// Fallback data for offline/error mode
const getFallbackQuestions = (topic: GrammarTopic): GrammarQuestion[] => {
  switch (topic) {
    case 'present_progressive':
      return [
        {
          id: 'fb-pp-1',
          sentencePre: "Look! The cat ",
          sentencePost: " up the tree.",
          baseVerb: "climb",
          correctAnswer: "is climbing",
          explanation: "Singular subject 'The cat' needs 'is' + verb-ing.",
          options: ["is climbing", "are climbing", "climbing", "climb"],
        },
        {
          id: 'fb-pp-2',
          sentencePre: "We ",
          sentencePost: " math right now.",
          baseVerb: "study",
          correctAnswer: "are studying",
          explanation: "'We' is plural, so we use 'are'.",
          options: ["are studying", "is studying", "studying", "studies"],
        }
      ];
    case 'pronouns':
      return [
        {
          id: 'fb-pro-1',
          sentencePre: "_______ is my sister.",
          sentencePost: "",
          baseVerb: "Sarah",
          correctAnswer: "She",
          explanation: "Sarah is a girl, so we use 'She'.",
          options: ["She", "He", "They", "It"],
        }
      ];
    case 'has_have':
      return [
        {
          id: 'fb-hh-1',
          sentencePre: "I ",
          sentencePost: " a new bike.",
          baseVerb: "have",
          correctAnswer: "have",
          explanation: "With 'I', we use 'have'.",
          options: ["have", "has", "having", "had"],
        }
      ];
    case 'am_is_are':
       return [
        {
          id: 'fb-aia-1',
          sentencePre: "You ",
          sentencePost: " my best friend.",
          baseVerb: "be",
          correctAnswer: "are",
          explanation: "With 'You', we always use 'are'.",
          options: ["are", "is", "am", "be"],
        }
      ];
    case 'negatives':
      return [
        {
          id: 'fb-neg-1',
          sentencePre: "It ",
          sentencePost: " raining today.",
          baseVerb: "not be",
          correctAnswer: "isn't",
          explanation: "It is not -> It isn't.",
          options: ["isn't", "aren't", "not is", "amn't"],
        }
      ];
    case 'adjectives_adverbs':
      return [
        {
          id: 'fb-aa-1',
          sentencePre: "She sings very ",
          sentencePost: ".",
          baseVerb: "beautiful",
          correctAnswer: "beautifully",
          explanation: "We are describing how she sings (verb), so we need an adverb (-ly).",
          options: ["beautifully", "beautiful", "beauty", "beautify"],
        }
      ];
    case 'past_tense':
      return [
        {
          id: 'fb-pt-1',
          sentencePre: "Yesterday, I ",
          sentencePost: " pizza for dinner.",
          baseVerb: "eat",
          correctAnswer: "ate",
          explanation: "The past tense of 'eat' is 'ate'.",
          options: ["ate", "eat", "eated", "eating"],
        }
      ];
    default:
      return [];
  }
};
