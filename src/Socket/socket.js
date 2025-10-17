import ChatRoom from "../models/chat.model.js";
import Message from "../models/message.model.js";
import { onlineUsers } from "./socketManager.js"; // ⬅️ import global store

export function RegisterSocket(io) {
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // Store userId from client
    let currentUserId = null;

    // Expect user to send their userId after connection
    socket.on("register", ({ userId }) => {
      if (userId) {
        currentUserId = userId;

        // Support multiple sockets per user (e.g. multiple tabs)
        if (!onlineUsers.has(userId)) {
          onlineUsers.set(userId, new Set());
        }
        onlineUsers.get(userId).add(socket.id);

        console.log(`User ${userId} is online.`);
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
        const msg = await Message.create({ roomId, senderId: userId, message });

        // Determine message status based on recipient's status
        const room = await ChatRoom.findById(roomId);
        const recipientId = room.participants.find((id) => id.toString() !== userId);
        const isRecipientOnline = recipientId && onlineUsers.has(recipientId.toString());

        const status = isRecipientOnline ? "delivered" : "sent";
        msg.status = status;
        await msg.save();

        // Emit the message using the same field names the client expects
        io.to(roomId).emit("chatMessage", {
          _id: msg._id,
          roomId: roomId,
          senderId: msg.senderId,
          message: msg.message,
          status: msg.status,
          createdAt: msg.createdAt, // provide createdAt so client can parse dates
        });
      } catch (err) {
        console.error("chatMessage error:", err);
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