const { GoogleGenerativeAI } = require("@google/generative-ai");
const config = require('./config');

class GeminiClient {
    constructor() {
        if (!config.geminiApiKey) {
            throw new Error("Gemini API Key is missing");
        }
        this.genAI = new GoogleGenerativeAI(config.geminiApiKey);

        // Using "gemini-2.5-flash" as confirmed available in 2026
        this.model = this.genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            generationConfig: {
                responseMimeType: "application/json",
            }
        });
        console.log("✅ Gemini API initialized (using gemini-2.5-flash)");
    }

    async generateQuiz(text, count, difficulty) {
        // Large context window available
        const MAX_CHARS = 1000000;
        if (text.length > MAX_CHARS) {
            console.warn(`⚠️ Text too long (${text.length} chars), truncating to ${MAX_CHARS}`);
            text = text.substring(0, MAX_CHARS) + "\n\n[Content truncated due to length...]";
        }

        const prompt = `You are an expert educational quiz generator. Based on the following content, generate ${count} multiple-choice questions.

**Requirements:**
- Difficulty level: ${difficulty}
- Each question MUST have exactly 4 options (A, B, C, D)
- Only ONE correct answer per question
- Include brief explanation (1-2 sentences) for the correct answer
- Questions should cover main concepts from the text
- Avoid trivial or overly complex questions
- Ensure questions are clear and unambiguous

**Difficulty Guidelines:**
- Easy: Basic recall, definitions, simple facts
- Medium: Application, comprehension, analysis
- Hard: Synthesis, evaluation, critical thinking

**Content:**
${text}

**Output Format (STRICT JSON):**
{
  "questions": [
    {
      "question": "string (The actual question text generated from content)",
      "options": ["string (Option A)", "string (Option B)", "string (Option C)", "string (Option D)"],
      "correct_answer": 0, // Index 0-3
      "explanation": "string (Explanation for why the answer is correct)"
    }
  ]
}

IMPORTANT: Generate EXACTLY ${count} questions based ONLY on the provided content. 
DO NOT use the example questions from the Output Format. 
Return ONLY valid JSON.
`;

        console.log(`🤖 Generating ${count} ${difficulty} questions...`);
        console.log(`   Text length: ${text.length} chars`);

        try {
            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const textResponse = response.text();

            return this._parseResponse(textResponse, count);

        } catch (error) {
            console.error(`❌ Gemini API Error: ${error.message}`);

            if (error.message.includes('503')) {
                return {
                    error: 'SERVICE_UNAVAILABLE',
                    message: 'Gemini API is currently overloaded. Please try again later.',
                    details: error.message
                };
            }

            return {
                error: 'GENERATION_FAILED',
                message: `Quiz generation failed: ${error.message}`,
                details: error.message
            };
        }
    }

    _parseResponse(responseText, expectedCount) {
        try {
            // Clean response
            let text = responseText.trim();
            if (text.startsWith('```json')) text = text.substring(7);
            else if (text.startsWith('```')) text = text.substring(3);
            if (text.endsWith('```')) text = text.substring(0, text.length - 3);
            text = text.trim();

            const data = JSON.parse(text);

            if (!data.questions || !Array.isArray(data.questions)) {
                return {
                    error: 'INVALID_RESPONSE',
                    message: 'Response missing "questions" array'
                };
            }

            const validQuestions = data.questions.filter(q => this._validateQuestion(q));

            if (validQuestions.length === 0) {
                return {
                    error: 'NO_VALID_QUESTIONS',
                    message: 'No valid questions generated. Please try again.'
                };
            }

            if (validQuestions.length < expectedCount) {
                console.warn(`⚠️ Generated ${validQuestions.length}/${expectedCount} questions`);
            }

            return { questions: validQuestions };

        } catch (e) {
            console.error("JSON Parsing failed. Raw response:", responseText);
            return {
                error: 'PARSING_FAILED',
                message: `Failed to parse Gemini response as JSON: ${e.message}`,
                raw_response: responseText.substring(0, 500)
            };
        }
    }

    _validateQuestion(q) {
        if (!q.question || typeof q.question !== 'string') return false;
        if (!q.options || !Array.isArray(q.options) || q.options.length !== 4) return false;
        if (typeof q.correct_answer === 'string') q.correct_answer = parseInt(q.correct_answer);
        if (typeof q.correct_answer !== 'number' || q.correct_answer < 0 || q.correct_answer > 3) return false;
        if (!q.explanation || typeof q.explanation !== 'string') return false;
        return true;
    }
}

module.exports = new GeminiClient();
