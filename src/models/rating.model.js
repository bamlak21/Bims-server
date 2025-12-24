import mongoose, { Schema } from "mongoose";

const RatingSchema = new Schema(
    {
        reviewer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        reviewee: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5,
        },
        comment: {
            type: String,
            default: "",
        },
    },
    { timestamps: true }
);

export const Rating = mongoose.model("Rating", RatingSchema);
