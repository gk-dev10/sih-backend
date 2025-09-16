import admin from "../firebase/firebaseConfig.js";
import Admin from "../models/adminModel.js";

const auth = admin.auth();

class AdminAuthController {
  login = async (req, res) => {
    const { idToken } = req.body;
    if (!idToken) return res.status(400).json({ error: "JWT required" });
    try {
      const decoded = await auth.verifyIdToken(idToken, true);

      const adminUser = await Admin.findOne({ firebaseUID: decoded.uid });
      if (!adminUser) return res.status(403).json({ error: "Access denied. Not an admin." });
      
      const expiresIn = 5 * 24 * 60 * 60 * 1000;
      const sessionCookie = await auth.createSessionCookie(idToken, { expiresIn });
      res.cookie("session", sessionCookie, {
        httpOnly: true,
        secure: true,  
        maxAge: expiresIn,
      });

      return res.status(200).json({
        message: "Admin login successful",
        admin: {
          fullName: adminUser.fullName,
          email: adminUser.email,
          city: adminUser.city,
        },
      });
    } catch (error) {
      console.error("Admin login failed:", error);
      return res.status(401).json({ error: "Invalid token" });
    }
  };

  logout = (req, res) => {
    res.clearCookie("session");
    res.status(200).json({ message: "Logged out successfully" });
  };
}

export default new AdminAuthController();