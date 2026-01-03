import { Property } from "../models/property.model.js";
import { Vehicle } from "../models/vehicle.model.js";
import { CreateNotification } from "./notificationService.js";
import { Admin } from "../models/admin.model.js";

/**
 * Resets listings that have passed their verification deadline.
 */
export const cleanupExpiredVerificationAssignments = async () => {
    try {
        const now = new Date();
        const filter = {
            status: "assigned",
            verificationDeadline: { $lte: now },
        };

        const expiredProperties = await Property.find(filter);
        const expiredVehicles = await Vehicle.find(filter);

        const allExpired = [...expiredProperties, ...expiredVehicles];

        if (allExpired.length === 0) return;

        console.log(`[Verification Cleanup] Found ${allExpired.length} expired assignments.`);

        // Get all admins to notify them
        const admins = await Admin.find({}, "_id");

        for (const listing of allExpired) {
            const type = listing.type || (listing.vehicleSpecs ? "Vehicle" : "Property");
            const model = type === "Vehicle" ? Vehicle : Property;

            // Reset listing
            listing.status = "pending";
            listing.assignedVerifier = null;
            listing.assignedAt = null;
            listing.verificationDeadline = null;
            await listing.save();

            // Notify admins
            for (const admin of admins) {
                await CreateNotification({
                    userId: admin._id,
                    type: "broker_assignment_expired",
                    listingId: listing._id,
                    listingType: type,
                    message: `Broker response deadline expired for listing: "${listing.title}". Broker removed and listing moved back to pending.`,
                    status: "accepted"
                });
            }
        }
    } catch (error) {
        console.error("[Verification Cleanup Error]:", error);
    }
};

/**
 * Starts a periodic interval to clean up expired assignments.
 * Runs once an hour.
 */
export const startVerificationCleanupJob = () => {
    console.log("[Verification Cleanup] Starting background job (every 1 hour).");
    // Run immediately on start
    cleanupExpiredVerificationAssignments();
    // Then run every hour
    setInterval(cleanupExpiredVerificationAssignments, 60 * 60 * 1000);
};
