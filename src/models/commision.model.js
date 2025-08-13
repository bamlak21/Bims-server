import { type } from "express/lib/response";
import { Schema } from "mongoose";

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
  },
  listing_id: {
    type: Schema.Types.ObjectId,
    refPath: "listing_type",
  },
  listing_type: {
    type: String,
    enum: ["Vehicle", "Property"],
  },
});
