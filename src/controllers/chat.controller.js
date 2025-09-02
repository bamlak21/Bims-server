import mongoose from "mongoose";
import ChatRoom from "../models/chat.model.js";

export const GetChatRooms = async (req, res) => {
  const { userId } = req.query;

  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ message: "Id missing" });
  }

  try {
    const chat = await ChatRoom.find({ participants: userId });

    const roomsWithLastMessage = await Promise.all(
      chat.map(async (room) => {
        const lastMessage = await Message.find({ roomId: room._id })
          .sort({ createdAt: -1 })
          .limit(1);

        return {
          roomId: room._id,
          participants: room.participants,
          lastMessage: lastMessage[0] || null,
        };
      })
    );

    return res.status(200).json(roomsWithLastMessage);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server Error" });
  }
};
