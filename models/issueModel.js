import mongoose from "mongoose";

const issueSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, required: true },

    location: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },

    district: { type: String, required: true, trim: true },

    imageUrl: { type: String },

    importance: { type: String },
    cost_estimate: { type: String, default: "0" },
    is_public_property: { type: Boolean, default: true },

    status: {
      type: String,
      enum: ["pending", "acknowledged", "rejected", "resolved"],
      default: "pending",
    },

    severity: { type: String }, 

    userId: { type: String, required: true },

    adminResponse: {
      message: { type: String },
      respondedAt: { type: Date },
    },
  },
  { timestamps: true }
);

const Issue = mongoose.model("Issue", issueSchema);
export default Issue;