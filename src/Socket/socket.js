import ChatRoom from "../models/chat.model.js";
import Message from "../models/message.model.js";

export function RegisterSocket(io) {
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("joinRoom", async ({ roomId, userId, participants }) => {
      try {
        let room;

        if (roomId) {
          room = await ChatRoom.findById(roomId);
          if (!room) return socket.emit("error", { message: "Room not found" });
        } else {
          const sortedParticipants = participants.sort();

          // Ensure exact match of participants
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
        io.to(roomId).emit("chatMessage", {
          roomId,
          senderId: userId,
          message,
          timestamp: msg.createdAt,
        });
      } catch (err) {
        console.error("chatMessage error:", err);
      }
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });
}
