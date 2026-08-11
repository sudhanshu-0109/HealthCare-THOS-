import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticate } from '../middleware/authenticate.js';
import { checkRole } from '../middleware/checkRole.js';
import { ApiError } from '../utils/ApiError.js';

// Ensure uploads directory exists
const uploadDir = 'uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    // Optional: filter out unwanted file types here if needed
    cb(null, true);
  }
});

const router = Router();

// Upload a single file (e.g. lab report)
router.post('/', authenticate, checkRole('LAB_STAFF'), upload.single('file'), (req, res, next) => {
  if (!req.file) {
    return next(ApiError.badRequest('No file uploaded'));
  }
  
  // Construct a URL to the uploaded file
  // For local development, it will be relative. The frontend will prepend the backend URL if necessary.
  // E.g. http://localhost:5000/uploads/file-1234.pdf
  const fileUrl = `/uploads/${req.file.filename}`;
  
  res.status(201).json({
    success: true,
    data: {
      url: fileUrl,
      filename: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    }
  });
});

export default router;
