import { model, Schema } from "mongoose";
const CommissionSchema = new Schema({
  broker_id: {
    type: Schema.Types.ObjectId,
    ref: "User",
    // required: true,
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
      "pending",
      "awaiting_payment",
      "paid",
      "failed",
    ],
    default: "pending",
  },
  invoice_url: String, // auto-generated commission invoice PDF
  tx_ref: { type: String, index: true },
  due_date: Date, // when commission must be paid
  // audit_log: [
  //   {
  //     actor: String, // "broker", "owner", "client"
  //     action: String,
  //     ref: String, //txRef from Chapa
  //     timestamp: { type: Date, default: Date.now },
  //   },
  // ],
  client_payment_status: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },
  owner_payment_status: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },
  owner_status: {
    type: String,
    enum: ["pending", "accepted", "rejected"],
    default: "pending",
  },
  client_status: {
    type: String,
    enum: ["pending", "accepted", "rejected"],
    default: "pending",
  },

  client_rejection_reason: String,
  owner_rejection_reason: String,
  payment_attempts: [{
    tx_ref: { type: String, index: true },
    partyType: { type: String, enum: ['client', 'owner'] },
    amount: Number,
    user_id: { type: Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },
    initiatedAt: Date
  }],
  client_paid_at: Date,
  owner_paid_at: Date,
  commission_type: {
    type: String,
    enum: ["broker_commission", "system_commission"],
    required: false,
  },
  app_fee: { type: Number, default: 0, },
  reminders: [
    {
      type: { type: String },
      sentAt: Date,
      sentBy: { type: Schema.Types.ObjectId, ref: "User" }
    }
  ]
}, { timestamps: true });

export const Commission = model("Commission", CommissionSchema);
