import mongoose, { Schema } from "mongoose";

const AdminSchema = new Schema({
  name: String,
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  otp: { type: String },
  otpExpiry: { type: Date },
});

export const Admin = mongoose.model("Admin", AdminSchema);
