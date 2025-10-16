import mongoose from "mongoose";
import ChatRoom from "../models/chat.model.js";
import Message from "../models/message.model.js";
import { Property } from "../models/property.model.js";
import { Vehicle } from "../models/vehicle.model.js";


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
  
const isValidObjectId = mongoose.Types.ObjectId.isValid(roomId);
if (!isValidObjectId) {
  return res.status(400).json({ message: 'Invalid roomId' });
}
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


export const CreateChatRoomAndSendMessage = async (req, res) => {
  const { listingId, senderId, text, type } = req.body;

  if (
    !mongoose.Types.ObjectId.isValid(listingId) ||
    !mongoose.Types.ObjectId.isValid(senderId) ||
    !type
  ) {
    return res.status(400).json({ message: "Invalid input" });
  }

  try {
    let listing;
    if (type === "Property") {
      listing = await Property.findById(listingId)
        .populate("owner_id")
        .populate("broker_id");
    } else if (type === "Vehicle") {
      listing = await Vehicle.findById(listingId)
        .populate("owner_id")
        .populate("broker_id");
    } else {
      return res.status(400).json({ message: "Invalid listing type" });
    }

    if (!listing) {
      return res.status(404).json({ message: "Listing not found" });
    }

    const participants = [
      listing.broker_id?._id,
      listing.owner_id?._id,
      new mongoose.Types.ObjectId(senderId),
    ].filter(Boolean);

    // Find if room already exists with same listing and exact participants
    let chatRoom = await ChatRoom.findOne({
      listingId,
      participants: { $all: participants, $size: participants.length },
    });

    if (!chatRoom) {
      chatRoom = new ChatRoom({
        name: `Chat about ${listing.title || "listing"}`,
        participants,
        listingId,
      });
      await chatRoom.save();
    }

    const message = new Message({
      senderId: senderId,
      roomId: chatRoom._id,
      message: text || `Hello, I'm interested in your listing.`,
    });
    console.log("Sender ID:", senderId);

    await message.save();

    return res.status(201).json({ message: "Chat room created and message sent", chatRoom, message });
  } catch (error) {
    console.error("Chat error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
