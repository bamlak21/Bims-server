import { Deal } from "../models/deals.model.js";
import { Property } from "../models/property.model.js";
import { Vehicle } from "../models/vehicle.model.js";
import { CreateNotification } from "../services/notificationService.js";
import {Commission} from "../models/commision.model.js";
import {User} from "../models/user.model.js";
import mongoose from "mongoose";
import { getMetrics } from "../utils/metric.js";

export const fetchListing = async (req, res) => {
  try {
    const {
      type = "all",
      page = 1,
      limit = 10,
      minPrice,
      maxPrice,
      category,
      search,
    } = req.query;

    const userId = req.user?._id || req.user?.id; // Current logged-in user
    const skip = (page - 1) * limit;
    const userType = req.user?.userType; 



    // Fetch deals assigned to the current user
    const userDeals = await Deal.find({ client_id: userId })
      .select("listing_id")
      .lean();
    const userDealListingIds = userDeals.map((deal) => deal.listing_id?.toString());

    // Fetch all deals with clients assigned (to exclude others' deals)
    const allDeals = await Deal.find({ client_id: { $exists: true } })
      .select("listing_id client_id")
      .lean();

    // Extract listings assigned to other clients
    const listingsAssignedToOthers = allDeals
      .filter((deal) => deal.client_id?.toString() !== userId)
      .map((deal) => deal.listing_id?.toString());

    // Build filter dynamically
    const buildFilter = (type) => {
      const filter = {
        _id: { $nin: listingsAssignedToOthers }, // Exclude listings assigned to other clients
      };
      if (minPrice || maxPrice) {
        filter.price = {};
        if (minPrice) filter.price.$gte = Number(minPrice);
        if (maxPrice) filter.price.$lte = Number(maxPrice);
      }
      if (category && category !== "all") filter.category = category;
      if (search) {
        const regex = new RegExp(search, "i");
        filter.$or = [
          { title: regex },
          { "location.city": regex },
          { "location.subcity": regex },
        ];
      }
  
      return filter;
    };

    console.log("User ID:", userId);
    console.log("User Deal Listing IDs:", userDealListingIds);
    console.log("Listings assigned to others:", listingsAssignedToOthers);

    const fetchData = (Model, type) =>
      Model.find(buildFilter(type))
        .populate("owner_id", "firstName lastName")
        .populate("broker_id", "firstName lastName")
        .sort({ created_at: -1 })
        .lean()
        .then((data) =>
          data.map((item) => ({
            ...item,
            type,
            isAssignedToCurrentUser: userDealListingIds.includes(item._id?.toString()),
          }))
        );

    let vehicles = [];
    let properties = [];

    if (type === "Vehicle" || type === "all") {
      vehicles = await fetchData(Vehicle, "Vehicle");
    }
    if (type === "Property" || type === "all") {
      properties = await fetchData(Property, "Property");
    }

    let listings = [...vehicles, ...properties].sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    );

    const totalItems = listings.length;
    const totalPages = Math.ceil(totalItems / limit);
    listings = listings.slice(skip, skip + Number(limit));

    return res.status(200).json({
      message: "Listings fetched successfully",
      listings,
      pagination: { page: Number(page), limit: Number(limit), totalItems, totalPages },
    });
  } catch (err) {
    console.error("Error fetching listings:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

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
          status:"declined"
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

export const getUserGrowth = async (req, res) => {
  try {
    const period = parseInt(req.query.period) || 365; // Default to 1 year if no period
    const startDate = new Date(Date.now() - period * 24 * 60 * 60 * 1000);
    
    // For periods < 30 days, use daily grouping; otherwise monthly
    const isDaily = period < 30;
    const groupBy = isDaily ? { day: { $dayOfMonth: "$createdAt" }, month: { $month: "$createdAt" }, year: { $year: "$createdAt" } } : { month: { $month: "$createdAt" }, year: { $year: "$createdAt" } };

    const userGrowth = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          userType: { $in: ['client', 'broker','owner'] } // Exclude admins
        }
      },
      {
        $group: {
          _id: groupBy,
          brokers: {
            $sum: { $cond: [{ $eq: ["$userType", "broker"] }, 1, 0] }
          },
          clients: {
            $sum: { $cond: [{ $eq: ["$userType", "client"] }, 1, 0] }
          },
          owners: {
            $sum: { $cond: [{ $eq: ["$userType", "owner"] }, 1, 0] } 
          },
          totalUsers: { $sum: 1 }
        }
      },
      {
        $sort: isDaily ? { "_id.year": 1, "_id.month": 1, "_id.day": 1 } : { "_id.year": 1, "_id.month": 1 }
      },
      {
        $project: {
          _id: 0,
          month: isDaily 
            ? { $concat: [
                { $toString: "$_id.day" }, "/", { $toString: "$_id.month" }, "/", { $toString: "$_id.year" }
              ] }
            : { $concat: [
                { $toString: "$_id.month" }, "/", { $toString: "$_id.year" }
              ] },
          totalUsers: 1,
          brokers: 1,
          clients: 1,
          owners: 1
        }
      },
      {
        $limit: 12  // Limit results for performance
      }
    ]);

    // Calculate platformGrowth as percentage increase from first to last period (if >1 data points)
    let platformGrowth = 0;
    if (userGrowth.length > 1) {
      const firstTotal = userGrowth[0].totalUsers;
      const lastTotal = userGrowth[userGrowth.length - 1].totalUsers;
      platformGrowth = ((lastTotal - firstTotal) / firstTotal * 100).toFixed(1);
    } else if (userGrowth.length === 1) {
      platformGrowth = userGrowth[0].totalUsers; // For single period, show absolute new users
    }

    res.json({
      userGrowth,
      platformGrowth: parseFloat(platformGrowth) // Send growth for frontend use
    });
  } catch (err) {
    console.error('Error fetching user growth:', err);
    res.status(500).json({ message: err.message });
  }
};

