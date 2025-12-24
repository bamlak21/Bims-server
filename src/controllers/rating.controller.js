import { Rating } from "../models/rating.model.js";
import { User } from "../models/user.model.js";

export const createRating = async (req, res) => {
    try {
        const { revieweeId, rating, comment } = req.body;
        const reviewerId = req.user.id;

        if (!revieweeId || !rating) {
            return res.status(400).json({ message: "Reviewee and rating are required." });
        }

        if (reviewerId === revieweeId) {
            return res.status(400).json({ message: "You cannot rate yourself." });
        }

        // Only owners and clients can rate brokers
        if (req.user.userType !== 'owner' && req.user.userType !== 'client') {
            return res.status(403).json({ message: "Only owners and clients can rate brokers." });
        }

        // Check if reviewee exists and is a broker (optional, but good practice)
        const reviewee = await User.findById(revieweeId);
        if (!reviewee) {
            return res.status(404).json({ message: "Broker not found." });
        }
        // Optional: Enforce that only brokers can be rated
        // if (reviewee.userType !== 'broker') { ... }

        // Create the rating
        const newRating = await Rating.create({
            reviewer: reviewerId,
            reviewee: revieweeId,
            rating: Number(rating),
            comment,
        });

        // Update Broker's average rating
        // We recalculate to be safe.
        const stats = await Rating.aggregate([
            { $match: { reviewee: reviewee._id } },
            {
                $group: {
                    _id: "$reviewee",
                    avgRating: { $avg: "$rating" },
                    count: { $sum: 1 },
                },
            },
        ]);

        if (stats.length > 0) {
            reviewee.averageRating = stats[0].avgRating;
            reviewee.ratingCount = stats[0].count;
            await reviewee.save();
        }

        return res.status(201).json({ message: "Rating submitted successfully.", rating: newRating });
    } catch (error) {
        console.error("Error creating rating:", error);
        return res.status(500).json({ message: "Server error." });
    }
};

export const getBrokerRatings = async (req, res) => {
    try {
        const { brokerId } = req.params;

        const ratings = await Rating.find({ reviewee: brokerId })
            .populate("reviewer", "firstName lastName photo")
            .sort({ createdAt: -1 });

        return res.status(200).json(ratings);
    } catch (error) {
        console.error("Error fetching ratings:", error);
        return res.status(500).json({ message: "Server error." });
    }
};
