import Issue from "../models/issueModel.js";
import { uploadBufferToCloudinary } from "../utils/cloudinary.js";
import User from "../models/userModel.js";

export const createIssue = async (req, res) => {
  const firebaseUID = req.user?.uid;
  if (!firebaseUID) {
    return res
      .status(401)
      .json({ message: "Unauthorized. No Firebase user identified." });
  }

  try {
    const {
      title,
      description,
      category,
      location,
      district,
      importance,
      cost_estimate,
      is_public_property,
    } = req.body;

    let imageUrl = null;
    if (req.file) {
      const result = await uploadBufferToCloudinary(
        req.file.buffer,
        req.file.originalname,
        "issues"
      );
      imageUrl = result.secure_url;
    }

    const newIssue = new Issue({
      title,
      description,
      category,
      location: JSON.parse(location), // expect { lat, lng }
      district: district || "Unknown",
      importance: importance || "Medium",
      cost_estimate: cost_estimate || "0",
      is_public_property: is_public_property === "yes" ? true : false,
      imageUrl,
      userId: firebaseUID,
    });

    await newIssue.save();

    await User.findOneAndUpdate(
      { firebaseUID },
      { $inc: { numIssueRaised: 1 } }
    );
    res.status(201).json(newIssue);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getIssuesByUserId = async (req, res) => {
  const firebaseUID = req.user?.uid;
  if (!firebaseUID) return res.status(401).json({ message: "Unauthorized" });

  try {
    const issues = await Issue.find({ userId: firebaseUID }).sort({
      createdAt: -1,
    });

    const issuesWithUserInfo = await Promise.all(
      issues.map(async (issue) => {
        try {
          const user = await User.findOne({ firebaseUID: issue.userId }).select(
            "fullName email phone createdAt"
          );
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

    res.status(200).json(issuesWithUserInfo);
  } catch (error) {
    console.error("Error fetching user issues:", error);
    res.status(500).json({ error: error.message });
  }
};

export const deleteIssue = async (req, res) => {
  const firebaseUID = req.user?.uid;
  if (!firebaseUID) return res.status(401).json({ message: "Unauthorized" });

  try {
    const issue = await Issue.findById(req.params.id);
    if (!issue) return res.status(404).json({ message: "Issue not found" });
    if (issue.userId !== firebaseUID) {
      return res
        .status(403)
        .json({ message: "Forbidden. You cannot delete this issue." });
    }
    await Issue.findByIdAndDelete(req.params.id);
    await User.findOneAndUpdate(
      { firebaseUID },
      { $inc: { numIssueRaised: -1 } }
    );
    res.status(200).json({ message: "Issue deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getUserProfile = async (req, res) => {
  const firebaseUID = req.user?.uid;
  if (!firebaseUID) return res.status(401).json({ message: "Unauthorized" });

  try {
    const user = await User.findOne({ firebaseUID }).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json({
      id: user._id,
      firebaseUID: user.firebaseUID,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
      numIssueRaised: user.numIssueRaised || 0,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ error: error.message });
  }
};