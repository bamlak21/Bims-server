import { Property } from "../models/property.model.js";
import { Vehicle } from "../models/vechicle.model.js";

export const CreateListing = async (req, res) => {
  const {
    type,
    title,
    description,
    category,
    price,
    make,
    model,
    year,
    mileage,
    transmission,
    fuelType,
    condition,
    owner_id,
    status,
    location,
    specifications,
    rejection_reason,
  } = req.body;

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
      !make ||
      !model ||
      !year ||
      !mileage ||
      !transmission ||
      !fuelType ||
      !condition ||
      !owner_id ||
      !status)
  ) {
    return res.status(400).json({ message: "Missing required vehicle fields" });
  }

  if (
    type !== "vehicle" &&
    (!title ||
      !description ||
      !category ||
      !price ||
      !specifications ||
      !condition ||
      !owner_id ||
      !status ||
      !location)
  ) {
    return res
      .status(400)
      .json({ message: "Missing required property fields" });
  }

  const imagePaths = req.files.map((file) => file.path.replace(/\\/g, "/"));
  const formattedLocation = location
    ? {
        city: location.city,
        subcity: location.subcity,
        woreda: location.woreda,
        address: location.address,
      }
    : null;
  const formattedSpecifications = specifications
    ? {
        bedrooms: specifications.bedrooms,
        bathrooms: specifications.bathrooms,
        area: specifications.area,
        yearBuilt: specifications.yearBuilt,
        condition: specifications.condition,
        swimmingPool: specifications.swimmingPool,
      }
    : null;

  try {
    const listing =
      type === "vehicle"
        ? await Vehicle.create({
            title,
            description,
            category,
            price,
            make,
            model,
            year,
            mileage,
            transmission,
            fuelType,
            condition,
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
            specifications: formattedSpecifications,
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

    let vehicle = [];
    let property = [];

    if (!type || type === "vehicle") {
      vehicle = await Vehicle.find()
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean();
    }

    if (!type || type === "property") {
      property = await Property.find()
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean();
    }

    return res.status(200).json({
      message: "Listings fetched successfully",
      vehicle,
      property,
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
    const count = await Listings.countDocuments({ broker_id: id });
    res.json({ broker_id: id, count });
  } catch (err) {
    console.error("Error counting listings:", err);
    res.status(500).json({ message: "Internal Server Error" });
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
