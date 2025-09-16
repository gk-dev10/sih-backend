import express from "express";
import AdminController from "../controllers/adminController.js";
import ReportsController from "../controllers/reportsController.js";
import adminAuth from "../middlewares/adminAuth.js";
import adminAuthController from "../controllers/adminAuthController.js";

const router = express.Router();

router.post("/login", adminAuthController.login);
router.post("/logout", adminAuth.verifyCookie, adminAuthController.logout);

router.get(
  "/city-issues",
  adminAuth.verifyCookie,
  AdminController.getCityIssues
);

router.patch(
  "/update-issue/:id",
  adminAuth.verifyCookie,
  AdminController.updateIssueStatus
);

router.get("/users", adminAuth.verifyCookie, AdminController.getAllUsers);
router.get(
  "/pendingIssues",
  adminAuth.verifyCookie,
  AdminController.getAllPendingIssues
);
router.get(
  "/resolvedIssues",
  adminAuth.verifyCookie,
  AdminController.getAllResolved
);
router.get(
  "/acknowledgedIssues",
  adminAuth.verifyCookie,
  AdminController.getAllAcknowledged
);
router.get(
  "/rejectedIssues",
  adminAuth.verifyCookie,
  AdminController.getAllRejected
);

router.get(
  "/statistics",
  adminAuth.verifyCookie,
  AdminController.getIssueStatistics
);
router.get(
  "/map-issues",
  adminAuth.verifyCookie,
  AdminController.getAllIssuesForMap
);

router.post(
  "/reports/generate",
  adminAuth.verifyCookie,
  ReportsController.generateReport
);
router.get(
  "/reports/filter-options",
  adminAuth.verifyCookie,
  ReportsController.getFilterOptions
);
router.post(
  "/reports/export-csv",
  adminAuth.verifyCookie,
  ReportsController.exportReportCSV
);

router.get("/profile", adminAuth.verifyCookie, AdminController.getAdminProfile);

export default router;