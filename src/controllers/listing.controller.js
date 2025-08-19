import { Property } from "../models/property.model.js";
import { Vehicle } from "../models/vechicle.model.js";

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
    type === "vehicle" &&
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
    type === "property" &&
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
      type === "vehicle"
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
    const { type = "all", page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;
    const pagination = { page: Number(page), limit: Number(limit) };

    const fetchData = (Model, type) =>
      Model.find()
        .populate("owner_id", "firstName lastName")
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

    if (type === "vehicle" || type === "all") {
      vehicles = await fetchData(Vehicle, "vehicle");
    }

    if (type === "property" || type === "all") {
      properties = await fetchData(Property, "property");
    }

    // Combine and sort
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
  const reason = req.body ? req.body.reason : null;

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

  if (!["approved", "rejected"].includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  if (status === "rejected" && !reason) {
    return res.status(400).json({ message: "Rejection reason is required" });
  }

  try {
    const model = normalizedType === "Vehicle" ? Vehicle : Property;

    const listing = await model.findById(id);
    if (!listing) {
      return res.status(404).json({ message: "Listing not found" });
    }

    listing.status = status;
    listing.rejection_reason = status === "rejected" ? reason : null;
    await listing.save();

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
  if (!id || !type) {
    return res.status(400).json({ message: "Id or type missing" });
  }

  try {
    const model = type === "vehicle" ? Vehicle : Property;
    const listing = await model.findById(id);
    console.log(listing);

    return res.status(200).json({ message: "Success", listing });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Server error" });
  }
};

export const SetListingToBroker = async (req, res) => {
  const { listingId, broker_id, type } = req.query;

  if (!listingId || !broker_id || !type) {
    return res
      .status(400)
      .json({ message: "Listing Id, broker_id, and type are required" });
  }

  if (type !== "vehicle" && type !== "property") {
    return res
      .status(400)
      .json({ message: "Type must be 'vehicle' or 'property'" });
  }
  try {
    const model = type === "vehicle" ? Vehicle : Property;
    const listing = await model.findById(listingId);
    if (!listing) return res.status(400).json({ message: "Listing not found" });

    listing.broker_id = broker_id;
    listing.is_broker_assigned = true;

    await listing.save();

    return res
      .status(200)
      .json({ message: "Listing assigned to broker successfully", listing });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Server error" });
  }
};

export const MyListings = async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ message: "Required field missing" });
  }

  try {
    const vehicles = await Vehicle.find({ owner_id: id }).lean();
    const properties = await Property.find({ owner_id: id }).lean();

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
