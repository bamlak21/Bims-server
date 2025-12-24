import { User } from "../models/user.model.js";
import { Vehicle } from "../models/vehicle.model.js";
import { Property } from "../models/property.model.js";
import mongoose from "mongoose";
import { Deal } from "../models/deals.model.js";
import { Commission } from "../models/commision.model.js";
import { CreateNotification } from "../services/notificationService.js";
import { Admin } from "../models/admin.model.js";

export const getUserStats = async (req, res) => {
  try {
    // Select only the necessary fields for performance
    const users = await User.find({}, "userType documentVerification.status");

    const stats = {
      totalUsers: users.length,
      pendingBrokers: 0,
      verifiedBrokers: 0,
      totalClients: 0,
      totalOwners: 0,
      totalBrokers: 0,
    };

    users.forEach((user) => {
      const { userType, documentVerification } = user;

      switch (userType) {
        case "broker":
          if (documentVerification?.status === "approved") {
            stats.verifiedBrokers++;
          } else {
            stats.pendingBrokers++;
          }
          stats.totalBrokers++;
          break;
        case "client":
          stats.totalClients++;
          break;
        case "owner":
          stats.totalOwners++;
          break;
        default:
          break;
      }
    });

    return res.status(200).json(stats);
  } catch (error) {
    console.error("Error fetching stats:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const { search = "", role = "all", verification = "all" } = req.query;

    // Build the filter object
    const filter = {};

    if (role !== "all") {
      filter.userType = role;
    }

    if (verification !== "all") {
      filter.verified = verification === "verified";
    }

    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const users = await User.find(
      filter,
      "firstName lastName email phoneNumber userType verified createdAt documentVerification lastLogin"
    );

    return res.status(200).json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const getCurrentUserProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const requestingUserId = req.user?._id || req.user?.id;

    const user = await User.findById(id).select(
      "firstName lastName email phoneNumber userType photo verified createdAt address saved isBanned isActive socialLinks"
    );

    if (!user) return res.status(404).json({ message: "User not found" });

    // Manually populate the saved listings
    const listings = [];
    for (const save of user.saved) {
      let Model;
      if (save.listingType === "Vehicle") {
        Model = Vehicle;
      } else if (save.listingType === "Property") {
        Model = Property;
      } else {
        continue; // Skip invalid types
      }

      const listing = await Model.findById(save.listingId)
        .populate("broker_id", "firstName lastName")
        .exec();

      if (listing) {
        listings.push(listing);
      }
    }

    // DATA MASKING: Hide sensitive info if requester is not the profile owner
    let userData = user.toObject();
    const isOwnProfile = requestingUserId && String(requestingUserId) === String(id);

    if (!isOwnProfile) {
      // HIDE sensitive fields from strangers
      delete userData.email;
      delete userData.phoneNumber;
      delete userData.address;
      delete userData.socialLinks;
      delete userData.saved; // Hide saved listings too
    }

    // Return the user profile with populated listings (only if own profile)
    res.status(200).json({
      ...userData,
      listings: isOwnProfile ? listings : [], // Only show listings to owner
      user: userData,
    });
  } catch (err) {
    console.error("Error in /me route:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const UpdateUserProfile = async (req, res) => {
  const { id, firstName, lastName, email, phoneNumber, socialLinks, address } =
    req.body;

  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update only if the fields are provided (not empty or undefined)
    if (firstName && firstName.trim() !== "") user.firstName = firstName;
    if (lastName && lastName.trim() !== "") user.lastName = lastName;
    if (email && email.trim() !== "") user.email = email;
    if (phoneNumber && phoneNumber.trim() !== "")
      user.phoneNumber = phoneNumber;
    if (socialLinks) {
      const parsedLinks =
        typeof socialLinks === "string" ? JSON.parse(socialLinks) : socialLinks;

      const existingLinks = user.socialLinks
        ? Object.fromEntries(user.socialLinks)
        : {};

      user.socialLinks = { ...existingLinks, ...parsedLinks };
    }
    if (req.file) {
      user.photo = req.file.path.replace(/\\/g, "/");
    }
    if (address) {
      const parsedLocation =
        typeof address === "string" ? JSON.parse(address) : address;
      user.address = parsedLocation;
    }

    await user.save();

    return res
      .status(200)
      .json({ message: "Profile updated successfully", user });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Server Error" });
  }
};

export const fetchAllUsers = async (req, res) => {
  try {
    const users = await User.find(); // Adjust this line as needed
    res.json(users);
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const deactivateUser = async (req, res) => {
  const { id } = req.params;
  const { isActive } = req.body;

  try {
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { isActive },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res
      .status(200)
      .json({ message: "User deactivated successfully", user: updatedUser });
  } catch (error) {
    console.error("Error deactivating user:", error);
    res.status(500).json({ message: "Server error while deactivating user" });
  }
};

export const GetBrokers = async (req, res) => {
  try {
    const brokers = await User.find({ userType: "broker" })
      .select(
        "firstName lastName email phoneNumber socialLinks photo verified userType averageRating ratingCount"
      )
      .lean();

    return res.status(200).json({ message: "Success", brokers });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server Error" });
  }
};
export const GetBrokerById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid broker ID" });
    }

    const broker = await User.findOne({ _id: id, userType: "broker" })
      .select("firstName lastName email phoneNumber socialLinks photo verified averageRating ratingCount")
      .lean();

    if (!broker) {
      return res.status(404).json({ message: "Broker not found" });
    }

    return res.status(200).json({ message: "Success", broker });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server Error" });
  }
};

export const GetBrokerAnalytics = async (req, res) => {
  const { brokerId } = req.query;
  const monthNames = [
    "",
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  if (!brokerId) {
    return res.status(400).json({ message: "Missing Required fields." });
  }

  if (!mongoose.Types.ObjectId.isValid(brokerId)) {
    return res.status(400).json({ error: "Invalid broker_id" });
  }

  try {
    // Total listings
    const vehicles = await Vehicle.countDocuments({ broker_id: brokerId });
    const property = await Property.countDocuments({ broker_id: brokerId });
    const totalListing = vehicles + property;

    // Total deals
    const totalDeals = await Deal.countDocuments({
      broker_id: brokerId,
      status: "completed",
    });

    // Success Rate
    const successRate =
      totalListing > 0 ? (totalDeals / totalListing) * 100 : 0;

    // Total commission
    const totalCommissionEarnings = await Commission.aggregate([
      {
        $match: {
          broker_id: new mongoose.Types.ObjectId(brokerId),
          status: "paid"
        }
      },
      {
        $group: {
          _id: null,
          totalCommission: { $sum: "$total_commission" },
        },
      },
    ]);

    // Monthly sold listings (deals)
    const monthlySoldListings = await Deal.aggregate([
      {
        $match: {
          broker_id: new mongoose.Types.ObjectId(brokerId),
          status: "completed",
        },
      },
      {
        $group: {
          _id: { $month: "$createdAt" },
          soldListings: { $sum: 1 },
        },
      },
      {
        $project: {
          month: { $arrayElemAt: [monthNames, "$_id"] },
          soldListings: 1,
          _id: 0,
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Monthly commissions
    const monthlyCommissions = await Commission.aggregate([
      {
        $match: {
          broker_id: new mongoose.Types.ObjectId(brokerId),
          status: "paid"
        }
      },
      {
        $group: {
          _id: { $month: "$createdAt" },
          commission: { $sum: "$total_commission" },
        },
      },
      {
        $project: {
          month: { $arrayElemAt: [monthNames, "$_id"] },
          commission: 1,
          _id: 0,
        },
      },
      { $sort: { _id: 1 } },
    ]);

    return res.status(200).json({
      message: "Success",
      totals: {
        totalCommissions: totalCommissionEarnings[0]?.totalCommission || 0,
        totalDeals,
        totalListing,
        successRate: successRate.toFixed(2),
      },
      analytics: {
        overview: {
          totalEarnings: totalCommissionEarnings[0]?.totalCommission || 0,
          completedDeals: totalDeals,
          successRate: Number(successRate.toFixed(2)),
        },
        monthlyData: monthNames.slice(1).map((month, index) => {
          const sold = monthlySoldListings.find(m => m.month === month)?.soldListings || 0;
          const commission = monthlyCommissions.find(m => m.month === month)?.commission || 0;
          return {
            month: month.substring(0, 3), // e.g. "Jan"
            listings: sold,               // could also return property+vehicle per month if needed
            earnings: commission
          };
        }),
        dealPipeline: {
          active: await Deal.countDocuments({ broker_id: brokerId, status: "active" }),
          negotiating: await Deal.countDocuments({ broker_id: brokerId, status: "negotiating" }),
          agreement: await Deal.countDocuments({ broker_id: brokerId, status: "agreement" }),
          completed: await Deal.countDocuments({ broker_id: brokerId, status: "completed" }),
          cancelled: await Deal.countDocuments({ broker_id: brokerId, status: "cancelled" })
        },
        commissionHistory: await Commission.find({ broker_id: brokerId })
          .sort({ createdAt: -1 })
          .limit(10)
          .lean()
          .then(cs => cs.map(c => ({
            id: c._id,
            listing_id: c.listing_id,
            amount: c.total_commission,
            status: c.status,
            client_payment_status: c.client_payment_status,
            owner_payment_status: c.owner_payment_status,
            created_at: c.createdAt,
            listing_type: c.listing_type
          })))
      }
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server Error" });
  }
};

export const Delete = async (req, res) => {
  try {
    const userId = req.user.id; // From JWT middleware

    const deletedUser = await User.findByIdAndDelete(userId);

    if (!deletedUser) {
      return res.status(404).json({ error: "User not found or already deleted" });
    }

    res.status(200).json({ message: "User account deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ error: "Server error" });
  }
}
export const getassignedlistsforbroker = async (req, res) => {
  try {
    const [properties, vehicles] = await Promise.all([
      Property.find({ assignedVerifier: req.params.brokerId, status: "assigned" }),
      Vehicle.find({ assignedVerifier: req.params.brokerId, status: "assigned" }),
    ]);

    const combined = [
      ...properties.map(p => ({ ...p.toObject(), listingType: "Property" })),
      ...vehicles.map(v => ({ ...v.toObject(), listingType: "Vehicle" })),
    ].sort((a, b) => new Date(b.assignedAt || b.createdAt) - new Date(a.assignedAt || a.createdAt));

    res.json(combined);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export const sendverificationstatusforadmin = async (req, res) => {
  try {
    const { decision, comment } = req.body; // "authentic" | "fake"
    const id = req.params.id;

    let listing = null;
    let model = null;

    // Try Property first
    listing = await Property.findById(id);
    if (listing) {
      model = "Property";
    } else {
      // Try Vehicle
      listing = await Vehicle.findById(id);
      if (listing) {
        model = "Vehicle";
      }
    }

    if (!listing) {
      return res.status(404).json({ message: "Listing not found" });
    }

    // Ensure assigned broker is the one verifying
    if (listing.assignedVerifier?.toString() !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const admin = await Admin.findOne({ role: "admin" });
    if (!admin) {
      console.error("Admin user not found!");
      return res.status(500).json({ message: "Admin account missing" });
    }
    // Apply verification status
    if (decision === "authentic") {
      listing.status = "broker_approved";
      listing.rejection_reason = "";
      await CreateNotification({
        userId: admin._id,
        type: "Verification_review",
        listingId: listing._id,
        listingType: listing.type,
        message: comment || "Listing has been verified and approved by broker",
        status: "accepted"
      });

    } else {
      listing.status = "broker_rejected";
      listing.rejection_reason = comment || "Failed verification";

      await CreateNotification({
        userId: admin._id,
        type: "rejected",
        listingId: listing._id,
        listingType: listing.type,
        message: listing.rejection_reason,
        status: "rejected",
      });
    }

    listing.verifiedBy = req.user.id;
    listing.verifiedAt = new Date();
    listing.verificationComment = comment || "";

    await listing.save();

    return res.json({
      message: "Verification completed",
      listingType: model,
      id: listing._id,
    });

  } catch (err) {
    console.error("Verification error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
