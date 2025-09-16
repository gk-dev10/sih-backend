import Issue from "../models/issueModel.js";
import Admin from "../models/adminModel.js";
import User from "../models/userModel.js";
class AdminController {
  getCityIssues = async (req, res) => {
    try {
      const admin = await Admin.findOne({ firebaseUID: req.user.firebaseUID });
      if (!admin) return res.status(403).json({ error: "Unauthorized" });

       const issues = await Issue.find({ district: admin.city }).sort({ createdAt: -1 });
      const issuesWithUserInfo = await Promise.all(
        issues.map(async (issue) => {
          try {
            const user = await User.findOne({
              firebaseUID: issue.userId,
            }).select("fullName email phone createdAt");
            return {
              ...issue.toObject(),
              userInfo: user
                ? {
                    fullName: user.fullName,
                    email: user.email,
                    phone: user.phone,
                    joinedDate: user.createdAt,
                  }
                : null,
            };
          } catch (error) {
            console.error("Error fetching user for issue:", error);
            return {
              ...issue.toObject(),
              userInfo: null,
            };
          }
        })
      );

      res.json(issuesWithUserInfo);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

  updateIssueStatus = async (req, res) => {
    try {
      const { id } = req.params;
      const { status, message } = req.body;

      if (!["acknowledged", "resolved", "rejected"].includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }

      const updated = await Issue.findByIdAndUpdate(
        id,
        {
          status,
          adminResponse: {
            message,
            respondedAt: new Date(),
          },
        },
        { new: true }
      );

      if (!updated) return res.status(404).json({ error: "Issue not found" });

      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

  getAllUsers = async (req, res) => {
    try {
      const users = await User.find().select("-password");
      res.status(200).json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Server error" });
    }
  };

  getIssuesByStatus = async (req, res, status) => {
  try {
    const admin = await Admin.findOne({ firebaseUID: req.user.firebaseUID });
    if (!admin) return res.status(403).json({ error: "Unauthorized" });

    const issues = await Issue.find({ status, district: admin.city }).sort({ createdAt: -1 });

    const issuesWithUserInfo = await Promise.all(
      issues.map(async (issue) => {
        try {
          const user = await User.findOne({ firebaseUID: issue.userId })
            .select("fullName email phone createdAt");

          return {
            ...issue.toObject(),
            userInfo: user
              ? {
                  fullName: user.fullName,
                  email: user.email,
                  phone: user.phone,
                  joinedDate: user.createdAt,
                }
              : null,
          };
        } catch (error) {
          console.error("Error fetching user for issue:", error);
          return { ...issue.toObject(), userInfo: null };
        }
      })
    );

    res.json(issuesWithUserInfo);
  } catch (error) {
    console.error("Error fetching issues by status:", error);
    res.status(500).json({ error: error.message });
  }
};
getAllPendingIssues = (req, res) => this.getIssuesByStatus(req, res, "pending");
getAllAcknowledged = (req, res) => this.getIssuesByStatus(req, res, "acknowledged");
getAllResolved = (req, res) => this.getIssuesByStatus(req, res, "resolved");
getAllRejected = (req, res) => this.getIssuesByStatus(req, res, "rejected");


  getIssueStatistics = async (req, res) => {
    try {
      console.log("req.user:", req.user);
      const admin = await Admin.findOne({ firebaseUID: req.user.firebaseUID });
      if (!admin) return res.status(403).json({ error: "Unauthorized" });

      const issues = await Issue.find().find({district: admin.city}).sort({ createdAt: 1 });

      const monthlyStats = {};
      const currentYear = new Date().getFullYear();

      for (let month = 0; month < 12; month++) {
        const monthKey = `${currentYear}-${String(month + 1).padStart(2, "0")}`;
        monthlyStats[monthKey] = {
          month: month + 1,
          year: currentYear,
          pending: 0,
          resolved: 0,
          total: 0,
          acknowledged: 0,
          rejected: 0,
        };
      }

      issues.forEach((issue) => {
        const issueDate = new Date(issue.createdAt);
        const monthKey = `${issueDate.getFullYear()}-${String(
          issueDate.getMonth() + 1
        ).padStart(2, "0")}`;

        if (monthlyStats[monthKey]) {
          monthlyStats[monthKey].total++;
          monthlyStats[monthKey][issue.status]++;
        }
      });

      const chartData = Object.values(monthlyStats).map((monthData) => ({
        month: monthData.month,
        year: monthData.year,
        pending: monthData.pending,
        resolved: monthData.resolved,
        total: monthData.total,
        acknowledged: monthData.acknowledged,
        rejected: monthData.rejected,
        resolvedPercentage:
          monthData.total > 0
            ? Math.round((monthData.resolved / monthData.total) * 100)
            : 0,
      }));

      const totalIssues = await Issue.countDocuments();
      const pendingIssues = await Issue.countDocuments({ status: "pending" });
      const resolvedIssues = await Issue.countDocuments({ status: "resolved" });
      const acknowledgedIssues = await Issue.countDocuments({
        status: "acknowledged",
      });
      const rejectedIssues = await Issue.countDocuments({ status: "rejected" });

      res.json({
        monthlyData: chartData,
        overallStats: {
          total: totalIssues,
          pending: pendingIssues,
          resolved: resolvedIssues,
          acknowledged: acknowledgedIssues,
          rejected: rejectedIssues,
          resolutionRate:
            totalIssues > 0
              ? Math.round((resolvedIssues / totalIssues) * 100)
              : 0,
        },
      });
    } catch (error) {
      console.error("Error fetching statistics:", error);
      res.status(500).json({ error: error.message });
    }
  };

  getAllIssuesForMap = async (req, res) => {
    try {
      console.log("req.user:", req.user);
      const admin = await Admin.findOne({ firebaseUID: req.user.firebaseUID });
      if (!admin) return res.status(403).json({ error: "Unauthorized" });

      const issues = await Issue.find({
        district: admin.city,
        location: { $exists: true, $ne: null },
        "location.lat": { $exists: true },
        "location.lng": { $exists: true },
      }).sort({ createdAt: -1 });

      const issuesWithUserInfo = await Promise.all(
        issues.map(async (issue) => {
          try {
            const user = await User.findOne({
              firebaseUID: issue.userId,
            }).select("fullName email phone createdAt");
            return {
              ...issue.toObject(),
              userInfo: user
                ? {
                    fullName: user.fullName,
                    email: user.email,
                    phone: user.phone,
                    joinedDate: user.createdAt,
                  }
                : null,
            };
          } catch (error) {
            console.error("Error fetching user for issue:", error);
            return {
              ...issue.toObject(),
              userInfo: null,
            };
          }
        })
      );

      res.json(issuesWithUserInfo);
    } catch (error) {
      console.error("Error fetching issues for map:", error);
      res.status(500).json({ error: error.message });
    }
  };

  getAdminProfile = async (req, res) => {
    try {
      console.log("req.user:", req.user);
      const admin = await Admin.findOne({ firebaseUID: req.user.firebaseUID });
      if (!admin) return res.status(403).json({ error: "Unauthorized" });

      res.json({
        id: admin._id,
        firebaseUID: admin.firebaseUID,
        email: admin.email,
        fullName: admin.fullName,
        city: admin.city,
        role: admin.role,
        isAdmin: admin.isAdmin,
        createdAt: admin.createdAt,
        updatedAt: admin.updatedAt,
      });
    } catch (error) {
      console.error("Error fetching admin profile:", error);
      res.status(500).json({ error: error.message });
    }
  };
}

export default new AdminController();