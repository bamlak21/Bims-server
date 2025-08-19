import { model, Schema } from "mongoose";
const CommissionSchema = new Schema({
  broker_id: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  owner_id: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  buyer_id: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  listing_id: {
    type: Schema.Types.ObjectId,
    refPath: "listing_type",
    required: true,
  },
  listing_type: {
    type: String,
    enum: ["Vehicle", "Property"],
    required: true,
  },
  sale_price: {
    type: Number,
    required: true,
  },
  total_commission: {
    type: Number,
    required: true,
  },
  owner_share: {
    type: Number,
    required: true,
  },
  buyer_share: {
    type: Number,
    required: true,
  },
});

export const Commission = model("Commission", CommissionSchema);
