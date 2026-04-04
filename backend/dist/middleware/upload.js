"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadMultiple = exports.uploadSingle = exports.upload = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const errorHandler_1 = require("./errorHandler");
const logger_1 = __importDefault(require("../utils/logger"));
const uploadDir = process.env.UPLOAD_DIR || 'uploads';
const fullUploadPath = path_1.default.join(process.cwd(), uploadDir);
if (!fs_1.default.existsSync(fullUploadPath)) {
    fs_1.default.mkdirSync(fullUploadPath, { recursive: true });
    logger_1.default.info(`Created uploads directory: ${fullUploadPath}`);
}
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, fullUploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = path_1.default.extname(file.originalname);
        const baseName = path_1.default.basename(file.originalname, ext)
            .replace(/[^a-z0-9]/gi, '_')
            .substring(0, 30);
        cb(null, `${baseName}-${uniqueSuffix}${ext}`);
    },
});
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|webp/;
    const extname = allowedTypes.test(path_1.default.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
        return cb(null, true);
    }
    cb(new errorHandler_1.AppError('Only images (JPEG, PNG, GIF, WEBP) and PDFs are allowed', 400));
};
exports.upload = (0, multer_1.default)({
    storage,
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880'),
    },
    fileFilter,
});
const uploadSingle = (fieldName) => exports.upload.single(fieldName);
exports.uploadSingle = uploadSingle;
const uploadMultiple = (fieldName, maxCount) => exports.upload.array(fieldName, maxCount);
exports.uploadMultiple = uploadMultiple;
//# sourceMappingURL=upload.js.map