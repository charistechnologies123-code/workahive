import multer from "multer";
import { requireAuth } from "../../../lib/auth";
import { MAX_UPLOAD_SIZE_BYTES, MAX_UPLOAD_SIZE_LABEL } from "../../../lib/upload-limits";
import { uploadBlogMediaToStorage } from "../../../lib/blog-media-storage";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_SIZE_BYTES },
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

    if (req.file.size > MAX_UPLOAD_SIZE_BYTES) {
      return res.status(400).json({
        error: `Image file must be ${MAX_UPLOAD_SIZE_LABEL} or smaller.`,
      });
    }

    const postId = req.body?.postId ? String(req.body.postId) : "draft";

    const uploaded = await uploadBlogMediaToStorage({
      buffer: req.file.buffer,
      contentType: req.file.mimetype,
      originalName: req.file.originalname,
      postId,
      kind: "images",
    });

    return res.status(200).json({
      imageUrl: uploaded.publicUrl,
      imagePath: uploaded.path,
    });
  } catch (error) {
    if (error?.message?.includes("File too large")) {
      return res.status(400).json({
        error: `Image file must be ${MAX_UPLOAD_SIZE_LABEL} or smaller.`,
      });
    }

    return res.status(500).json({
      error: error?.message || "Failed to upload image",
    });
  }
}

export default requireAuth(handler, ["ADMIN"]);
