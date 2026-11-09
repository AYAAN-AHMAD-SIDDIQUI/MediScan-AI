import express from "express";
import multer from "multer";

import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";
import {
  uploadReport,
  getMyReports,
  getReportById,
  analyzeReport,
  deleteReport,
  askReportQuestion,
} from "../controllers/reportController.js";
const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/reports");
  },

  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + file.originalname;

    cb(null, uniqueName);
  },
});

const upload = multer({
  storage: storage,
});

// ===============================
// Upload Report
// ===============================
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("PATIENT"),
  deleteReport
);
router.post(
  "/upload",
  authMiddleware,
  roleMiddleware("PATIENT"),
  upload.single("report"),
  uploadReport
);

// ===============================
// Get My Reports
// ===============================
// Ask questions about a report
router.post(
  "/:id/ask",
  authMiddleware,
  roleMiddleware("PATIENT"),
  askReportQuestion
);
router.get(
  "/",
  authMiddleware,
  roleMiddleware("PATIENT"),
  getMyReports
);

// ===============================
// Get Single Report
// ===============================

router.get(
  "/:id",
  authMiddleware,
  roleMiddleware("PATIENT"),
  getReportById
);

// ===============================
// Analyze Report
// ===============================

router.post(
  "/:id/analyze",
  authMiddleware,
  roleMiddleware("PATIENT"),
  analyzeReport
);

export default router;
