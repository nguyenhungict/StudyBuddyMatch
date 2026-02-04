const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const config = require('./config');
const geminiClient = require('./gemini_client');
const fileParser = require('./file_parser');

const app = express();

// Configure CORS
app.use(cors({
    origin: config.allowedOrigins,
    methods: ['GET', 'POST']
}));

app.use(express.json());

// Configure Upload
const upload = multer({
    dest: config.uploadDir,
    limits: {
        fileSize: config.maxFileSize
    }
});

// Ensure upload dir exists
if (!fs.existsSync(config.uploadDir)) {
    fs.mkdirSync(config.uploadDir, { recursive: true });
}

// Routes
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'quiz-generation-js',
        version: '1.0.0',
        cache: {} // Mock
    });
});

app.get('/cache/stats', (req, res) => {
    res.json({}); // Mock
});

app.post('/generate', upload.single('file'), async (req, res) => {
    let filePath = null;

    try {
        if (!req.file) {
            return errorResponse(res, 400, 'NO_FILE', 'No file provided in request');
        }

        filePath = req.file.path;
        console.log(`Received file: ${req.file.originalname} (${req.file.size} bytes)`);

        // Validate Params
        let count = parseInt(req.body.count || 10);
        if (!config.validCounts.includes(count)) {
            // Fallback or error? Python returned error.
            // But let's be flexible, if it's a number.
            // Python code: if count not in VALID_COUNTS -> error.
            if (isNaN(count)) count = 10;
        }

        const difficulty = (req.body.difficulty || 'medium').toLowerCase();
        if (!config.validDifficulties.includes(difficulty)) {
            return errorResponse(res, 400, 'INVALID_DIFFICULTY', `Invalid difficulty: ${difficulty}`);
        }

        // Read File to Buffer
        const fileBuffer = fs.readFileSync(filePath);

        // Delete temp file immediately after reading to avoid EBUSY/locking issues
        try {
            fs.unlinkSync(filePath);
            filePath = null; // Mark as deleted
        } catch (delErr) {
            console.warn('⚠️ Failed to delete temp file immediately:', delErr);
        }

        // Calculate Hash
        const fileHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

        // Parse File (from buffer)
        console.log(`📄 Parsing ${req.file.originalname}...`);
        const parseResult = await fileParser.parse(fileBuffer, req.file.originalname);

        if (parseResult.error) {
            return errorResponse(res, 400, parseResult.error, parseResult.message);
        }

        console.log(`✅ Extracted ${parseResult.word_count} words`);

        // Generate Quiz
        const quizResult = await geminiClient.generateQuiz(parseResult.text, count, difficulty);

        if (quizResult.error) {
            return errorResponse(res, 400, quizResult.error, quizResult.message, quizResult.details);
        }

        // Response
        res.json({
            success: true,
            data: {
                file_hash: fileHash,
                cached: false,
                questions: quizResult.questions,
                metadata: {
                    count,
                    difficulty,
                    generated_at: new Date().toISOString(),
                    model: 'gemini-1.5-flash-js'
                }
            }
        });

    } catch (e) {
        console.error(`❌ Unexpected error in /generate:`, e);
        errorResponse(res, 500, 'INTERNAL_ERROR', 'Internal server error', e.toString());
    } finally {
        // Cleanup
        if (filePath && fs.existsSync(filePath)) {
            try {
                fs.unlinkSync(filePath);
            } catch (err) {
                console.error('Failed to delete temp file:', err);
            }
        }
    }
});

function errorResponse(res, status, code, message, details = null) {
    const error = { code, message };
    if (details) error.details = details;
    res.status(status).json({ success: false, error });
}

// Start Server
app.listen(config.port, () => {
    console.log(`
╔══════════════════════════════════════════════════════════╗
║          Quiz Generation Service (JS) - READY            ║
╠══════════════════════════════════════════════════════════╣
║  Port: ${config.port}                                            ║
║  Environment: ${process.env.NODE_ENV || 'development'}                   ║
║  Gemini API: ${config.geminiApiKey ? '✅ Configured' : '❌ Missing'}                      ║
╚══════════════════════════════════════════════════════════╝
`);
    if (!config.geminiApiKey) {
        console.warn("WARNING: GEMINI_API_KEY is missing. Quiz generation will fail.");
    }
});
