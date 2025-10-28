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
  client_id: {
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
  client_share: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: [
      "pending",        // agreement created
      "awaiting_payment", // property deal confirmed, commission unpaid
      "paid",           // commission settled
      "disputed",       // broker claims unpaid commission
      "resolved"        // admin resolved dispute
    ],
    default: "pending",
  },
   invoice_url: String, // auto-generated commission invoice PDF
  due_date: Date, // when commission must be paid
  audit_log: [
    {
      actor: String, // "broker", "owner", "client"
      action: String,
      ref:String, //txRef from Chapa
      timestamp: { type: Date, default: Date.now },
    },
  ],
  
});

export const Commission = model("Commission", CommissionSchema);
