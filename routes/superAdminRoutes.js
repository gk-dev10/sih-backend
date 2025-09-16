import express from "express";
import { getAdmins, createAdmin, deleteAdmin } from "../controllers/superAdminController.js";
const router = express.Router();

router.get("/", getAdmins);
router.post("/create", createAdmin);
router.delete("/:id", deleteAdmin);

export default router;