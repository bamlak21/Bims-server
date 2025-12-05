import mongoose, { Schema } from "mongoose";

const PropertySchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    type: { type: String, required: true, default: "Property" },
    category: { type: String, required: true },
    price: { type: Number, required: true },
    location: {
      city: { type: String },
      subcity: { type: String },
      woreda: { type: String },
      address: { type: String },
    },
    specifications: {
      bedrooms: { type: Number },
      bathrooms: { type: Number },
      area: { type: Number },
      yearBuilt: { type: Number },
      condition: {
        type: String,
        enum: ["excellent", "good", "fair", "needs_renovation"],
      },
    },
    image_paths: [{ type: String }],
    proofImage_paths: [{ type: String }],
    owner_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    broker_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    is_broker_assigned: {
      type: Boolean,
      default: false,
    },
    needBroker: {
  type: String,
  enum: ["Yes", "No"],
  required: true,
  default: "No",
},
    status: {
      type: String,
      enum: ["pending", "assigned","broker_approved","broker_rejected","approved", "rejected", "sold"],
      required: true,
    },
    rejection_reason: { type: String, default: "" },
    assignedVerifier: { type: Schema.Types.ObjectId, ref: "User", default: null },
    assignedAt: { type: Date },
    verifiedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    verifiedAt: { type: Date },
    verificationComment: { type: String, default: "" },
  },
  
  { timestamps: true }
);

export const Property = mongoose.model("Property", PropertySchema);
