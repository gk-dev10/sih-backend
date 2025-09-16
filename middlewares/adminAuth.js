import admin from "../firebase/firebaseConfig.js";
import Admin from "../models/adminModel.js";

const auth = admin.auth();
  
class AdminAuthMiddleware {
  verifyCookie = async (req, res, next) => {
    try {
      const sessionCookie = req.cookies?.session;
      if (!sessionCookie) return res.status(401).json({ error: "Unauthorized" });

      const decodedClaims = await auth.verifySessionCookie(sessionCookie, true);
      if (!decodedClaims || !decodedClaims.uid) {
        return res.status(401).json({ error: "Invalid session" });
      }

      const adminUser = await Admin.findOne({ firebaseUID: decodedClaims.uid });
      if (!adminUser) return res.status(403).json({ error: "Forbidden" });

      req.user = adminUser;
      next();
    } catch (err) {
      console.error("Cookie verification failed:", err);
      res.status(401).json({ error: "Unauthorized" });
    }
  };
}

export default new AdminAuthMiddleware();