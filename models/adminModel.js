import mongoose from "mongoose";

const adminSchema = new mongoose.Schema(
  {
    firebaseUID: {
      type: String,
      unique: true,
      required: true,
    },
    email: {
      type: String,
      unique: true,
      required: true,
    },
    fullName: { type: String, required: true },
    city: { type: String, required: true },
    role: { type: String, default: "admin" },
    isAdmin: { type: Boolean, default: true }, 
  },
  { timestamps: true }
);

const Admin = mongoose.model("Admin", adminSchema);
export default Admin;