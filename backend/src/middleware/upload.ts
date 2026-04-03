// src/middleware/upload.ts
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { AppError } from './errorHandler';
import logger from '../utils/logger';

// Ensure uploads directory exists
const uploadDir = process.env.UPLOAD_DIR || 'uploads';
const fullUploadPath = path.join(process.cwd(), uploadDir);

if (!fs.existsSync(fullUploadPath)) {
  fs.mkdirSync(fullUploadPath, { recursive: true });
  logger.info(`Created uploads directory: ${fullUploadPath}`);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, fullUploadPath);
  },
  filename: (req, file, cb) => {
    // Sanitize original name and add timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, ext)
      .replace(/[^a-z0-9]/gi, '_')
      .substring(0, 30);
    cb(null, `${baseName}-${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (req: any, file: any, cb: any) => {
  const allowedTypes = /jpeg|jpg|png|gif|pdf|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  }
  cb(new AppError('Only images (JPEG, PNG, GIF, WEBP) and PDFs are allowed', 400));
};

export const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880'), // 5MB default
  },
  fileFilter,
});

export const uploadSingle = (fieldName: string) => upload.single(fieldName);
export const uploadMultiple = (fieldName: string, maxCount: number) =>
  upload.array(fieldName, maxCount);