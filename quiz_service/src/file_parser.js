const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');
const mammoth = require('mammoth'); // For DOCX

class FileParser {

    /**
     * Parse a file to extract text.
     * @param {Buffer} fileBuffer - The buffer of the file content.
     * @param {string} originalFilename - The original filename (to determine extension correctly).
     */
    async parse(fileBuffer, originalFilename) {
        try {
            if (!fileBuffer) {
                return { error: 'NO_FILE', message: 'No file buffer provided' };
            }

            const ext = path.extname(originalFilename || '').toLowerCase();
            let text = '';

            if (ext === '.pdf') {
                text = await this._parsePdf(fileBuffer);
            } else if (ext === '.docx') {
                text = await this._parseDocx(fileBuffer);
            } else if (ext === '.txt') {
                text = fileBuffer.toString('utf8');
            } else {
                return {
                    error: 'INVALID_FORMAT',
                    message: `Unsupported file format: '${ext}'. Supported: .pdf, .docx, .txt`
                };
            }

            // Cleanup text
            text = text.trim();

            if (text.length < 50) {
                return {
                    error: 'NO_TEXT_FOUND',
                    message: 'Could not extract sufficient text from document. The file may be empty or scanned image.'
                };
            }

            const wordCount = text.split(/\s+/).length;
            const pageCount = Math.max(1, Math.ceil(wordCount / 250)); // Estimate

            return {
                text: text,
                word_count: wordCount,
                page_count: pageCount
            };

        } catch (error) {
            console.error('Parsing error:', error);
            return {
                error: 'PARSING_FAILED',
                message: `Failed to parse document: ${error.message}`
            };
        }
    }

    async _parsePdf(buffer) {
        try {
            const data = await pdf(buffer);
            return data.text;
        } catch (e) {
            throw new Error(`PDF Parsing failed: ${e.message}`);
        }
    }

    async _parseDocx(buffer) {
        try {
            const result = await mammoth.extractRawText({ buffer: buffer });
            return result.value;
        } catch (e) {
            throw new Error(`DOCX Parsing failed: ${e.message}`);
        }
    }
}

module.exports = new FileParser();
