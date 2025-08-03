import { Schema, model } from "mongoose";

const AdminSchema = new Schema({
  name: String,
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

export const Admin =  model.Admin || model("Admin", AdminSchema) ;
