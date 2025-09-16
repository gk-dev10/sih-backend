import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    firebaseUID: {
      type: String,
      unique: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: true,
    },
    loginMethod: {
      type: String,
      enum: ["google", "email"],
      default: "email",
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    addresses: {
      type: [String],
      default: [],
    },
    numIssueRaised: {
      type: Number,
      default: 0,
    },
    isVolunteer : {
      type : Boolean,
      default : false
    },
    isRequested : {
      type : Boolean,
      default : false
    },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
export default User;


//ai integration
//user - request api

//admin - approve api, get all requests api
//export csv, under reports
 