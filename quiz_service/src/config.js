require('dotenv').config();

const config = {
    port: process.env.PORT || 9001,
    geminiApiKey: process.env.GEMINI_API_KEY,
    maxFileSize: (parseInt(process.env.MAX_FILE_SIZE_MB) || 50) * 1024 * 1024, // bytes
    allowedOrigins: (process.env.ALLOWED_ORIGINS || 'http://localhost:3000,http://localhost:8000').split(','),
    allowedExtensions: ['.pdf', '.docx', '.txt'],
    validCounts: [5, 10, 15, 20],
    validDifficulties: ['easy', 'medium', 'hard'],
    uploadDir: './uploads'
};

if (!config.geminiApiKey) {
    console.error('❌ GEMINI_API_KEY is not set in .env');
}

module.exports = config;
