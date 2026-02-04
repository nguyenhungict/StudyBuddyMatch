import multer from "multer";
import path from "path";
import fs from "fs";

// ⭐ LUÔN ĐÚNG, KHÔNG BAO GIỜ SAI PATH
const uploadDir = path.join(process.cwd(), "actions", "uploads");

// ⭐ Tạo thư mục nếu chưa tồn tại
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log("📁 Created upload directory:", uploadDir);
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `${unique}-${file.originalname}`);
  },
});

export const upload = multer({ storage });