export const getListingGrowth = async (req, res) => {
  try {
    const period = parseInt(req.query.period) || 365; // default to 1 year
    const startDate = new Date(Date.now() - period * 24 * 60 * 60 * 1000);
    const isDaily = period < 30;

    const groupBy = isDaily
      ? {
          day: { $dayOfMonth: "$createdAt" },
          month: { $month: "$createdAt" },
          year: { $year: "$createdAt" },
        }
      : {
          month: { $month: "$createdAt" },
          year: { $year: "$createdAt" },
        };

    // Aggregate pipeline to be reused for both models
    const getGrowthPipeline = (Model, typeLabel) => [
      {
        $match: {
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: groupBy,
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          group: "$_id",
          count: 1,
          type: { $literal: typeLabel },
        },
      },
    ];

    // Run both aggregations in parallel
    const [vehicleData, propertyData] = await Promise.all([
      Vehicle.aggregate(getGrowthPipeline(Vehicle, "vehicle")),
      Property.aggregate(getGrowthPipeline(Property, "property")),
    ]);

    // Merge and group data from both models into a common timeline
    const mergedData = [...vehicleData, ...propertyData];

    // Create a time-based key for grouping
    const grouped = {};

    for (const item of mergedData) {
      const { group, count, type } = item;
      const key = isDaily
        ? `${group.day}/${group.month}/${group.year}`
        : `${group.month}/${group.year}`;

      if (!grouped[key]) {
        grouped[key] = {
          period: key,
          totalListings: 0,
          vehicleListings: 0,
          propertyListings: 0,
        };
      }

      grouped[key].totalListings += count;
      if (type === "vehicle") grouped[key].vehicleListings += count;
      if (type === "property") grouped[key].propertyListings += count;
    }

    // Convert to array and sort
    const listingGrowth = Object.values(grouped).sort((a, b) => {
      const [am, ay] = a.period.split("/").map(Number);
      const [bm, by] = b.period.split("/").map(Number);
      return ay !== by ? ay - by : am - bm;
    }).slice(-12); // limit to last 12 entries

    // Calculate growth
    let listingGrowthRate = 0;
    if (listingGrowth.length > 1) {
      const first = listingGrowth[0].totalListings;
      const last = listingGrowth[listingGrowth.length - 1].totalListings;

      if (first === 0) {
        listingGrowthRate = last > 0 ? 100 : 0;
      } else {
        listingGrowthRate = ((last - first) / first * 100).toFixed(1);
      }
    } else if (listingGrowth.length === 1) {
      listingGrowthRate = listingGrowth[0].totalListings;
    }

    res.json({
      listingGrowth,
      listingGrowthRate: parseFloat(listingGrowthRate),
    });
  } catch (err) {
    console.error("Error fetching listing growth:", err);
    res.status(500).json({ message: err.message });
  }
};

let serverStartTime = Date.now()
export const systemHealth = async (req, res) => {
 
  const getSuccessRate = () => {
  if (totalRequests === 0) return 100; // Assume perfect if no traffic
  return ((successfulRequests / totalRequests) * 100).toFixed(2);
};

  
  try {
    // Uptime in seconds
    const uptime = ((Date.now() - serverStartTime) / 1000).toFixed(0);

    // Basic DB ping for response time
    const dbStart = Date.now();
    await mongoose.connection.db.admin().ping();
    const responseTime = Date.now() - dbStart;

    // Count active users (you can define what "active" means, e.g., logged in past 15 minutes)
    const activeSince = new Date(Date.now() - 15 * 60 * 1000); // last 15 minutes
    const activeUsers = await User.countDocuments({
      isActive: true,
      loginLast: { $gte: activeSince },
    });
   
     const { successRate, errorRate,totalRequests } = getMetrics();
    res.json({
      uptime: Number(uptime),  // in seconds
      responseTime, // in ms                      
      activeUsers,
      successRate,
      errorRate,
      totalRequests                     
    });
  } catch (err) {
    console.error("System health check failed:", err);
    res.status(500).json({ error: 'Failed to fetch system health' });
  }
}


