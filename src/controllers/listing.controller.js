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
      !status)
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
      !location)
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

    const userId = req.user?.id; // assuming you set user in auth middleware
    const skip = (page - 1) * limit;
    const pagination = { page: Number(page), limit: Number(limit) };

    const buildFilter = (type) => {
      const filter = {};
      if (minPrice || maxPrice) {
        filter.price = {};
        if (minPrice) filter.price.$gte = Number(minPrice);
        if (maxPrice) filter.price.$lte = Number(maxPrice);
      }
      if (category && category !== "all") {
        filter.category = category;
      }
      if (search) {
        const regex = new RegExp(search, "i");
        if (type === "property") {
          filter.$or = [
            { title: regex },
            { "location.city": regex },
            { "location.subcity": regex },
          ];
        } else if (type === "vehicle") {
          filter.$or = [{ title: regex }];
        }
      }
      return filter;
    };

    const fetchData = (Model, type) =>
      Model.find(buildFilter(type))
        .populate("owner_id", "firstName lastName")
        .populate("broker_id", "firstName lastName")
        .sort({ created_at: -1 })
        .lean()
        .then((data) =>
          data.map((item) => ({
            ...item,
            owner: item.owner_id
              ? {
                  firstName: item.owner_id.firstName,
                  lastName: item.owner_id.lastName,
                }
              : null,
            type,
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
      pagination: { ...pagination, totalItems, totalPages },
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
    });

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
  const { brokerId, type } = req.query;

  if (!brokerId || !type) {
    return res.status(400).json({ message: "Missing brokerId or type" });
  }
  const normalizedType =
    type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();

  try {
    const model = normalizedType === "Vehicle" ? Vehicle : Property;

    const listings = await model
      .find({
        broker_id: brokerId,
        is_broker_assigned: true,
      })
      .sort({ createdAt: -1 });

    res.status(200).json(listings);
  } catch (error) {
    console.error("Error fetching assigned listings:", error);
    res.status(500).json({ message: "Server error" });
  }
};
export const AssignClientToDeal = async (req, res) => {
  const { listingId, broker_id, client_id } = req.body;

  if (!listingId || !broker_id || !client_id) {
    return res.status(400).json({ message: "Missing required parameters" });
  }

  try {
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
        .json({ message: "Deal already assigned to another client" });
    }

    // Assign client
    deal.client_id = client_id;
    deal.status = "negotiating";
    await deal.save();

    // Optional: create first message
    // await Message.create({
    //   deal_id: deal._id,
    //   sender: client_id,
    //   content: "Hi, I’m interested in this listing",
    // });

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
  } catch (error) {
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
