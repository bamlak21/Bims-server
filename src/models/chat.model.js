import { Schema, model } from "mongoose";

const ChatRoomSchema = new Schema(
  {
    name: { type: String },
    participants: [{ type: Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

const ChatRoom = model("ChatRoom", ChatRoomSchema);

export default ChatRoom;
