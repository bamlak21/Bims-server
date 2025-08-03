import { User } from "../models/user.model.js";

export const getUserStats = async (req, res) => {
  try {
    // Select only the necessary fields for performance
    const users = await User.find({}, "userType documentVerification.status");

    const stats = {
      totalUsers: users.length,
      pendingBrokers: 0,
      verifiedBrokers: 0,
      totalClients: 0,
      totalOwners: 0,
    };

    users.forEach((user) => {
      const { userType, documentVerification } = user;

      switch (userType) {
        case "broker":
          if (documentVerification?.status === "approved") {
            stats.verifiedBrokers++;
          } else {
            stats.pendingBrokers++;
          }
          break;
        case "client":
          stats.totalClients++;
          break;
        case "owner":
          stats.totalOwners++;
          break;
        default:
          break;
      }
    });

    return res.status(200).json(stats);
  } catch (error) {
    console.error("Error fetching stats:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const { search = "", role = "all", verification = "all" } = req.query;

    // Build the filter object
    const filter = {};

    if (role !== "all") {
      filter.userType = role;
    }

    if (verification !== "all") {
      filter.verified = verification === "verified";
    }

    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const users = await User.find(
      filter,
      "firstName lastName email phoneNumber userType verified createdAt documentVerification"
    );

    return res.status(200).json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const getCurrentUserProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select(
      "firstName lastName email phoneNumber userType verified createdAt"
    );

    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json(user);
  } catch (err) {
    console.error("Error in /me route:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const UpdateUserProfile = async (req, res) => {
  const { id, firstName, lastName, email, phoneNumber, socialLinks } = req.body;

  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update only if the fields are provided (not empty or undefined)
    if (firstName && firstName.trim() !== "") user.firstName = firstName;
    if (lastName && lastName.trim() !== "") user.lastName = lastName;
    if (email && email.trim() !== "") user.email = email;
    if (phoneNumber && phoneNumber.trim() !== "")
      user.phoneNumber = phoneNumber;
    if (socialLinks && typeof socialLinks === "object")
      user.socialLinks = socialLinks;
    if (req.file) {
      user.profileImage = req.file.path.replace(/\\/g, "/");
    }

    await user.save();

    return res
      .status(200)
      .json({ message: "Profile updated successfully", user });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Server Error" });
  }
};

export const fetchAllUsers = async (req, res) => {
  try {
    const users = await User.find(); // Adjust this line as needed
    res.json(users);
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const deactivateUser = async (req, res) => {
  const { id } = req.params;
  const { isActive } = req.body;

  try {
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { isActive },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res
      .status(200)
      .json({ message: "User deactivated successfully", user: updatedUser });
  } catch (error) {
    console.error("Error deactivating user:", error);
    res.status(500).json({ message: "Server error while deactivating user" });
  }
};
