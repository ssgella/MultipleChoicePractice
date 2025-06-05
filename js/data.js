// js/data.js

// Structure for a question object:
// {
//   id: string, // Unique ID for the question, e.g., 'topic-qNum'
//   topic: string,
//   questionText: string,
//   options: { A: string, B: string, C: string, D: string, E: string },
//   correctAnswer: string // Letter (A, B, C, D, E)
// }

// Structure for user performance data (per question):
// {
//   questionId: string,
//   attempts: number,
//   correctAttempts: number,
//   lastAttemptCorrect: boolean, // true if last attempt was correct
//   timestamps: number[] // Array of timestamps for each attempt
// }

// Global data structures (initially empty, populated from localStorage)
let questions = [];
let userPerformance = {}; // Keyed by questionId

const QUESTIONS_STORAGE_KEY = 'mc_app_questions';
const PERFORMANCE_STORAGE_KEY = 'mc_app_performance';

/**
 * Loads questions from localStorage.
 * @returns {Array} An array of question objects.
 */
export function loadQuestions() {
    try {
        const storedQuestions = localStorage.getItem(QUESTIONS_STORAGE_KEY);
        questions = storedQuestions ? JSON.parse(storedQuestions) : [];
        return questions;
    } catch (e) {
        console.error("Error loading questions from localStorage:", e);
        return [];
    }
}

/**
 * Saves questions to localStorage.
 * @param {Array} newQuestions - An array of question objects to save.
 */
export function saveQuestions(newQuestions) {
    try {
        questions = newQuestions; // Update global array
        localStorage.setItem(QUESTIONS_STORAGE_KEY, JSON.stringify(questions));
        console.log("Questions saved to localStorage.");
    } catch (e) {
        console.error("Error saving questions to localStorage:", e);
    }
}

/**
 * Loads user performance data from localStorage.
 * @returns {Object} An object where keys are question IDs and values are performance objects.
 */
export function loadUserPerformance() {
    try {
        const storedPerformance = localStorage.getItem(PERFORMANCE_STORAGE_KEY);
        userPerformance = storedPerformance ? JSON.parse(storedPerformance) : {};
        return userPerformance;
    } catch (e) {
        console.error("Error loading user performance from localStorage:", e);
        return {};
    }
}

/**
 * Saves user performance data to localStorage.
 * @param {Object} newUserPerformance - The performance object to save.
 */
export function saveUserPerformance(newUserPerformance) {
    try {
        userPerformance = newUserPerformance; // Update global object
        localStorage.setItem(PERFORMANCE_STORAGE_KEY, JSON.stringify(userPerformance));
        console.log("User performance saved to localStorage.");
    } catch (e) {
        console.error("Error saving user performance to localStorage:", e);
    }
}

/**
 * Adds or updates performance data for a single question.
 * @param {string} questionId - The ID of the question.
 * @param {boolean} isCorrect - Whether the last attempt was correct.
 */
export function updateQuestionPerformance(questionId, isCorrect) {
    userPerformance[questionId] = userPerformance[questionId] || {
        questionId: questionId,
        attempts: 0,
        correctAttempts: 0,
        lastAttemptCorrect: false,
        timestamps: []
    };

    userPerformance[questionId].attempts++;
    if (isCorrect) {
        userPerformance[questionId].correctAttempts++;
    }
    userPerformance[questionId].lastAttemptCorrect = isCorrect;
    userPerformance[questionId].timestamps.push(Date.now());

    saveUserPerformance(userPerformance); // Save after each update
}

// Initial load when the script runs
loadQuestions();
loadUserPerformance();
