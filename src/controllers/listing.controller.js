import { Property } from "../models/property.model.js";
import { Vehicle } from "../models/vehicle.model.js";
import { Deal } from "../models/deals.model.js";
import { CreateNotification } from "../services/notificationService.js";
import { User } from "../models/user.model.js";
import Message from "../models/message.model.js";
import mongoose from "mongoose";

export const CreateListing = async (req, res) => {
  const {
    type,
    title,
    description,
    category,
    price,
    vehicleSpecs,
    owner_id,
    status,
    location,
    specifications,
    rejection_reason,
    needBroker
  } = req.body;
  const parsedLocation =
    typeof location === "string" ? JSON.parse(location) : location;
  const parsedSpecifications =
    typeof specifications === "string"
      ? JSON.parse(specifications)
      : specifications;
  const parsedVehicleSpecs =
    typeof vehicleSpecs === "string" ? JSON.parse(vehicleSpecs) : vehicleSpecs;

  if (!type) return res.status(400).json({ message: "Missing listing type" });

  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ message: "At least one image is required" });
  }

  if (
    type === "Vehicle" &&
    (!title ||
      !description ||
      !category ||
      !price ||
      !vehicleSpecs ||
      !owner_id ||
      !status||!needBroker)
  ) {
    return res.status(400).json({ message: "Missing required vehicle fields" });
  }

  if (
    type === "Property" &&
    (!title ||
      !description ||
      !category ||
      !price ||
      !specifications ||
      !owner_id ||
      !status ||
      !location||!needBroker)
  ) {
    return res
      .status(400)
      .json({ message: "Missing required property fields" });
  }

  const imagePaths = req.files.map((file) => file.path.replace(/\\/g, "/"));
  // const formattedLocation = location
  //   ? {
  //       city: location.city,
  //       subcity: location.subcity,
  //       woreda: location.woreda,
  //       address: location.address,
  //     }
  //   : null;
  // const formattedSpecifications = specifications
  //   ? {
  //       bedrooms: specifications.bedrooms,
  //       bathrooms: specifications.bathrooms,
  //       area: specifications.area,
  //       yearBuilt: specifications.yearBuilt,
  //       condition: specifications.condition,
  //       swimmingPool: specifications.swimmingPool,
  //     }
  //   : null;

  try {
    const listing =
      type === "Vehicle"
        ? await Vehicle.create({
            title,
            description,
            category,
            price,
            vehicleSpecs: parsedVehicleSpecs,
            owner_id,
            status: status || "pending",
            image_paths: imagePaths,
            needBroker
          })
        : await Property.create({
            title,
            description,
            category,
            price,
            location: parsedLocation,
            specifications: parsedSpecifications,
            image_paths: imagePaths,
            owner_id,
            status: status || "pending",
            needBroker
          });

    return res
      .status(201)
      .json({ message: "Listing created successfully", listing });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

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

    if (userType === "broker") {
      req.query.needBroker = "Yes"; // brokers only see listings that need brokers
      }


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
    if (userType === "broker") {
    filter.needBroker = "Yes";
  } else {
    // Clients: see self-managed OR broker-assigned listings
    filter.$or = [
      { needBroker: "No" },
      { needBroker: "false", is_broker_assigned: true }
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
export const fetchListingCount = async (req, res) => {
  const { id } = req.params;

  try {
    const [vehicles, property] = await Promise.all([
      Vehicle.countDocuments({ owner_id: id }),
      Property.countDocuments({ owner_id: id }),
    ]);

    return res
      .status(200)
      .json({ owner_id: id, vehicles, property, total: vehicles + property });
  } catch (err) {
    console.log("Error counting listings:", err);
    return res.status(500).json({ message: "Server Error" });
  }
};

export const verifyListing = async (req, res) => {
  const { id, status, type } = req.query;

  if (!id || !status || !type) {
    return res
      .status(400)
      .json({ message: "Required query parameters missing" });
  }

  // Capitalize first letter of type for case-insensitive comparison
  const normalizedType =
    type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
  if (!["Vehicle", "Property"].includes(normalizedType)) {
    return res.status(400).json({ message: "Invalid listing type" });
  }

  try {
    const model = normalizedType === "Vehicle" ? Vehicle : Property;

    const listing = await model.findById(id);
    if (!listing) {
      return res.status(404).json({ message: "Listing not found" });
    }

    listing.status = status;

    await listing.save();

    await CreateNotification({
      userId: listing.owner_id,
      type: "approved",
      listing_id: listing._id,
      listing_type: listing.type,
      message: "Your listing have been approved",
      status:"accepted"
    });
    const existingDeal = await Deal.findOne({
      listing_id: listing._id,
      listing_type: type,
    });
       if (!existingDeal) {
      await Deal.create({
  listing_id: listing._id,
  owner_id: listing.owner_id,
  broker_id:null,
  title: listing.title,
  listing_type: type,
  status: 'active',
  listing_snapshot: {
    title: listing.title,
    description: listing.description,
    price: listing.price,
    location: listing.location,
    images: listing.image_paths || listing.images || [],
  },
});
    }
    else{
      res.status(200).json({message:"deal already created"})
    }

    return res.status(200).json({
      message: `Listing ${status} successfully`,
      verified: status === "approved",
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server Error" });
  }
};

export const fetchListingById = async (req, res) => {
  const { id, type } = req.query;
  const normalizedType =
    type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
  if (!id || !type) {
    return res.status(400).json({ message: "Id or type missing" });
  }

  try {
    const model = normalizedType === "Vehicle" ? Vehicle : Property;
    const listing = await model
      .findById(id)
      .populate("broker_id", "firstName lastName email")
      .populate("owner_id", "firstName lastName email")
      .lean();
    console.log(listing);

    return res.status(200).json({ message: "Success", listing });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Server error" });
  }
};

export const SetListingToBroker = async (req, res) => {
  const { listingId, broker_id, type } = req.query;
  const { is_broker_assigned } = req.body;

  if (!listingId || !broker_id || !type) {
    return res.status(400).json({ message: "Missing required parameters" });
  }
  const normalizedType =
    type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
  try {
    const model = normalizedType === "Vehicle" ? Vehicle : Property;
    const listing = await model.findById(listingId);

    if (!listing) {
      return res.status(404).json({ message: "Listing not found" });
    }

    if (listing.broker_id && listing.broker_id.toString() !== broker_id) {
      return res
        .status(400)
        .json({ message: "Listing already assigned to another broker" });
    }

    listing.broker_id = broker_id ? broker_id : null;
    listing.is_broker_assigned = is_broker_assigned ? true : false;
    await listing.save();

    await CreateNotification({
      userId: listing.owner_id,
      type: "request",
      listingId: listing._id,
      listingType: listing.type,
      brokerId: broker_id, // add broker reference
      message: "A broker requested to be assigned to your listing.",
      link: `/broker-profile/${broker_id}`, // frontend redirect
      action_required: true,
      status: "pending",
    });
    return res.status(200).json({
      message: "Assignment request sent to the owner",
      listing,
    });
  } catch (error) {
    console.error("Error in SetListingToBroker:", error);
    return res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};

export const MyListings = async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ message: "Required field missing" });
  }

  try {
    const vehicles = await Vehicle.find({ owner_id: id })
      .lean()
      .populate("broker_id", "firstName lastName");
    const properties = await Property.find({ owner_id: id })
      .lean()
      .populate("broker_id", "firstName lastName");

    if (vehicles.length === 0 && properties.length === 0) {
      return res.status(404).json({ message: "No listings found" });
    }

    const listings = [...vehicles, ...properties];

    return res
      .status(200)
      .json({ message: "Listings retrieved successfully", listings });
  } catch (err) {
    console.error("Error fetching listings:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

export const getAssignedListings = async (req, res) => {
  const { brokerId, type, search, category, minPrice, maxPrice } = req.query;

  if (!brokerId || !type) {
    return res.status(400).json({ message: "Missing brokerId or type" });
  }

  try {
    const brokerObjectId = new mongoose.Types.ObjectId(brokerId);

    const filters = {
      broker_id: brokerObjectId,
      is_broker_assigned: true,
    };

    // Category filter
    if (category && category.toLowerCase() !== "all") {
      filters.category = category.toLowerCase();
    }

    // Price range filter
    if (minPrice != null || maxPrice != null) {
      filters.price = {};
      if (minPrice != null) filters.price.$gte = Number(minPrice);
      if (maxPrice != null) filters.price.$lte = Number(maxPrice);
    }

    // Search logic — we'll add it below using regex
    const searchQuery = search
      ? {
          $or: [
            { title: { $regex: search, $options: "i" } },
            { "location.city": { $regex: search, $options: "i" } },
            { "location.subcity": { $regex: search, $options: "i" } },
          ],
        }
      : {};

    // Handle 'all' type (fetch from both Vehicle and Property models)
    if (type.toLowerCase() === "all") {
      const [vehicles, properties] = await Promise.all([
        Vehicle.find({ ...filters, ...searchQuery })
        .populate("broker_id","firstName lastName"),
        Property.find({ ...filters, ...searchQuery })
        .populate("broker_id","firstName lastName"),
      ]);

      const allListings = [...vehicles, ...properties].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );

      return res.status(200).json(allListings);
    }

    // If specific type
    const normalizedType =
      type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();

    const model = normalizedType === "Vehicle" ? Vehicle : Property;

    const listings = await model
      .find({ ...filters, ...searchQuery })
      .sort({ createdAt: -1 });

    res.status(200).json(listings);
  } catch (error) {
    console.error("Error fetching assigned listings:", error);
    res.status(500).json({ message: "Server error" });
  }
};
export const AssignClientToDeal = async (req, res) => {
  const { listingId, broker_id, client_id, listingType } = req.body;

  // Required fields
  if (!listingId || !client_id || !listingType) {
    return res.status(400).json({ message: "Missing required parameters" });
  }

  try {
    // Determine model
    const ListingModel = listingType === "Property" ? Property : Vehicle;

    // Fetch listing to check needBroker & owner
    const listing = await ListingModel.findById(listingId)
      .select("needBroker owner_id")
      .lean();

    if (!listing) {
      return res.status(404).json({ message: "Listing not found" });
    }

    const needBroker = listing.needBroker === true || listing.needBroker === "Yes";

    // =================================================================
    // CASE 1: No Broker Needed (needBroker === "No" or false)
    // =================================================================
    if (!needBroker) {
      // Find existing deal (any kind: broker or no broker)
      let deal = await Deal.findOne({ listing_id: listingId });

      if (deal) {
        if (deal.client_id?.toString() === client_id) {
          return res.status(200).json({ message: "Client already connected", deal });
        }
        if (deal.client_id) {
          return res.status(400).json({ message: "Deal already assigned to another client" });
        }

        // Update existing deal
        deal.client_id = client_id;
        deal.status = "negotiating";
        await deal.save();
      } else {
        // Create new direct deal
        deal = await Deal.create({
          listing_id: listingId,
          listing_type: listingType,
          owner_id: listing.owner_id,
          client_id,
          broker_id: null,
          status: "negotiating",
        });
      }

      // Notify owner only
      await CreateNotification({
        userId: listing.owner_id,
        type: "client_assigned",
        listingId,
        listingType,
        message: "A client is now in contact about your listing.",
        clientId: client_id,
        status: "accepted",
      });

      return res
        .status(deal._id ? 201 : 200)
        .json({ message: "Direct contact established", deal });
    }

    // =================================================================
    // CASE 2: Broker Required (needBroker === true/"Yes")
    // =================================================================
    if (!broker_id) {
      return res
        .status(400)
        .json({ message: "Broker ID is required when needBroker is true" });
    }
    // Find the deal
    let deal = await Deal.findOne({ listing_id: listingId, broker_id });

    if (!deal) {
      return res
        .status(404)
        .json({ message: "No deal found for this listing and broker" });
    }

    // If already assigned, just return
    if (deal.client_id && deal.client_id.toString() !== client_id) {
      return res
        .status(400)
        // .json({ message: "Deal already assigned to another client" });
    }
    if (deal.client_id && deal.client_id.toString() === client_id) {
  return res.status(200).json({ message: "Client already assigned", deal });
}

    // Assign client
    deal.client_id = client_id;
    deal.status = "negotiating";
    await deal.save();

    
    await CreateNotification({
      userId: deal.broker_id,
      type: "client_assigned",
      listingId: listingId,
      listingType: deal.listing_type,
      message: "A client contacted you about this deal.",
      clientId:client_id,
      status:"accepted"
    });

    await CreateNotification({
      userId: deal.owner_id,
      type: "client_assigned",
      listingId: listingId,
      listingType: deal.listing_type,
      message: "A client is now in contact about your listing.",
      clientId:client_id,
      status:"accepted"
    });

    return res.status(200).json({
      message: "Client assigned to deal successfully",
      deal,
    });
  }
  catch (error) {
    console.error("Error in AssignClientToDeal:", error);
    return res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};

export const fetchListingByStatus = async (req, res) => {
  const { status } = req.query;

  if (!status) {
    return res.status(400).json({ message: "Required Fields missing" });
  }

  try {
    const [vehicle, property] = await Promise.all([
      Vehicle.countDocuments({ status: status }),
      Property.countDocuments({ status: status }),
    ]);

    return res
      .status(200)
      .json({ message: "Success", listing: vehicle + property });
  } catch (error) {
    console.log(err);
    return res.status(500).json({ message: "Server Error" });
  }
};

export const countApprovedListings = async (req, res) => {
  try {
    const { type = "all" } = req.query;

    let vehicleCount = 0;
    let propertyCount = 0;

    if (type === "vehicle" || type === "all") {
      vehicleCount = await Vehicle.countDocuments({ status: "approved" });
    }

    if (type === "property" || type === "all") {
      propertyCount = await Property.countDocuments({ status: "approved" });
    }

    const totalCount = vehicleCount + propertyCount;

    return res.status(200).json({
      message: "Approved listings count fetched successfully",
      counts: {
        vehicles: vehicleCount,
        properties: propertyCount,
        total: totalCount,
      },
    });
  } catch (err) {
    console.error("Error counting approved listings:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const SaveListing = async (req, res) => {
  const { listingId, userId, listingType } = req.body;

  // Validation
  if (!listingId || !userId || !listingType) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  if (
    !mongoose.Types.ObjectId.isValid(listingId) ||
    !mongoose.Types.ObjectId.isValid(userId)
  ) {
    return res.status(400).json({ message: "Invalid ID format" });
  }

  try {
    const user = await User.findById(userId);

    // Check if listing is already saved
    const index = user.saved.findIndex(
      (item) =>
        item.listingId.equals(listingId) &&
        item.listingType.toUpperCase() === listingType.toUpperCase()
    );

    let message = "";
    let isSaved = false;

    if (index > -1) {
      // Already saved → remove it
      user.saved.splice(index, 1);
      message = "Listing removed from saved listings";
      isSaved = false;
    } else {
      // Not saved → add it
      user.saved.push({ listingId, listingType });
      message = "Listing added to saved listings";
      isSaved = true;
    }

    await user.save();

    return res.status(200).json({
      message,
      isSaved, // ✅ here is your boolean
      saved: user.saved, // optional to return
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server Error" });
  }
};
