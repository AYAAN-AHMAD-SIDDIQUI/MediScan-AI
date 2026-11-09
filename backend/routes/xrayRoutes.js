import express from "express";
import multer from "multer";
import fs from "fs";

import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";

import {
  uploadXray,
  analyzeUploadedXray,
  getAllXrays,
  getXrayById,
} from "../controllers/xrayController.js";

const router = express.Router();

// =========================
// UPLOAD FOLDER
// =========================

const uploadPath = "uploads/xrays";

if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, {
    recursive: true,
  });
}

// =========================
// MULTER STORAGE
// =========================

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadPath);
  },

  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + file.originalname;

    cb(null, uniqueName);
  },
});

// =========================
// FILE FILTER
// =========================

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(
      new Error("Only X-ray image files are allowed"),
      false
    );
  }
};

// =========================
// MULTER
// =========================

const upload = multer({
  storage: storage,

  fileFilter: fileFilter,

  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

// =========================
// UPLOAD X-RAY
// =========================

router.post(
  "/upload",
  authMiddleware,
  roleMiddleware("PATIENT"),
  upload.single("xray"),
  uploadXray
);

// =========================
// GET ALL MY X-RAYS
// =========================

router.get(
  "/",
  authMiddleware,
  roleMiddleware("PATIENT"),
  getAllXrays
);

// =========================
// GET X-RAY BY ID
// =========================

router.get(
  "/:id",
  authMiddleware,
  roleMiddleware("PATIENT"),
  getXrayById
);

// =========================
// ANALYZE X-RAY
// =========================

router.post(
  "/:id/analyze",
  authMiddleware,
  roleMiddleware("PATIENT"),
  analyzeUploadedXray
);

export default router;