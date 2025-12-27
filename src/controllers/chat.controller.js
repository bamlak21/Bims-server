import mongoose from "mongoose";
import ChatRoom from "../models/chat.model.js";
import Message from "../models/message.model.js";
import { Property } from "../models/property.model.js";
import { Vehicle } from "../models/vehicle.model.js";
import { onlineUsers } from "../Socket/socketManager.js";
import { Deal } from "../models/deals.model.js";
import { User } from "../models/user.model.js";
import { maskSensitiveData, shouldMaskContent } from "../utils/moderation.js";


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

        const unreadCount = await Message.countDocuments({
          roomId: room._id,
          status: { $ne: "read" },
          senderId: { $ne: userId },
        });

        return {
          name: room.name,
          roomId: room._id,
          participants: room.participants,
          lastMessage: lastMessage || null,
          unreadCount: unreadCount || 0,
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
    const messages = await Message.find({ roomId: roomId }).populate("senderId", "userType photo");
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

    const broker_id = listing?.broker_id?._id;
    const senderUser = await User.findById(senderId);

    if (!senderUser) {
      return res.status(404).json({ message: "Sender not found" });
    }

    // Deal check for clients
    const deal = await Deal.findOne({ listing_id: listingId, broker_id });

    if (senderUser.userType === "client") {
      const client_id = senderUser._id;

      if (deal?.client_id && deal.client_id.toString() !== client_id.toString()) {
        return res.status(403).json({
          message: "This deal is already assigned to another client. You cannot contact the broker.",
        });
      }

      // ✅ Check for existing chat room for same client + listing
      const existingRoom = await ChatRoom.findOne({
        listingId,
        createdBy: client_id,
      });

      if (existingRoom) {
        return res.status(403).json({
          message: "Chat room already exists",
          chatRoom: existingRoom,
        });
      }
    }

    // Create participants list
    const participants = [
      listing.broker_id?._id,
      listing.owner_id?._id,
      senderUser._id,
    ].filter(Boolean);

    // ✅ Create new chat room with title and tracking
    const chatRoom = new ChatRoom({
      name: `Chat about ${listing.title || "listing"}`,
      participants,
      listingId,
      createdBy: senderUser._id,
    });

    await chatRoom.save();

    // Message delivery status
    const receiverIds = participants.filter(
      (p) => p.toString() !== senderId.toString()
    );

    const anyReceiverOnline = receiverIds.some((receiverId) =>
      onlineUsers.has(receiverId.toString())
    );

    const messageStatus = anyReceiverOnline ? "delivered" : "sent";

    // Check for masking
    const shouldMask = await shouldMaskContent(listingId);
    let messageContent = text || `Hello, I'm interested in your listing.`;

    if (shouldMask) {
      messageContent = maskSensitiveData(messageContent);
    }

    const message = new Message({
      senderId,
      roomId: chatRoom._id,
      message: messageContent,
      status: messageStatus,
    });

    await message.save();

    return res.status(201).json({
      message: "Chat room created and message sent",
      chatRoom,
      message,
    });
  } catch (error) {
    // Duplicate chat room (e.g. created in parallel click)
    if (error.code === 11000) {
      const existingRoom = await ChatRoom.findOne({
        listingId,
        createdBy: senderId,
      });
      return res.status(200).json({
        message: "Chat room already exists",
        chatRoom: existingRoom,
      });
    }

    console.error("Chat error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
