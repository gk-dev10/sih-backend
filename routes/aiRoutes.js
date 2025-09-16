import express from "express";
import multer from "multer";
import { createIssue, analyzeImageOnly } from "../controllers/aiController.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.post("/issue", upload.single("image"), createIssue);
router.post("/analyze-image", upload.single("image"), analyzeImageOnly);

export default router;
