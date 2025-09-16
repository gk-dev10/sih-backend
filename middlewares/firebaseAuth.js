import admin from "../firebase/firebaseConfig.js";
import User from "../models/userModel.js";

class FirebaseAuthMiddleware {
  verifySessionCookie = async (req, res, next) => {
    const sessionCookie = req.cookies?.session || "";
    try {
      const decodedClaims = await admin
        .auth()
        .verifySessionCookie(sessionCookie, true);
      req.user = decodedClaims;

      const dbUser = await User.findOne({ firebaseUID: decodedClaims.uid });

      if (!dbUser) {
        res.status(404).json({ error: "User not found in database" });
        return;
      }
      
      next();
    } catch (error) {
      console.error("Invalid session cookie", error);
      res.status(401).json({ error: "Unauthorized" });
    }
  };
}

export default new FirebaseAuthMiddleware();