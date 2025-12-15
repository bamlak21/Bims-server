import { User } from "../models/user.model.js";
import { Admin } from "../models/admin.model.js";
import { createToken } from "../utils/jwtUtils.js";
import { createAdminToken } from "../utils/jwtUtils.js";
import bcrypt from "bcrypt";
import { sendOtpemail } from "../utils/OTP.js";
import { CreateNotification } from "../services/notificationService.js";
import { sendOtpSMS } from "../utils/SMS-OTP.js";

export const Register = async (req, res) => {
  const { firstName, lastName, email, userType, phoneNumber, password } = req.body;

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
      // Check if banned
      if (userWithPhoneNumber.isBanned) {
        return res.status(403).json({ message: "This phone number is banned and cannot register." });
      }
      res.status(405).json({ message: "Phone number already in use" });
      return;
    }

    const userWithEmail = await User.findOne({ email });
    if (userWithEmail) {
      // Check if banned
      if (userWithEmail.isBanned) {
        return res.status(403).json({ message: "This email is banned and cannot register." });
      }
      res.status(405).json({ message: "Email already in use" });
      return;
    }

    const isValidEmail = (email) => /^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(email);
    if (!isValidEmail(email)) {
      res.status(405).json({ message: "invalid email format" })
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
      last_login: null,
    });

    if (userType === "broker") {
      newUser.verified = false;
      await newUser.save();
      await CreateNotification({
        userId: newUser._id,
        type: "verification",
        message:
          "welcome, Account going through verification. We will notify you when it's done.",
      });
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
    await CreateNotification({
      userId: newUser._id,
      type: "new_user",
      message: "Welcome to Bims, Browse around to use.",
    });
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
    if (user.isBanned) {
      return res.status(404).json({ message: `Account is banned. Reason: ${user.banReason})`, data: { isBanned: true } });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(403).json({ message: "Invalid Credentials" });
    }
    user.loginLast = new Date()
    await user.save();

    const token = createToken(user);
    return res.status(200).json({
      message: "user logged in",
      data: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        photo: user.photo,
        userType: user.userType,
      },
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

    const token = createAdminToken(admin);

    return res.status(200).json({
      message: "admin logged in",
      email: admin.email,
      name: admin.name,
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
    await CreateNotification({
      userId: updatedUser._id,
      type: "approved_account",
      message: verified
        ? "Your account verified successfully."
        : "Your account verification has been rejected.",
      status: verified ? "accepted" : "declined"
    });

    return res.status(200).json(updatedUser);
  } catch (error) {
    console.error("Error verifying user:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// export const ForgotPassword = async (req, res) => {
//   const { phoneNumber, newPassword } = req.body;

//   if (!phoneNumber || !newPassword) {
//     return res.status(500).json({ message: "Required Fields missing" });
//   }

//   try {
//     const user = await User.findOne({ phoneNumber });
//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     const newHash = await bcrypt.hash(newPassword, 10);

//     user.password = newHash;
//     await user.save();

//     return res.status(200).json({ message: "Password updated successfully" });
//   } catch (error) {
//     console.error("Error while processing forgot password: ", error);
//     return res.status(500).json({ message: "Server Error" });
//   }
// };

export const forgotPassword = async (req, res) => {
  const { email, phoneNumber } = req.body;

  try {
    let user = await User.findOne(email ? { email } : { phoneNumber });
    let isUser = true;

    // If no user found, check if it's an admin (email only)
    if (!user && email) {
      user = await Admin.findOne({ email });
      isUser = false;
    }

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    let otp;
    let method;

    // Generate and send OTP
    if (email) {
      const receiverEmail = user.email;
      otp = await sendOtpemail(receiverEmail);
      method = 'Email';
    } else {
      const receiverPhone = user.phoneNumber;
      otp = await sendOtpSMS(receiverPhone);
      method = 'SMS';
    }

    // Save OTP and expiry (5 minutes from now)
    user.otp = otp;
    user.otpExpiry = Date.now() + 5 * 60 * 1000;
    await user.save();

    return res.status(200).json({
      message: `OTP sent to via ${method}`,
      userId: user._id,
      userType: isUser ? 'user' : 'admin'
    });
  } catch (error) {
    console.error("Error in forgot password:", error);
    return res.status(500).json({ message: "Server Error" });
  }
};
export const verifyOtp = async (req, res) => {
  const { userId, otp, newPassword } = req.body;

  if (!userId || !otp || !newPassword) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    let user = await User.findById(userId);
    let isAdmin = false;

    // If not found in User, check Admin
    if (!user) {
      user = await Admin.findById(userId);
      isAdmin = true;
    }

    if (!user || !user.otp || !user.otpExpiry) {
      return res.status(404).json({ message: "OTP not requested or expired" });
    }

    if (user.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (user.otpExpiry < Date.now()) {
      return res.status(400).json({ message: "OTP expired" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password & clear OTP
    if (isAdmin) {
      // Explicitly update Admin
      await Admin.findByIdAndUpdate(userId, {
        password: hashedPassword,
        $unset: { otp: 1, otpExpiry: 1 }
      });
    } else {
      // Explicitly update User
      user.password = hashedPassword;
      user.otp = undefined;
      user.otpExpiry = undefined;
      await user.save();
    }

    return res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    console.error("Error in verifyOtp:", error);
    return res.status(500).json({ message: "Server Error" });
  }
};


export const banUser = async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  try {
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // user.isActive = false;
    user.isBanned = true;
    user.banReason = reason || "Violation of terms";
    user.bannedAt = new Date();

    await user.save();

    res.status(200).json({
      message: "User has been banned successfully",
      user,
    });
  } catch (error) {
    console.error("Error banning user:", error);
    res.status(500).json({
      message: "Server error while banning user",
    });
  }
};

