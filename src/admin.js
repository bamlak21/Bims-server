import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import { Admin } from "./models/admin.model.js"; 

dotenv.config({path:'../.env'});

const createAdmin = async () => {
  await mongoose.connect(process.env.MONGO_URL);
  const existing = await Admin.findOne({ email: "admin@gmail.com" });

  if (existing) {
    console.log("Admin already exists.");
    return process.exit();
  }

  const hashedPassword = await bcrypt.hash("admin123", 10);
  const newAdmin = new Admin({
    name: "Super Admin",
    email: "admin@gmail.com",
    password: hashedPassword,
  });

  await newAdmin.save();
  console.log("Admin created successfully!");
  process.exit();
};

createAdmin().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
