import mongoose from "mongoose";
import { Notifications } from "../models/notifications.model.js";

export const CreateNotification = async ({
  userId,
  type,
  listingId,
  listingType,
  message,
  is_read,
  link,
  brokerId,
  clientId
}) => {
  // Validate required IDs
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new Error("Invalid userId");
  }

  if (listingId && !mongoose.Types.ObjectId.isValid(listingId)) {
    throw new Error("Invalid listingId");
  }
  try {
    const notification = await Notifications.create({
      user_id: userId,
      type: type,
      listing_id: listingId,
      listing_type: listingType,
      message: message,
      is_read: is_read,
      link: link,
      action_required: true,
      broker_id:brokerId,
      client_id:clientId
      
    });

    return notification;
  } catch (err) {
    console.error("Failed to create notification:", err);
    throw new Error("Notification creation failed");
  }
};
