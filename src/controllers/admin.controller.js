import { Deal } from "../models/deals.model.js";
import { Property } from "../models/property.model.js";
import { Vehicle } from "../models/vehicle.model.js";
import { CreateNotification } from "../services/notificationService.js";
import {Commission} from "../models/commision.model.js";
import {User} from "../models/user.model.js";

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

export const getOverview = async (req, res) => {
  try {
    const property = await Property.countDocuments();
    const vehicle = await Vehicle.countDocuments();
    const user= await User.find();
    const totalListings = property + vehicle;
    const totalDeals = await Deal.countDocuments({ status: "closed" });
    const totalRevenue = await Commission.aggregate([
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const pendingproperty = await Property.countDocuments({status:"pending"})
    const pendingvehicle = await Vehicle.countDocuments({status:"pending"})
    const pendingListings = pendingproperty+pendingvehicle
    const approvedproperty = await Property.countDocuments({status:"approved"})
    const approvedvehicle = await Vehicle.countDocuments({status:"approved"})
    const approvedListings = approvedproperty + approvedvehicle
    res.json({
      totalListings,
      totalDeals,
      totalUsers:user.length,
      totalRevenue: totalRevenue[0]?.total || 0,
      pendingListings,
      approvedListings
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getInsights = async (req, res) => {
  try {
    const topBroker = await Commission.aggregate([
      { $group: { _id: "$broker", total: { $sum: "$amount" } } },
      { $sort: { total: -1 } },
      { $limit: 1 },
    ]);

    res.json({
      topBroker: topBroker[0] || null,
      // Add more insight logic here
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getReports = async (req, res) => {
  try {
    const monthlyRevenue = await Commission.aggregate([
      {
        $group: {
          _id: { $month: "$createdAt" },
          total: { $sum: "$amount" },
        },
      },
      { $sort: { "_id": 1 } },
    ]);

    res.json({ monthlyRevenue });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/admin/analytics/broker-performance
export const getBrokerPerformance = async (req, res) => {
  try {
    const brokers = await User.find({ role: "broker" });

    const performance = await Promise.all(
      brokers.map(async (broker) => {
        const deals = await Deal.countDocuments({ broker: broker._id, status: "closed" });
        const commissions = await Commission.aggregate([
          { $match: { broker: broker._id } },
          { $group: { _id: null, total: { $sum: "$amount" } } },
        ]);

        return {
          broker: `${broker.firstName} ${broker.lastName}`,
          dealsClosed: deals,
          totalCommissions: commissions[0]?.total || 0,
        };
      })
    );

    res.json(performance);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};