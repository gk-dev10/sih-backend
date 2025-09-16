import admin from "../firebase/firebaseConfig.js";
import User from "../models/userModel.js";

const auth = admin.auth();

class FirebaseAuthController {
 login = async (req, res) => {
  const { fullName, idToken, phone, isAdmin = false } = req.body;

  if (!idToken) {
    return res.status(400).json({ error: "JWT required" });
  }

  try {
    const expiresIn = 60 * 60 * 24 * 1000; // 1 day
    const decoded = await auth.verifyIdToken(idToken, true);
    const sessionCookie = await auth.createSessionCookie(idToken, { expiresIn });

    const provider = decoded.firebase?.sign_in_provider;

    let user = await User.findOne({ firebaseUID: decoded.uid });

    if (!user) {
      const Name = decoded.name || fullName || decoded.email.split("@")[0];
      const formattedPhone = phone
        ? phone.startsWith("+")
          ? phone
          : `+91${phone}`
        : "+910000000000";

      user = await User.create({
        firebaseUID: decoded.uid,
        email: decoded.email,
        fullName: Name,
        loginMethod: provider === "google.com" ? "google" : "email",
        phone: formattedPhone,
        isAdmin,
        addresses: [],
      });
    }

    res.cookie("session", sessionCookie, {
      maxAge: expiresIn,
      httpOnly: true,
      secure: true,
      sameSite: "strict",
    });
    res.cookie("session_exists", true, { secure: true });

    return res.status(200).json({ message: "User login/register successful", user });
  } catch (error) {
    console.error("User login failed:", error);
    return res.status(401).json({ error: "Failed to login/register user" });
  }
};


  logout = async (req, res) => {
    try {
      res.clearCookie("session", {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
      });
      res.clearCookie("session_exists", { secure: true, sameSite: "strict" });

      return res.status(200).json({ message: "Logged out successfully" });
    } catch (error) {
      console.error("Logout failed:", error);
      return res.status(500).json({ error: "Logout failed" });
    }
  };
  checkSession=()=>{
    
  }
}

export default new FirebaseAuthController();