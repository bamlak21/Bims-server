import { Schema, model } from "mongoose";

const MessageSchema = new Schema(
  {
    roomId: { type: Schema.Types.ObjectId, ref: "ChatRoom", required: true },
    senderId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    message: { type: String, required: true },
  },
  { timestamps: true }
);

const Message = model("Message", MessageSchema);

export default Message;
