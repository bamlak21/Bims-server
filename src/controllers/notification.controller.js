import { Notifications } from "../models/notifications.model.js";
import { CreateNotification } from "../services/notificationService.js";
import { Vehicle } from "../models/vehicle.model.js";
import { Property } from "../models/property.model.js";
import { Deal } from "../models/deals.model.js";
import mongoose from "mongoose";

export const GetNotifications = async (req, res) => {
  const userId = req.user.id;

  const { page = 1, limit = 10 } = req.query;

  const query = { user_id: userId };

  try {
    const notifications = await Notifications.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate("broker_id","firstName lastName")

    const total = await Notifications.countDocuments(query);
    return res.status(200).json({
      page: Number(page),
      limit: Number(limit),
      total,
      notifications,
    });
  } catch (err) {
    console.log(err.message);

    return res
      .status(500)
      .json({ message: "Server error", error: err.message });
  }
};

export const markNotificationAsRead = async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;

  try {
    const notification = await Notifications.findOne({
      _id: id,
      user_id: userId,
    });
    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    notification.is_read = true;
    await notification.save();

    res.status(200).json({ message: "Notification marked as read" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const markAllNotificationsAsRead = async (req, res) => {
  const userId = req.user.id;

  try {
    await Notifications.updateMany(
      { user_id: userId, is_read: false },
      { is_read: true }
    );

    res.status(200).json({ message: "All notifications marked as read" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const RespondToBrokerRequest = async (req, res) => {
  const { notificationId, response } = req.body; // response = "accepted" | "declined"

  try {
    const notification = await Notifications.findById(notificationId);
    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    if (!["accepted", "declined"].includes(response)) {
      return res.status(400).json({ message: "Invalid response" });
    
    }
    if (!notification.user_id || !mongoose.Types.ObjectId.isValid(notification.user_id)) {
  return res.status(400).json({ message: "Invalid or missing user_id in notification" });
}


    notification.status = response;
    notification.action_required = false;
    await notification.save();

    if (response === "accepted") {
  const model =
    notification.listing_type === "Vehicle" ? Vehicle : Property;

  const listing = await model.findById(notification.listing_id);

  if (!listing) {
    return res.status(404).json({ message: "Listing not found" });
  }

  listing.broker_id = notification.broker_id;
  listing.is_broker_assigned = true;
  await listing.save();

  await CreateNotification({
    userId: notification.broker_id,
    type: "approved_assigning",
    listingId: listing._id,
    listingType: notification.listing_type,
    message: "Your broker request approved!",
  });

  const type = notification.listing_type;

const existingDeal = await Deal.findOne({
  listing_id: listing._id,
  broker_id: notification.broker_id,
  listing_type: type,
});


    if (!existingDeal) {
      await Deal.create({
  listing_id: listing._id,
  broker_id: notification.broker_id,
  owner_id: listing.owner_id,
  title: listing.title,
  listing_type: type,
  status: 'negotiating',
  listing_snapshot: {
    title: listing.title,
    description: listing.description,
    price: listing.price,
    location: listing.location,
    images: listing.image_paths || listing.images || [],
  },
});

    }

    return res.status(200).json({
      message: 'Broker assigned and deal created successfully',
      listing,
    });
}
 else {
  const model =
    notification.listing_type === "Vehicle" ? Vehicle : Property;

  const listing = await model.findById(notification.listing_id);

  if (listing) {
    listing.broker_id = null;
    listing.is_broker_assigned = false;
    await listing.save();
  }
      // Notify broker
      await CreateNotification({
        userId: notification.broker_id,
        type: "declined_assigning",
        listingId: notification.listing_id,
        listingType: notification.listing_type,
        message: "Your broker request declined.",
      });
      return res.status(200).json({
      message: `Broker request ${response}`,
    });
    }

    
  } catch (error) {
    console.error("Error in RespondToBrokerRequest:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
