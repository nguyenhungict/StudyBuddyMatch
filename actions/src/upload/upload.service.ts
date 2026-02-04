import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

@Injectable()
export class UploadService {
  async upload(file: Express.Multer.File): Promise<string> {
    // Generate unique filename using MD5 hash
    const hash = crypto.createHash('md5').update(file.buffer || Buffer.from(file.originalname + Date.now())).digest('hex');
    const ext = path.extname(file.originalname);
    const filename = hash + ext;

    // Define upload directory
    const uploadDir = path.join(process.cwd(), 'uploads');

    // Ensure upload directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Full file path
    const filePath = path.join(uploadDir, filename);

    // Write file to disk (check if buffer exists)
    if (file.buffer) {
      fs.writeFileSync(filePath, file.buffer);
    } else if (file.path) {
      // If using disk storage, copy from temp location
      fs.copyFileSync(file.path, filePath);
    } else {
      throw new Error('File buffer or path not found');
    }

    // Return relative path
    return `/uploads/${filename}`;
  }

}
