import Issue from "../models/issueModel.js";
import User from "../models/userModel.js";
import Admin from "../models/adminModel.js";

class ReportsController {
  generateReport = async (req, res) => {
    try {
      console.log("req.user:", req.user);
      const admin = await Admin.findOne({ firebaseUID: req.user.firebaseUID });
      if (!admin) return res.status(403).json({ error: "Unauthorized" });

      const {
        startDate,
        endDate,
        reportType = "comprehensive",
        category,
        status,
        district,
      } = req.body;

      // Build filter criteria
      const filter = {};

      if (startDate && endDate) {
        filter.createdAt = {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        };
      }

      if (category) filter.category = category;
      if (status) filter.status = status;
      if (district) filter.district = district;


      const issues = await Issue.find(filter).sort({ createdAt: -1 });

      const stats = {
        total: issues.length,
        pending: issues.filter((i) => i.status === "pending").length,
        resolved: issues.filter((i) => i.status === "resolved").length,
        acknowledged: issues.filter((i) => i.status === "acknowledged").length,
        rejected: issues.filter((i) => i.status === "rejected").length,
        resolutionRate: 0,
      };

      if (stats.total > 0) {
        stats.resolutionRate = Math.round((stats.resolved / stats.total) * 100);
      }

      const categoryBreakdown = {};
      issues.forEach((issue) => {
        categoryBreakdown[issue.category] =
          (categoryBreakdown[issue.category] || 0) + 1;
      });

      const districtBreakdown = {};
      issues.forEach((issue) => {
        districtBreakdown[issue.district] =
          (districtBreakdown[issue.district] || 0) + 1;
      });

      const importanceBreakdown = {};
      issues.forEach((issue) => {
        if (issue.importance) {
          importanceBreakdown[issue.importance] =
            (importanceBreakdown[issue.importance] || 0) + 1;
        }
      });

      const monthlyTrend = {};
      issues.forEach((issue) => {
        const month = new Date(issue.createdAt).toISOString().slice(0, 7); // YYYY-MM
        if (!monthlyTrend[month]) {
          monthlyTrend[month] = { total: 0, resolved: 0 };
        }
        monthlyTrend[month].total++;
        if (issue.status === "resolved") {
          monthlyTrend[month].resolved++;
        }
      });

      const responseTimeAnalysis = [];
      issues
        .filter(
          (issue) =>
            issue.status === "resolved" && issue.adminResponse?.respondedAt
        )
        .forEach((issue) => {
          const created = new Date(issue.createdAt);
          const responded = new Date(issue.adminResponse.respondedAt);
          const responseTimeHours = (responded - created) / (1000 * 60 * 60);
          responseTimeAnalysis.push({
            issueId: issue._id,
            title: issue.title,
            responseTimeHours: Math.round(responseTimeHours * 100) / 100,
            category: issue.category,
            district: issue.district,
          });
        });


      const userContributions = {};
      issues.forEach((issue) => {
        userContributions[issue.userId] =
          (userContributions[issue.userId] || 0) + 1;
      });

      const topContributors = Object.entries(userContributions)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([userId, count]) => ({ userId, issueCount: count }));

      const contributorsWithNames = await Promise.all(
        topContributors.map(async (contributor) => {
          try {
            const user = await User.findById(contributor.userId).select(
              "fullName email"
            );
            return {
              ...contributor,
              fullName: user?.fullName || "Unknown",
              email: user?.email || "Unknown",
            };
          } catch (error) {
            return {
              ...contributor,
              fullName: "Unknown",
              email: "Unknown",
            };
          }
        })
      );

      const report = {
        reportInfo: {
          generatedAt: new Date(),
          generatedBy: admin.email || admin.name || "Admin",
          period:
            startDate && endDate ? `${startDate} to ${endDate}` : "All time",
          reportType,
          totalRecords: issues.length,
        },
        statistics: stats,
        breakdowns: {
          category: categoryBreakdown,
          district: districtBreakdown,
          importance: importanceBreakdown,
        },
        trends: {
          monthly: monthlyTrend,
        },
        analysis: {
          responseTime: responseTimeAnalysis,
          averageResponseTime:
            responseTimeAnalysis.length > 0
              ? Math.round(
                  (responseTimeAnalysis.reduce(
                    (sum, item) => sum + item.responseTimeHours,
                    0
                  ) /
                    responseTimeAnalysis.length) *
                    100
                ) / 100
              : 0,
        },
        contributors: contributorsWithNames,
        issues: issues.map((issue) => ({
          id: issue._id,
          title: issue.title,
          category: issue.category,
          district: issue.district,
          status: issue.status,
          importance: issue.importance,
          createdAt: issue.createdAt,
          resolvedAt: issue.adminResponse?.respondedAt || null,
          responseTimeHours:
            issue.status === "resolved" && issue.adminResponse?.respondedAt
              ? Math.round(
                  ((new Date(issue.adminResponse.respondedAt) -
                    new Date(issue.createdAt)) /
                    (1000 * 60 * 60)) *
                    100
                ) / 100
              : null,
        })),
      };

      res.json(report);
    } catch (error) {
      console.error("Error generating report:", error);
      res.status(500).json({ error: error.message });
    }
  };

  getFilterOptions = async (req, res) => {
    try {
      console.log("req.user:", req.user);
      const admin = await Admin.findOne({ firebaseUID: req.user.firebaseUID });
      if (!admin) return res.status(403).json({ error: "Unauthorized" });

      const categories = await Issue.distinct("category");
      const districts = await Issue.distinct("district");
      const statuses = await Issue.distinct("status");
      const importanceLevels = await Issue.distinct("importance");

      const dateRange = await Issue.aggregate([
        {
          $group: {
            _id: null,
            earliest: { $min: "$createdAt" },
            latest: { $max: "$createdAt" },
          },
        },
      ]);

      res.json({
        categories: categories.filter(Boolean),
        districts: districts.filter(Boolean),
        statuses: statuses.filter(Boolean),
        importanceLevels: importanceLevels.filter(Boolean),
        dateRange:
          dateRange.length > 0
            ? {
                earliest: dateRange[0].earliest,
                latest: dateRange[0].latest,
              }
            : null,
      });
    } catch (error) {
      console.error("Error getting filter options:", error);
      res.status(500).json({ error: error.message });
    }
  };

  exportReportCSV = async (req, res) => {
    try {
      console.log("req.user:", req.user);
      const admin = await Admin.findOne({ firebaseUID: req.user.firebaseUID });
      if (!admin) return res.status(403).json({ error: "Unauthorized" });

      const { startDate, endDate, reportType = "comprehensive" } = req.body;

      const filter = {};
      if (startDate && endDate) {
        filter.createdAt = {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        };
      }

      const issues = await Issue.find(filter).sort({ createdAt: -1 });

      const csvHeader =
        "ID,Title,Description,Category,District,Status,Importance,Cost Estimate,Created At,Resolved At,Response Time (Hours),User ID\n";

      const csvRows = issues
        .map((issue) => {
          const responseTimeHours =
            issue.status === "resolved" && issue.adminResponse?.respondedAt
              ? (
                  (new Date(issue.adminResponse.respondedAt) -
                    new Date(issue.createdAt)) /
                  (1000 * 60 * 60)
                ).toFixed(2)
              : "";

          return [
            issue._id,
            `"${issue.title}"`,
            `"${issue.description}"`,
            issue.category,
            issue.district,
            issue.status,
            issue.importance || "",
            issue.cost_estimate || "",
            issue.createdAt.toISOString(),
            issue.adminResponse?.respondedAt
              ? issue.adminResponse.respondedAt.toISOString()
              : "",
            responseTimeHours,
            issue.userId,
          ].join(",");
        })
        .join("\n");

      const csvContent = csvHeader + csvRows;

      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="issues-report-${
          new Date().toISOString().split("T")[0]
        }.csv"`
      );
      res.send(csvContent);
    } catch (error) {
      console.error("Error exporting report:", error);
      res.status(500).json({ error: error.message });
    }
  };
}

export default new ReportsController();