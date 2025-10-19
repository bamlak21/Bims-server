import { Schema, model } from "mongoose";

const ChatRoomSchema = new Schema(
  {
    name: { type: String },
    participants: [{ type: Schema.Types.ObjectId, ref: "User" }],
    listingId: { type: Schema.Types.ObjectId, required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);
ChatRoomSchema.index({ listingId: 1, createdBy: 1 }, { unique: true });

const ChatRoom = model("ChatRoom", ChatRoomSchema);

export default ChatRoom;
