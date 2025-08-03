import mongoose from "mongoose";
import dotenv from "dotenv";
import { Listings } from "./models/listings.model.js";
dotenv.config({path:'../.env'});

const sampleListings = [
  {
    _id: new mongoose.Types.ObjectId(),
    title: "Cozy Apartment in Addis Ababa",
    description: "A modern 2-bedroom apartment in the heart of the city.",
    type: "property",
    category: "Apartment",
    price: mongoose.Types.Decimal128.fromString("2500000"),
    currency: "ETB",
    location: { city: "Addis Ababa", region: "Addis Ababa" },
    images: ["https://example.com/images/apartment1.jpg"],
    image_paths: ["/uploads/apartment1.jpg"],
    features: ["2 Bedrooms", "1 Bathroom", "Balcony"],
    specifications: { bedrooms: 2, bathrooms: 1, area: "80 sqm" },
    broker_id: new mongoose.Types.ObjectId(),
    broker_name: "John Doe",
    broker_email: "john@example.com",
    owner_id: new mongoose.Types.ObjectId(),
    owner_name: "Jane Smith",
    owner_email: "jane@example.com",
    status: "approved",
    needs_broker: true,
    views: 120,
    inquiries: 15,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: new mongoose.Types.ObjectId(),
    title: "Spacious House in Bole",
    description: "A luxurious 4-bedroom house with a large garden.",
    type: "property",
    category: "house",
    price: mongoose.Types.Decimal128.fromString("4500000"),
    currency: "ETB",
    location: { city: "Addis Ababa", region: "Bole" },
    images: ["https://example.com/images/house1.jpg"],
    image_paths: ["/uploads/house1.jpg"],
    features: ["4 Bedrooms", "3 Bathrooms", "Garden", "Garage"],
    specifications: { bedrooms: 4, bathrooms: 3, area: "200 sqm" },
    broker_id: new mongoose.Types.ObjectId(),
    broker_name: "Alice Brown",
    broker_email: "alice@example.com",
    owner_id: new mongoose.Types.ObjectId(),
    owner_name: "Bob Wilson",
    owner_email: "bob@example.com",
    status: "approved",
    needs_broker: false,
    views: 200,
    inquiries: 25,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: new mongoose.Types.ObjectId(),
    title: "Toyota Corolla 2020",
    description: "Well-maintained sedan with low mileage.",
    type: "vehicle",
    category: "sedan",
    price: mongoose.Types.Decimal128.fromString("1200000"),
    currency: "ETB",
    location: { city: "Addis Ababa", region: "Kirkos" },
    images: ["https://example.com/images/corolla1.jpg"],
    image_paths: ["/uploads/corolla1.jpg"],
    features: ["Automatic", "Low Mileage", "Air Conditioning"],
    vehicle_specs: { make: "Toyota", model: "Corolla", year: 2020, mileage: "15000 km" },
    broker_id: new mongoose.Types.ObjectId(),
    broker_name: "Mike Johnson",
    broker_email: "mike@example.com",
    owner_id: new mongoose.Types.ObjectId(),
    owner_name: "Sarah Lee",
    owner_email: "sarah@example.com",
    status: "approved",
    needs_broker: true,
    views: 80,
    inquiries: 10,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: new mongoose.Types.ObjectId(),
    title: "Commercial Office Space",
    description: "Prime office space in the business district.",
    type: "property",
    category: "commercial",
    price: mongoose.Types.Decimal128.fromString("6000000"),
    currency: "ETB",
    location: { city: "Addis Ababa", region: "Kazanchis" },
    images: ["https://example.com/images/office1.jpg"],
    image_paths: ["/uploads/office1.jpg"],
    features: ["Open Plan", "Parking", "High-Speed Internet"],
    specifications: { area: "150 sqm", parking: "2 spaces" },
    broker_id: new mongoose.Types.ObjectId(),
    broker_name: "Emma Davis",
    broker_email: "emma@example.com",
    owner_id: new mongoose.Types.ObjectId(),
    owner_name: "David Clark",
    owner_email: "david@example.com",
    status: "pending",
    needs_broker: true,
    views: 150,
    inquiries: 20,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: new mongoose.Types.ObjectId(),
    title: "Hyundai Tucson 2021",
    description: "Reliable SUV with modern features.",
    type: "vehicle",
    category: "suv",
    price: mongoose.Types.Decimal128.fromString("2000000"),
    currency: "ETB",
    location: { city: "Addis Ababa", region: "Yeka" },
    images: ["https://example.com/images/tucson1.jpg"],
    image_paths: ["/uploads/tucson1.jpg"],
    features: ["4WD", "Sunroof", "Backup Camera"],
    vehicle_specs: { make: "Hyundai", model: "Tucson", year: 2021, mileage: "20000 km" },
    broker_id: new mongoose.Types.ObjectId(),
    broker_name: "Chris Evans",
    broker_email: "chris@example.com",
    owner_id: new mongoose.Types.ObjectId(),
    owner_name: "Lisa Taylor",
    owner_email: "lisa@example.com",
    status: "approved",
    needs_broker: false,
    views: 90,
    inquiries: 12,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: new mongoose.Types.ObjectId(),
    title: "Modern Condo in Bole",
    description: "Newly built condo with great amenities.",
    type: "property",
    category: "Apartment",
    price: mongoose.Types.Decimal128.fromString("3000000"),
    currency: "ETB",
    location: { city: "Addis Ababa", region: "Bole" },
    images: ["https://example.com/images/condo1.jpg"],
    image_paths: ["/uploads/condo1.jpg"],
    features: ["3 Bedrooms", "2 Bathrooms", "Gym Access"],
    specifications: { bedrooms: 3, bathrooms: 2, area: "120 sqm" },
    broker_id: new mongoose.Types.ObjectId(),
    broker_name: "Sophie Turner",
    broker_email: "sophie@example.com",
    owner_id: new mongoose.Types.ObjectId(),
    owner_name: "Mark Green",
    owner_email: "mark@example.com",
    status: "approved",
    needs_broker: true,
    views: 110,
    inquiries: 18,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: new mongoose.Types.ObjectId(),
    title: "Nissan Rogue 2019",
    description: "Spacious SUV with excellent condition.",
    type: "vehicle",
    category: "suv",
    price: mongoose.Types.Decimal128.fromString("1800000"),
    currency: "ETB",
    location: { city: "Addis Ababa", region: "Lideta" },
    images: ["https://example.com/images/rogue1.jpg"],
    image_paths: ["/uploads/rogue1.jpg"],
    features: ["All-Wheel Drive", "Navigation", "Heated Seats"],
    vehicle_specs: { make: "Nissan", model: "Rogue", year: 2019, mileage: "30000 km" },
    broker_id: new mongoose.Types.ObjectId(),
    broker_name: "Tom Harris",
    broker_email: "tom@example.com",
    owner_id: new mongoose.Types.ObjectId(),
    owner_name: "Emily White",
    owner_email: "emily@example.com",
    status: "approved",
    needs_broker: true,
    views: 95,
    inquiries: 14,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

async function createSampleListings() {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    // Clear existing listings (optional, remove if you don't want to delete existing data)
    // await Listings.deleteMany({});
    // Insert all sample listings
    const insertedListings = await Listings.insertMany(sampleListings);
    console.log(`Successfully inserted ${insertedListings.length} listings`);
    process.exit(0);
  } catch (error) {
    console.error("Error creating sample listings:", error);
    process.exit(1);
  }
}

createSampleListings().catch(error=>{
    console.error('Error creating listing:',error)
    process.exit(1);
})