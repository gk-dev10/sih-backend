import {Router} from "express";
import FirebaseAuthController from "../controllers/firebaseAuthController.js";
const router = Router();

router.post("/login",FirebaseAuthController.login);
router.post("/logout",FirebaseAuthController.logout);

export default router;