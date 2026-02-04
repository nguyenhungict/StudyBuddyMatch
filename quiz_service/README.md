# Quiz Generation Service (Node.js)

Microservice for generating quizzes from documents using Google Gemini API.

## Features
-   FastAPI equivalent implementation in Node.js/Express
-   Supports PDF (`.pdf`) and Word (`.docx`) and Text (`.txt`)
-   Uses Gemini 1.5 Flash for fast and cost-effective generation
-   JSON mode enforcement for reliable output

## Prerequisites
-   Node.js 18+
-   Google Gemini API Key

## Setup

1.  Install dependencies:
    ```bash
    npm install
    ```

2.  Configure Environment:
    Create `.env` file (if not exists):
    ```env
    PORT=9001
    GEMINI_API_KEY=your_api_key_here
    MAX_FILE_SIZE_MB=50
    ```

## Running

Dev mode:
```bash
npm run dev
```
(Requires `npm install -D nodemon` or global nodemon)

Start:
```bash
npm start
```

## API

### POST /generate
Generate quiz from file.

**Body (Multipart):**
-   `file`: File to upload
-   `count`: Number of questions (default 10)
-   `difficulty`: 'easy', 'medium', 'hard'

**Response:**
```json
{
  "success": true,
  "data": {
    "questions": [...],
    "file_hash": "...",
    "metadata": {...}
  }
}
```
