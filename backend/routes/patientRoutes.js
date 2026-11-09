import express from "express";

import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";

import { getMyProfile } from "../controllers/patientController.js";

const router = express.Router();

// Logged-in PATIENT only
router.get(
  "/me",
  authMiddleware,
  roleMiddleware("PATIENT"),
  getMyProfile
);

export default router;