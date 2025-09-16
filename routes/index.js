import {Router} from 'express';
import adminRoutes from './adminRoutes.js';
import authRoutes from './authRoutes.js';
import superAdminRoutes from './superAdminRoutes.js';
import issueRoutes from './issueRoutes.js';
import aiRoutes from './aiRoutes.js';

const router = Router();

router.use("/auth", authRoutes);
router.use("/admin", adminRoutes);
router.use("/superAdmin", superAdminRoutes);
router.use("/issue", issueRoutes);
router.use("/ai", aiRoutes);

export default router;