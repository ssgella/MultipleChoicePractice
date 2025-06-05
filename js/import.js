// js/import.js
import { loadQuestions, saveQuestions } from './data.js';

document.addEventListener('DOMContentLoaded', () => {
    const topicNameInput = document.getElementById('topicName');
    const questionsTextInput = document.getElementById('questionsText');
    const answerKeyTextInput = document.getElementById('answerKeyText');
    const importButton = document.getElementById('importBtn');
    const importStatusDiv = document.getElementById('import-status');

    importButton.addEventListener('click', importQuestions);

    function showStatus(message, type) {
        importStatusDiv.textContent = message;
        importStatusDiv.className = `status ${type}`; // Use 'status' as base class, then 'success' or 'error'
        importStatusDiv.style.display = 'block';
        setTimeout(() => {
            importStatusDiv.style.display = 'none';
        }, 5000); // Hide after 5 seconds
    }

    function importQuestions() {
        const topicName = topicNameInput.value.trim();
        const questionsText = questionsTextInput.value.trim();
        const answerKeyText = answerKeyTextInput.value.trim();

        if (!topicName) {
            showStatus('Please enter a topic name.', 'error');
            return;
        }
        if (!questionsText) {
            showStatus('Please paste questions in the "Questions Text" area.', 'error');
            return;
        }
        if (!answerKeyText) {
            showStatus('Please paste the answer key in the "Answer Key" area.', 'error');
            return;
        }

        let parsedQuestions = [];
        let parsedAnswerKey = {};
        let questionParsingErrors = 0;
        let answerKeyParsingErrors = 0;

        // 1. Parse Questions
        const questionBlocks = questionsText.split(/\n\s*\n/).filter(block => block.trim() !== '');
        questionBlocks.forEach(block => {
            const lines = block.split('\n').map(line => line.trim()).filter(line => line !== '');
            if (lines.length < 6) { // Expect at least 1 question line + 5 options
                console.warn('Skipping malformed question block:', block);
                questionParsingErrors++;
                return;
            }

            const questionLine = lines[0];
            const match = questionLine.match(/^(\d+)\.\s*(.*)/); // Matches "1. Question text"
            if (!match) {
                console.warn('Skipping question without number or text:', questionLine);
                questionParsingErrors++;
                return;
            }

            const questionNumber = parseInt(match[1], 10);
            const rawQuestionText = match[2].trim();

            const options = {};
            const optionLetters = ['A', 'B', 'C', 'D', 'E'];
            let validOptions = true;

            for (let i = 1; i <= 5; i++) {
                const optionLine = lines[i];
                const optionMatch = optionLine.match(/^([A-E])\.\s*(.*)/); // Matches "A. Option text"
                if (optionMatch && optionLetters.includes(optionMatch[1])) {
                    options[optionMatch[1]] = optionMatch[2].trim();
                } else {
                    console.warn(`Malformed option line for question ${questionNumber}:`, optionLine);
                    validOptions = false;
                    break;
                }
            }

            if (validOptions) {
                const questionId = `${topicName}-${questionNumber}`; // Unique ID for the question
                parsedQuestions.push({
                    id: questionId,
                    topic: topicName,
                    questionNumber: questionNumber, // Keep original number for display
                    questionText: rawQuestionText,
                    options: options,
                    correctAnswer: '' // Will be filled from answer key
                });
            } else {
                questionParsingErrors++;
            }
        });

        // 2. Parse Answer Key
        const answerKeyLines = answerKeyText.split('\n').filter(line => line.trim() !== '');
        answerKeyLines.forEach(line => {
            const match = line.match(/^(\d+):([A-E])$/i); // Matches "1:B" (case-insensitive for letter)
            if (match) {
                const qNum = parseInt(match[1], 10);
                parsedAnswerKey[qNum] = match[2].toUpperCase();
            } else {
                console.warn('Skipping malformed answer key line:', line);
                answerKeyParsingErrors++;
            }
        });

        // 3. Match Answers to Questions and Filter Out Questions Without Answers
        let questionsToSave = [];
        let missingAnswers = 0;
        parsedQuestions.forEach(q => {
            if (parsedAnswerKey[q.questionNumber]) {
                q.correctAnswer = parsedAnswerKey[q.questionNumber];
                questionsToSave.push(q);
            } else {
                console.warn(`No answer found for question ${q.questionNumber}. Skipping question.`);
                missingAnswers++;
            }
        });

        if (questionsToSave.length === 0) {
            showStatus('No valid questions and answers were parsed. Please check your input format.', 'error');
            return;
        }

        // 4. Load existing questions, merge, and save
        let existingQuestions = loadQuestions();
        // Filter out existing questions with the same topic and question number to prevent duplicates
        // Or, if you want to allow updates, this logic might need to be 'upsert'
        const newQuestionsFiltered = questionsToSave.filter(newQ =>
            !existingQuestions.some(existingQ => existingQ.id === newQ.id)
        );

        const mergedQuestions = [...existingQuestions, ...newQuestionsFiltered];
        saveQuestions(mergedQuestions);

        let successMessage = `Successfully imported ${newQuestionsFiltered.length} new questions for topic "${topicName}".`;
        if (questionParsingErrors > 0) {
            successMessage += ` (${questionParsingErrors} question blocks had parsing errors).`;
        }
        if (answerKeyParsingErrors > 0) {
            successMessage += ` (${answerKeyParsingErrors} answer key lines had parsing errors).`;
        }
        if (missingAnswers > 0) {
             successMessage += ` (${missingAnswers} questions were skipped due to missing answers in the key).`;
        }

        showStatus(successMessage, 'success');

        // Clear input fields after successful import
        questionsTextInput.value = '';
        answerKeyTextInput.value = '';
        // topicNameInput.value = ''; // Optionally clear topic name too
    }
});
