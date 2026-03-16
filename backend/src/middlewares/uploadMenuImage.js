import multer from "multer";
import cloudinary from "../config/cloudinary.js";
import streamifier from "streamifier";

/* Multer memory storage */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      cb(new Error("Only image files allowed"), false);
    } else {
      cb(null, true);
    }
  },
});

/* ✅ THIS IS WHAT ROUTES WILL USE */
export const uploadMenuImage = upload.single("image");

/* Cloudinary uploader helper */
export const uploadToCloudinary = (file) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "hms/menu",
        transformation: [{ width: 800, height: 800, crop: "limit" }],
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    streamifier.createReadStream(file.buffer).pipe(stream);
  });
