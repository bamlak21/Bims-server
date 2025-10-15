import mongoose from "mongoose";
import ChatRoom from "../models/chat.model.js";
import Message from "../models/message.model.js";

export const GetChatRooms = async (req, res) => {
  const { userId } = req.params;

  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ message: "Id missing" });
  }

  try {
    const chatRooms = await ChatRoom.find({ participants: userId });

    const roomsWithLastMessage = await Promise.all(
      chatRooms.map(async (room) => {
        const lastMessage = await Message.findOne({ roomId: room._id }).sort({
          createdAt: -1,
        });

        return {
          name: room.name,
          roomId: room._id,
          participants: room.participants,
          lastMessage: lastMessage || null,
        };
      })
    );

    return res.status(200).json(roomsWithLastMessage);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server Error" });
  }
};

export const GetMessagesForChat = async (req, res) => {
  const { roomId } = req.params;
  console.log(roomId);

  if (!roomId) {
    return res.status(400).json({ message: "Missing required fields" });
  }
  try {
    const messages = await Message.find({ roomId: roomId });
    return res.status(200).json({ message: "Success", messages });
  } catch (error) {
    console.error("Failed to fetch messages for chat room: ", error);
    return res.status(500).json({ message: "Server Error" });
  }
};
