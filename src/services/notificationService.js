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
}) => {
  if (
    !mongoose.Types.ObjectId.isValid(userId) ||
    !mongoose.Types.ObjectId.isValid(listingId)
  ) {
    throw new Error("Id malformed");
  }
  try {
    const notification = new Notifications({
      user_id: userId,
      type: type,
      listing_id: listingId,
      listing_type: listingType,
      message: message,
      is_read: is_read,
      link: link,
    });

    return notification;
  } catch (err) {
    console.log("Failed to create notification", err);
  }
};
