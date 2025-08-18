import ChatRoom from "../models/chat.model.js";
import Message from "../models/message.model.js";

export default function registerSockets(io) {
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // join or create a room
    socket.on("joinRoom", async ({ roomId, userId, participants }) => {
      let room;

      if (roomId) {
        // if frontend sends a specific roomId
        room = await ChatRoom.findById(roomId);
      } else {
        // check if a room already exists with the same participants (ignoring order)
        room = await ChatRoom.findOne({
          participants: { $all: participants, $size: participants.length },
        });

        if (!room) {
          // create a new room if none exists
          room = new ChatRoom({ participants });
          await room.save();
        }
      }

      socket.join(room._id.toString());
      console.log(`User ${userId} joined room: ${room._id}`);

      socket.emit("roomJoined", {
        roomId: room._id,
        participants: room.participants,
      });
    });

    // send and save message
    socket.on("chatMessage", async ({ roomId, userId, message }) => {
      const msg = new Message({ roomId, sender: userId, message });
      await msg.save();

      io.to(roomId).emit("chatMessage", {
        roomId,
        userId,
        message,
        createdAt: msg.createdAt,
      });
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });
}
