import { verifyToken } from "../utils/jwtUtils.js";

export const AuthMiddleWare = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ message: "Authorization header missing or malformed" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = verifyToken(token);

if (!decoded) {
      console.error('AuthMiddleware: Token verification returned null/undefined');
      return res.status(401).json({ message: "Invalid or expired token." });
    }
    
    // Debug logging
    console.log('=== AuthMiddleware Debug ===');
    console.log('Token verified successfully');
    console.log('Decoded user data:', decoded);
    console.log('User ID:', decoded.id);
    console.log('User type:', decoded.userType);
    
    req.user = decoded; // Attach user data to the request
    console.log('req.user set to:', req.user);
    next();
  } catch (err) {
    console.error("Token error:", err);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

export const OptionalAuthMiddleWare = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    req.user = null;
    return next();
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = verifyToken(token);
    if (decoded) {
      req.user = decoded;
    } else {
      req.user = null;
    }
  } catch (err) {
    req.user = null;
  }
  next();
};
