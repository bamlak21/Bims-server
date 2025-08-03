import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const secret = process.env.JWT_SECRET;

if (!secret) {
  throw console.error("Secret not found");
}

export const createToken = (user) => {
  const payload = {
    id: user.id,
    email: user.email,
    userType: user.userType,
    phoneNumber: user.phoneNumber,
    firstName: user.firstName,
    lastName: user.lastName,
  };
  return jwt.sign(payload, secret, { expiresIn: "10h" });
};

export const verifyToken = (token) => {
  try {
    const decoded = jwt.verify(token, secret);
    return decoded;
  } catch (error) {
    console.log(error);
    return;
  }
};
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Access denied. No token provided." });
  }

  const token = authHeader.split(" ")[1];
  const decoded = verifyToken(token);

  if (!decoded) {
    return res.status(401).json({ message: "Invalid or expired token." });
  }

  req.user = decoded; // Attach user data to the request
  next();
};