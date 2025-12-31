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
    name: user.name
  };
  return jwt.sign(payload, secret, { expiresIn: "10h" });
};

export const createAdminToken = (admin) => {
  const payload = {
    id: admin.id,
    email: admin.email,
    name: admin.name,
    role: "admin"
  };
  return jwt.sign(payload, secret, { expiresIn: "10h" });
};


export const verifyToken = (token) => {
  try {
    const decoded = jwt.verify(token, secret);
    return decoded;
  } catch (error) {
    console.error(error);
    return;
  }
};
