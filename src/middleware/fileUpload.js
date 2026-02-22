import multer from "multer";
import path from "path";
import fs from "fs";

// Ensure upload folder exists
const createFolder = (folderName) => {
    const uploadPath = path.join(process.cwd(), "uploads", folderName);

    if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
    }

    return uploadPath;
};

// Storage config
const storage = (folderName) =>
    multer.diskStorage({
        destination: function (req, file, cb) {
            const uploadPath = createFolder(folderName || "default");
            cb(null, uploadPath);
        },
        filename: function (req, file, cb) {
            const uniqueName =
                Date.now() + "-" + Math.round(Math.random() * 1e9);
            cb(null, uniqueName + path.extname(file.originalname));
        },
    });

// File filter (images only — you can modify)
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp|pdf/;
    const extName = allowedTypes.test(
        path.extname(file.originalname).toLowerCase()
    );
    const mimeType = allowedTypes.test(file.mimetype);

    if (extName && mimeType) {
        cb(null, true);
    } else {
        cb(new Error("Only images and PDFs are allowed"));
    }
};

// Main upload middleware factory
const fileUpload = ({
    fieldName = "file",
    maxCount = 1,
    folderName = "default",
    fileSize = 5 * 1024 * 1024, // 5MB
} = {}) => {
    const upload = multer({
        storage: storage(folderName),
        limits: { fileSize },
        fileFilter,
    });

    // If multiple files
    if (maxCount > 1) {
        return upload.array(fieldName, maxCount);
    }

    // Single file
    return upload.single(fieldName);
};

export default fileUpload;