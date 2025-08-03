import { User } from "../models/user.model.js";
import { Admin } from "../models/admin.model.js";
import { createToken } from "../utils/jwtUtils.js";
import bcrypt from "bcrypt";

export const Register = async (req, res) => {
  const { firstName, lastName, email, userType, phoneNumber, password } =
    req.body;

  if (
    !firstName ||
    !lastName ||
    !email ||
    !userType ||
    !phoneNumber ||
    !password
  ) {
    return res.status(403).json({ message: "Missing required fields!" });
  }

  try {
    const userWithPhoneNumber = await User.findOne({ phoneNumber });
    if (userWithPhoneNumber) {
      res.status(405).json({ message: "Phone number already in use" });
      return;
    }

    const userWithEmail = await User.findOne({ email });
    if (userWithEmail) {
      res.status(405).json({ message: "Email already in use" });
      return;
    }

    const namePattern = /^[A-Za-z\s]+$/;
    if (!namePattern.test(firstName) || !namePattern.test(lastName)) {
      res.status(405).json({ message: "use proper name" });
      return;
    }
    const hashedPass = await bcrypt.hash(password, 10);

    const newUser = new User({
      firstName,
      lastName,
      email,
      userType,
      phoneNumber,
      password: hashedPass,
      verified: false,
      last_login: null,
    });

    if (userType === "broker") {
      if (!req.file) {
        return res
          .status(400)
          .json({ message: "Document file required for brokers" });
      }

      // Set document info
      newUser.document = req.file.path.replace(/\\/g, "/");

      newUser.documentVerification = {
        status: "pending",
        reviewedBy: null,
        notes: "",
        reviewedAt: null,
      };
    }

    await newUser.save();

    const token = createToken(newUser);

    return res.status(201).json({
      message: "Account created successfully",
      token,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server Error, try again" });
  }
};

export const Login = async (req, res) => {
  const { phoneNumber, email, password } = req.body;

  if (!password || (!phoneNumber && !email)) {
    return res.status(400).json({ message: "Missing Required fields" });
  }

  try {
    const user = await User.findOne({
      $or: [
        phoneNumber ? { phoneNumber } : null,
        email ? { email } : null,
      ].filter(Boolean),
    });

    if (!user) {
      return res.status(404).json({ message: "User not Found" });
    }

    if (!user.isActive) {
      return res
        .status(404)
        .json({ message: "Account is deactivated. contact support" });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(403).json({ message: "Invalid Credentials" });
    }

    const token = createToken(user);

    return res.status(200).json({
      message: "user logged in",
      phoneNumber: user.phoneNumber,
      token: token,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const AdminLogin = async (req, res) => {
  const { email, password } = req.body;

  if (!password || !email) {
    return res.status(400).json({ message: "Missing Required fields" });
  }

  try {
    const admin = await Admin.findOne({ email });

    if (!admin) {
      return res.status(404).json({ message: "Unauthorized User Found" });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(403).json({ message: "Invalid Credentials" });
    }

    const token = createToken(admin);

    return res.status(200).json({
      message: "admin logged in",
      email: admin.email,
      token: token,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
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

export const verifyUser = async (req, res) => {
  const { id } = req.params;
  const { verified, reviewedBy } = req.body;

  try {
    const updatedUser = await User.findByIdAndUpdate(
      id,
      {
        verified,
        documentVerification: {
          status: verified ? "approved" : "rejected",
          reviewedBy,
          reviewedAt: new Date(),
        },
      },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json(updatedUser);
  } catch (error) {
    console.error("Error verifying user:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// export const getCurrentUserProfile = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const user = await User.findById(id).select(
//       "firstName lastName email phoneNumber userType verified createdAt"
//     );

//     if (!user) return res.status(404).json({ message: "User not found" });

//     res.status(200).json(user);
//   } catch (err) {
//     console.error("Error in /me route:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// };

// export const getCurrentUserProfile = async (req, res) => {
//   try {
//     const authHeader = req.headers.authorization;

//     // Check for presence of Authorization header
//     if (!authHeader || !authHeader.startsWith('Bearer ')) {
//       return res.status(401).json({ message: 'Authorization token missing or malformed' });
//     }

//     const token = authHeader.split(' ')[1];

//     // Verify token using utility
//     const decoded = verifyToken(token);

//     if (!decoded || !decoded.id) {
//       return res.status(401).json({ message: 'Invalid or expired token' });
//     }

//     // Find user by ID from decoded token
//     const user = await User.findById(decoded.id).select('-password'); // Exclude password

//     if (!user) {
//       return res.status(404).json({ message: 'User not found' });
//     }

//     return res.status(200).json(user);
//   } catch (error) {
//     console.error('Error fetching current user:', error);
//     return res.status(500).json({ message: 'Internal Server Error' });
//   }
// };

// export const getVerifiedBrokers = async (req, res) => {
//        try {
//          const brokers = await User.find({ userType: 'broker', verified: true }).select('_id firstName lastName email');
//          res.json(brokers);
//        } catch (err) {
//          console.error('Error fetching brokers:', err);
//          res.status(500).json({ message: 'Internal Server Error' });
//        }
//      }

// export const submitListing = async (req, res) => {
//        try {
//          const {
//            title, description, type, category, price, currency, location,
//            features, specifications, vehicle_specs, broker_id, owner_id,
//            owner_name, owner_email
//          } = req.body;

//          const listing = new Listings({
//            title,
//            description,
//            type,
//            category,
//            price,
//            currency,
//            location,
//            features,
//            specifications: type === 'property' ? specifications : {},
//            vehicle_specs: type === 'vehicle' ? vehicle_specs : {},
//            broker_id,
//            owner_id,
//            owner_name,
//            owner_email,
//            status: 'pending',
//            needs_broker: true,
//            views: 0,
//            inquiries: 0
//          });

//          await listing.save();
//          res.status(201).json({ message: 'Listing submitted successfully' });
//        } catch (err) {
//          console.error('Error submitting listing:', err);
//          res.status(400).json({ message: 'Failed to submit listing', error: err.message });
//        }
//      };

//   export const updateUserProfile = async (req, res) => {
//        try {
//          const { id } = req.params;
//          const updates = req.body;
//          const user = await User.findByIdAndUpdate(id, updates, { new: true });
//          if (!user) {
//            return res.status(404).json({ message: 'User not found' });
//          }
//          res.json(user);
//        } catch (err) {
//          console.error('Error updating user profile:', err);
//          res.status(500).json({ message: 'Internal Server Error', error: err.message });
//        }
//      };
// export const GetListings = async (req, res) => {
//   const { userId, role } = req.query;

//   try {
//     let listings = [];

//     if (role === "broker") {
//       listings = await listings.find({ brokerId: userId });
//     } else if (role === "owner") {
//       // Replace this if owners are associated differently
//       listings = await listings.find({ ownerId: userId });
//     } else if (role === "admin") {
//       listings = await Listing.find({});
//     } else {
//       return res.status(403).json({ message: "Unauthorized Role" });
//     }

//     return res.status(200).json(listings);
//   } catch (error) {
//     console.error("Failed to get listings:", error);
//     return res.status(500).json({ message: "Error fetching listings" });
//   }
// };
