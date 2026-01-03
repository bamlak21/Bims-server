import mongoose from "mongoose";
import dotenv from "dotenv";
import { Property } from "./src/models/property.model.js";
import { Vehicle } from "./src/models/vehicle.model.js";
import { cleanupExpiredVerificationAssignments } from "./src/services/verificationService.js";
import { Admin } from "./src/models/admin.model.js";

dotenv.config();

const testDeadline = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URL);
        console.log("Connected to MongoDB for testing...");

        // 1. Ensure an Admin exists for notifications
        let admin = await Admin.findOne();
        if (!admin) {
            console.log("No admin found, creating a test admin...");
            admin = await Admin.create({
                name: "Test Admin",
                email: "testadmin@example.com",
                password: "password123"
            });
        }

        // 2. Create a dummy expired listing
        console.log("Creating expired test listing...");
        const expiredListing = await Property.create({
            title: "Test Expired Property",
            description: "This property assignment has expired",
            category: "Apartment",
            price: 1000,
            owner_id: new mongoose.Types.ObjectId(), // dummy owner
            status: "assigned",
            assignedVerifier: new mongoose.Types.ObjectId(), // dummy broker
            assignedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
            verificationDeadline: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago (expired)
            needBroker: "No"
        });

        console.log(`Created expired listing: ${expiredListing._id}`);

        // 3. Run cleanup
        console.log("Running cleanup job...");
        await cleanupExpiredVerificationAssignments();

        // 4. Verify results
        const updatedListing = await Property.findById(expiredListing._id);
        if (updatedListing.status === "pending" && updatedListing.assignedVerifier === null) {
            console.log("SUCCESS: Listing was correctly reset to pending.");
        } else {
            console.error("FAILURE: Listing was not reset correctly.", updatedListing.status);
        }

        // 5. Cleanup test data
        await Property.deleteOne({ _id: expiredListing._id });
        // Keep the admin for now or delete if it was created just for this
        console.log("Test data cleaned up.");

        await mongoose.connection.close();
    } catch (error) {
        console.error("Test failed:", error);
        process.exit(1);
    }
};

testDeadline();
