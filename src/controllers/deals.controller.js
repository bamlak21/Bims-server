import { Deal } from "../models/deals.model.js";
import { Property } from "../models/property.model.js";
import { Vehicle } from "../models/vehicle.model.js";

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
export const getDealById = async (req, res) => {
  try {
    const deal = await Deal.findById(req.params.id)
      .populate("broker_id", "firstName lastName email")
      .populate("owner_id", "firstName lastName email")
      .populate("client_id", "firstName lastName email");

    if (!deal) return res.status(404).json({ message: "Deal not found" });

    // fetch listing (based on listing_type)
    let listing = null;
    if (deal.listing_type === "Property") {
      listing = await Property.findById(deal.listing_id);
    } else if (deal.listing_type === "Vehicle") {
      listing = await Vehicle.findById(deal.listing_id);
    }

    return res.json({
      ...deal.toObject(),
      listing,
    });
  } catch (err) {
    console.error("Error fetching deal:", err);
    res.status(500).json({ message: "Server error" });
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
