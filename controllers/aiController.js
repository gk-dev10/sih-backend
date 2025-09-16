import { isLikelyNSFWSimple } from "../utils/nsfw.js";
import { analyzeImageWithGemini } from "../utils/imageAnalyse.js";

export const createIssue = async (req, res) => {
  try {
    const { title, description, location } = req.body;
    const imagePath = req.file.path;

    const nsfw = await isLikelyNSFWSimple(imagePath);
    if (nsfw) {
      return res.json({
        error: "Potential NSFW content detected",
        analysis_blocked: true,
      });
    }

    const analysis = await analyzeImageWithGemini(imagePath);

    res.json({
      message: "Issue created successfully!",
      title,
      description,
      location: JSON.parse(location),
      analysis,
    });
  } catch (err) {
    console.error("Error in createIssue:", err);
    res.status(500).json({ error: err.message });
  }
};

export const analyzeImageOnly = async (req, res) => {
  try {
    const imagePath = req.file.path;

    const nsfw = await isLikelyNSFWSimple(imagePath);
    if (nsfw) {
      return res.json({
        error: "Potential NSFW content detected",
        analysis_blocked: true,
      });
    }

    const analysis = await analyzeImageWithGemini(imagePath);
    res.json(analysis);
  } catch (err) {
    console.error("Error in analyzeImageOnly:", err);
    res.status(500).json({ error: err.message });
  }
};
