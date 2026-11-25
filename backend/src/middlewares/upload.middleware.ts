import multer from 'multer';
import path from 'path';
import fs from 'fs';

const uploadDir = path.join(process.cwd(), 'uploads');

if (!fs.existsSync(uploadDir)) {
	fs.mkdirSync(uploadDir, { recursive: true });
}

export const upload = multer({
	storage: multer.diskStorage({
		destination: (_req, _file, cb) => {
			cb(null, uploadDir);
		},
		filename: (_req, file, cb) => {
			const ext = path.extname(file.originalname);
			const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
			cb(null, uniqueName);
		},
	}),
	limits: {
		fileSize: 5 * 1024 * 1024, // 5MB
	},
});
