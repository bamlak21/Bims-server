import ChatRoom from "../models/chat.model.js";
import Message from "../models/message.model.js";
import { onlineUsers } from "./socketManager.js"; // ⬅️ import global store
import {User} from "../models/user.model.js"

export function RegisterSocket(io) {
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // Store userId from client
    let currentUserId = null;

    // Expect user to send their userId after connection
    socket.on("register", ({ userId }) => {
      if (userId) {
        currentUserId = userId;

      // Support multiple sockets per user
      if (!onlineUsers.has(userId)) {
        onlineUsers.set(userId, new Set());
      }
      onlineUsers.get(userId).add(socket.id);

      console.log(`✅ User ${userId} registered and is online`);
      
      // Notify ALL clients about online status
      io.emit("userOnlineStatus", { userId, status: "online" }); // notify others
      }
    });

    socket.on("joinRoom", async ({ roomId, userId, participants }) => {
      try {
        let room;

        if (roomId) {
          room = await ChatRoom.findById(roomId);
          if (!room) return socket.emit("error", { message: "Room not found" });
        } else {
          const sortedParticipants = participants.sort();
          room = await ChatRoom.findOne({
            participants: {
              $all: sortedParticipants,
              $size: sortedParticipants.length,
            },
          });

          if (!room) {
            room = await ChatRoom.create({ participants: sortedParticipants });
          }
        }

        socket.join(room._id.toString());

        console.log(`User ${userId} joined room: ${room._id}`);
        socket.emit("roomJoined", {
          roomId: room._id,
          participants: room.participants,
        });
      } catch (err) {
        console.error("joinRoom error:", err);
        socket.emit("error", { message: "Failed to join room" });
      }
    });


socket.on("chatMessage", async ({ roomId, userId, message }) => {
  try {
    if (!currentUserId || userId !== currentUserId) {
      return socket.emit("error", { message: "Please register first" });
    }

    if (!message || !message.trim()) {
      return socket.emit("error", { message: "Message cannot be empty" });
    }

    // Create message
    const msg = await Message.create({ 
      roomId, 
      senderId: userId, 
      message: message.trim() 
    });

    // ✅ FETCH SENDER PROFILE
    const senderProfile = await User.findById(userId).select('photo userType');
    
    // Get room for recipients
    const room = await ChatRoom.findById(roomId);
    if (!room) {
      return socket.emit("error", { message: "Room not found" });
    }

    // Determine status
    const recipients = room.participants.filter(id => id.toString() !== userId);
    let initialStatus = "sent";
    
    for (const recipientId of recipients) {
      const recipientOnline = onlineUsers.has(recipientId.toString());
      if (recipientOnline) {
        initialStatus = "delivered";
        break;
      }
    }

    msg.status = initialStatus;
    await msg.save();

    // ✅ SEND FULL SENDER PROFILE WITH MESSAGE
    const messageData = {
      _id: msg._id,
      roomId: roomId,
      senderId: msg.senderId,
      senderProfile: {  // ✅ FULL PROFILE
        _id: senderProfile._id,
        name: senderProfile.name || senderProfile.username || "Unknown",
        photo: senderProfile.photo || senderProfile.profilePhoto || null,
        userType: senderProfile.userType || "user",
      },
      message: msg.message,
      status: msg.status,
      createdAt: msg.createdAt,
    };

    console.log(`💬 Message sent: ${msg._id} | To room: ${roomId}`);

    // Emit to ALL in room
    io.to(roomId).emit("chatMessage", messageData);
    
    // Delivery confirmation to sender
    socket.emit("messageDelivered", { roomId, messageId: msg._id });

  } catch (err) {
    console.error("chatMessage error:", err);
    socket.emit("error", { message: "Failed to send message" });
  }
});

    socket.on("markAsRead", async ({ roomId, userId }) => {
      try {
        await Message.updateMany(
          { roomId, senderId: { $ne: userId }, status: { $ne: "read" } },
          { $set: { status: "read" } }
        );

        // Notify others in room and ensure the caller also receives the notification
        io.to(roomId).emit("messagesRead", { roomId, readerId: userId });
        socket.emit("messagesRead", { roomId, readerId: userId });
      } catch (err) {
        console.error("markAsRead error:", err);
      }
    });


    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
      if (currentUserId && onlineUsers.has(currentUserId)) {
        const sockets = onlineUsers.get(currentUserId);
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          onlineUsers.delete(currentUserId);
          console.log(`User ${currentUserId} is now offline`);
          io.emit("userOnlineStatus", { userId: currentUserId, status: "offline" });
        }
      }
    });
  });
}