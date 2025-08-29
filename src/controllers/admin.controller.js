import { Property } from "../models/property.model.js";
import { Vehicle } from "../models/vehicle.model.js";
import { CreateNotification } from "../services/notificationService.js";

export const RejectListing = async (req, res) => {
  const { id, type, reason } = req.body;

  if (!id) {
    return res.status(400).json({ message: "Id missing" });
  }

  if ((type !== "Vehicle" && type !== "Property") || !id) {
    return res.status(400).json({ message: "Required fields missing" });
  }

  try {
    const model = type === "Vehicle" ? Vehicle : Property;

    const listing = await model.findById(id);
    if (!listing) {
      return res.status(400).json({ message: "Listing not found" });
    }
    listing.rejection_reason = reason;
    listing.status = "rejected";
    await listing.save();
     await CreateNotification({
          userId: listing.owner_id,
          type: listing.status === "rejected" ? "rejection" : "approved",
          listing_id: listing._id,
          listing_type: listing.type,
          message:
            listing.status === "rejected"
              ? listing.rejection_reason
              : "Your listing have been approved",
        });
    return res.status(200).json({ message: "Listing rejected" });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Server Error" });
  }
};
