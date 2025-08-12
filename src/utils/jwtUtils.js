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
