import mongoose from "mongoose";
import { Deal } from "../models/deals.model.js";
import { Property } from "../models/property.model.js";
import { Vehicle } from "../models/vehicle.model.js";
import { CreateCommission } from "../services/commissionService.js";

export const getDealsByBroker = async (req, res) => {
  try {
    const { brokerId, status } = req.query;

    if (!brokerId) {
      return res.status(400).json({ message: "Missing brokerId" });
    }

    const query = { broker_id: brokerId };
    if (status) query.status = status;

    const deals = await Deal.find(query)
      .populate("listing_id")
      .populate("owner_id","firstName lastName")
      .populate("client_id","firstName lastName")
      .sort({ createdAt: -1 });

    res.json(deals);
  } catch (err) {
    console.error("Error fetching deals:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Get single deal by ID
// export const getDealById = async (req, res) => {
//   try {
//     const { id } = req.params;
//     if (!mongoose.Types.ObjectId.isValid(id)) {
//       return res.status(400).json({ message: "Invalid deal ID" });
//     }
//     const deal = await Deal.findById(id)
//       .populate("broker_id", "firstName lastName email userType")
//       .populate("owner_id", "firstName lastName email userType")
//       .populate("client_id", "firstName lastName email userType");

//     if (!deal) return res.status(404).json({ message: "Deal not found" });

//     // fetch listing (based on listing_type)
//     let listing = null;
//     if (deal.listing_type === "Property") {
//       listing = await Property.findById(deal.listing_id)
//       .populate("broker_id", "firstName lastName email userType")
//       .populate("owner_id", "firstName lastName email userType")
// ;
//     } else if (deal.listing_type === "Vehicle") {
//       listing = await Vehicle.findById(deal.listing_id)
//       .populate("broker_id", "firstName lastName email userType")
//       .populate("owner_id", "firstName lastName email userType")
//       ;
//     }

//     return res.json({
//       ...deal.toObject(),
//       listing,
//     });
//   } catch (err) {
//     console.error("Error fetching deal:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// };

export const getDealById = async (req, res) => {
  try {
    const deal = await Deal.findById(req.params.id)
      .populate('broker_id owner_id client_id listing_id')
      .populate({
        path: 'commission_id',
        populate: [
          { path: 'broker_id', select: 'firstName lastName' },
          { path: 'owner_id', select: 'firstName lastName' },
          { path: 'client_id', select: 'firstName lastName' },
        ],
      });

    if (!deal) return res.status(404).json({ message: 'Deal not found' });
    res.json(deal);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};


// export const getBrokerDeals = async (req, res) => {
//   const { brokerId } = req.query;

//   if (!brokerId) {
//     return res.status(400).json({ message: 'Missing brokerId' });
//   }

//   try {
//     const deals = await Deal.find({ broker_id: brokerId }).sort({ createdAt: -1 });

//     const listingsWithDetails = await Promise.all(
//       deals.map(async (deal) => {
//         const model = deal.listing_type === 'vehicle' ? Vehicle : Property;
//         const listing = await model.findById(deal.listing_id);

//         return {
//           dealId: deal._id,
//           status: deal.status,
//           createdAt: deal.createdAt,
//           updatedAt: deal.updatedAt,
//           listing_type: deal.listing_type,
//           listing: listing || null,
//         };
//       })
//     );

//     res.status(200).json({ deals: listingsWithDetails });
//   } catch (error) {
//     console.error('Error fetching broker deals:', error);
//     res.status(500).json({ message: 'Server error' });
//   }
// };

// export const getCreatedDeals = async (req, res) => {
//   try {
//     if (!req.user) {
//       return res.status(400).json({ message: "User not authenticated" });
//     }

//     const userId = req.user?.id;

//     if (!mongoose.Types.ObjectId.isValid(userId)) {
//       return res.status(400).json({ message: "Invalid user ID" });
//     }

//     const deals = await Deal.find({ client_id: userId }) // Filter by authenticated user's client_id
//       .populate("listing_id", "_id title")
//       .populate("owner_id", "firstName lastName")
//       .populate("broker_id", "firstName lastName")
//       .sort({ createdAt: -1 });

//     res.json({ deals });
//   } catch (err) {
//     console.error("Error fetching created deals:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// };

export const getDealsByUser = async (req, res) => {
  try {
    const { userType, userId, status } = req.query;
    if (!userType || !userId) {
      return res.status(400).json({ message: "Missing userType or userId" });
    }

    let query = {};
    if (userType === "client") query.client_id = userId;
    else if (userType === "owner") query.owner_id = userId;
    else return res.status(400).json({ message: "Invalid userType" });

    if (status) query.status = status;

    const deals = await Deal.find(query)
      .populate("listing_id")
      .populate("broker_id", "firstName lastName userType")
      .populate("owner_id", "firstName lastName userType")
      .populate("client_id", "firstName lastName userType")
      .sort({ createdAt: -1 });

    res.json(deals);
  } catch (err) {
    console.error("Error fetching deals:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateDeal = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Populate listing_id so we can use its _id later
    const deal = await Deal.findById(id).populate("listing_id").populate('client_id', 'firstName lastName')
      .populate('owner_id', 'firstName lastName')
      .populate('broker_id', 'firstName lastName');;
    if (!deal) {
      return res.status(404).json({ message: "Deal not found" });
    }

    // Apply incoming updates
    Object.assign(deal, updateData);

    // BOTH PARTIES ACCEPTED → create commission
    if (
      deal.owner_status === "accepted" &&
      deal.client_status === "accepted" &&
      !deal.commission_id // avoid creating twice
    ) {
      deal.status = "agreement";

      // Capture the returned commission
      const commission = await CreateCommission({
        broker_id: deal.broker_id,
        owner_id: deal.owner_id,
        client_id: deal.client_id,
        listing_id: deal.listing_id._id,   // populated → real ObjectId
        listing_type: deal.listing_type,
        sale_price: deal.listing_snapshot?.price,
      });

      // Link commission to deal
      deal.commission_id = commission._id;
    } 
    else if (
      deal.owner_status === "cancelled" ||
      deal.client_status === "cancelled"
    ) {
      deal.status = "cancelled";
    }

    await deal.save();

    // Return populated data (optional but helpful for the frontend)
  // updateDeal controller
const populatedDeal = await Deal.findById(deal._id)
  .populate('commission_id')
  .populate('listing_id')
  .populate('client_id', 'firstName lastName userType')
  .populate('owner_id', 'firstName lastName userType')
  .populate('broker_id', 'firstName lastName userType');

res.json(populatedDeal);   // commission_id is a STRING here because of .lean();
  } catch (error) {
    console.error("Error updating deal:", error);
    res.status(500).json({ message: "Failed to update deal", error: error.message });
  }
};