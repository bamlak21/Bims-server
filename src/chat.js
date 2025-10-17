import mongoose from "mongoose";
import ChatRoom from "./models/chat.model.js";

const mongoURI = "mongodb://localhost:27017/bims_db";

async function run() {
  try {
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to MongoDB");

    const roomId = "68bd364030e6f6ed3eb347db";
    const participantIdsToAdd = [
      "6890a4ea11bd5758d0a656ea",
      "689b3b6434b3b5ea7c607cb7",
      "68b43a5f9e426ff5e4d67262",
    ];

    const updatedRoom = await ChatRoom.findByIdAndUpdate(
      roomId,
      { $addToSet: { participants: { $each: participantIdsToAdd } } },
      { new: true }
    );

    console.log("Updated ChatRoom:", updatedRoom);

    mongoose.disconnect();
  } catch (err) {
    console.error("Error updating ChatRoom:", err);
  }
}

run();
