import fs from "fs";
import path from "path";
import multer from "multer";
import { requireAuth } from "../../../lib/auth";

const uploadDir = path.join(process.cwd(), "public", "uploads", "blog");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}-${file.originalname.replace(/\s+/g, "_")}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!String(file.mimetype || "").startsWith("image/")) {
      return cb(new Error("Only image uploads are allowed"));
    }
    cb(null, true);
  },
});

export const config = {
  api: { bodyParser: false },
};

function runMulter(req, res) {
  return new Promise((resolve, reject) => {
    upload.single("image")(req, res, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    await runMulter(req, res);

    if (!req.file) {
      return res.status(400).json({ error: "Image file is required" });
    }

    return res.status(200).json({
      imageUrl: `/uploads/blog/${req.file.filename}`,
    });
  } catch (error) {
    return res.status(500).json({ error: error?.message || "Failed to upload image" });
  }
}

export default requireAuth(handler, ["ADMIN"]);
