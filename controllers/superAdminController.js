import Admin from "../models/adminModel.js";
import admin from "../firebase/firebaseConfig.js";

export const getAdmins = async (req, res) => {
  try {
    const admins = await Admin.find().sort({ createdAt: -1 });
    res.status(200).json(admins);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const createAdmin = async (req, res) => {
  const { email, fullName, city, password } = req.body;

  if (!email || !fullName || !city || !password)
    return res.status(400).json({ error: "All fields are required" });

  try {

    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: fullName,
    });

    const newAdmin = await Admin.create({
      firebaseUID: userRecord.uid,
      email,
      fullName,
      city,
    });

    res.status(201).json({ admin: newAdmin });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


export const deleteAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Admin.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ error: "Admin not found" });
    res.status(200).json({ message: "Admin deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};