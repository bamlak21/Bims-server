import mongoose, { mongo, Schema } from "mongoose";

const UserSchema = new Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    userType: {
      type: String,
      required: true,
      enum: ["client", "broker", "admin"],
      default: "client",
    },
    phoneNumber: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    photo: { type: String, default: "" },
    socialLinks: {
    type: Map,
    of: String,
    default: {},
  },
  address: {
    city: String,
    subcity: String,
    woreda: String,
    detailedAddress: String,
  },
    documentVerification: {
      status: {
        type: String,
        default: "",
      },
      uploadedAt: {
        type: Date,
        default: null,
      },
      reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Admin", // if you have an admin model
        default: null,
      },
    },
    document: {
      type: String,
      default: "",
    },
    is_blocked: { type: Boolean, default: false },
    verified: { type: Boolean, default: true },
    isActive: {
      type: Boolean,
      default: true,
    },
    otp: String,
    otpExpiry: Date,
  },
  

  { timestamps: true }
);

export const User = mongoose.model("User", UserSchema) || mongoose.model.User;
