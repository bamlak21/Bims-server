import mongoose from "mongoose";

const PropertySchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
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
      swimmingPool: Boolean,
    },
    image_paths: [{ type: String }],
    owner_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "draft", "approved", "rejected", "closed"],
      required: true,
    },
    rejection_reason: { type: String, default: "" },
  },
  { timestamps: true }
);

export const Property = mongoose.model("Listing", PropertySchema);
