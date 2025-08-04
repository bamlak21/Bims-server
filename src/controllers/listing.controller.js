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
            status,
            image_paths: imagePaths,
          })
        : await Property.create({
            title,
            description,
            category,
            price,
            location: formattedLocation,
            specifications: parsedSpecifications,
            image_paths: imagePaths,
            owner_id,
            status,
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
    const { type, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    // If type is specified, return only that type
    if (type === "vehicle") {
      const vehicle = await Vehicle.find()
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean();

      return res.status(200).json({
        message: "Vehicle listings fetched successfully",
        listings: vehicle,
        pagination: { page: Number(page), limit: Number(limit) },
      });
    }

    if (type === "property") {
      const property = await Property.find()
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean();

      return res.status(200).json({
        message: "Property listings fetched successfully",
        listings: property,
        pagination: { page: Number(page), limit: Number(limit) },
      });
    }

    // If no type is specified, fetch both and combine
    const vehicle = await Vehicle.find()
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean();

    const property = await Property.find()
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean();

    // Combine both and sort by created_at
    const listings = [
      ...vehicle.map((v) => ({ ...v, listingType: "vehicle" })),
      ...property.map((p) => ({ ...p, listingType: "property" })),
    ];

    listings.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    return res.status(200).json({
      message: "Listings fetched successfully",
      listings,
      pagination: { page: Number(page), limit: Number(limit) },
    });
  } catch (err) {
    console.error("Error fetching listings:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const fetchListingCount = async (req, res) => {
  const { id } = req.params;

  try {
    const [vehicles, property] = Promise.all([
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

  try {
    if (type === "vehicle") {
      const updateVehicle = await Vehicle.findByIdAndUpdate(
        id,
        { status },
        { new: true }
      );

      if (!updateVehicle) {
        return res.status(404).json({ message: "Vehicle not found" });
      }
      return res
        .status(200)
        .json({ message: "Item Verified", vehicle: updatedList.lean() });
    }
  } catch (error) {
    console.error("Error verifying list:", error);
    return res.status(500).json({ message: "Server error" });
  }
};
