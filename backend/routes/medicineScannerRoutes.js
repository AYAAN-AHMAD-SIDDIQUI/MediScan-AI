
import express from "express";
import multer from "multer";
import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";
import {
  scanMedicine,
  getMedicineScanHistory,
} from "../controllers/medicineScannerController.js";

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
  },
});

router.post(
  "/scan",
  authMiddleware,
  roleMiddleware("PATIENT"),
  upload.single("medicine"),
  scanMedicine
);

router.get(
  "/history",
  authMiddleware,
  roleMiddleware("PATIENT"),
  getMedicineScanHistory
);

export default router;
