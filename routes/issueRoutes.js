import express from "express";
import {
  createIssue,
  getIssuesByUserId,
  deleteIssue,
  getUserProfile,
} from "../controllers/issueController.js";
import upload from "../middlewares/upload.js";
import FirebaseAuthMiddleware from "../middlewares/firebaseAuth.js";
const router = express.Router();

router.post(
  "/",
  FirebaseAuthMiddleware.verifySessionCookie,
  upload.single("image"),
  createIssue
);
router.get(
  "/myissues",
  FirebaseAuthMiddleware.verifySessionCookie,
  getIssuesByUserId
);
router.delete(
  "/myissues/:id",
  FirebaseAuthMiddleware.verifySessionCookie,
  deleteIssue
);
router.get(
  "/profile",
  FirebaseAuthMiddleware.verifySessionCookie,
  getUserProfile
);

export default router;