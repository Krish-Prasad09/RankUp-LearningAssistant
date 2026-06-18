import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Access denied. No token provided." });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "Access denied. Invalid token format." });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallbacksecretkey123");
    
    const userExists = await User.findById(decoded.id).select("_id");
    if (!userExists) {
      return res.status(401).json({ error: "Access denied. User no longer exists." });
    }

    req.user = decoded; // decoded will contain { id: user._id }
    next();
  } catch (err) {
    console.error("Auth middleware error:", err.message);
    res.status(401).json({ error: "Invalid or expired token." });
  }
};
