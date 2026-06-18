import User from "../models/User.js";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET || "fallbacksecretkey123", {
    expiresIn: "7d",
  });
};

export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: "Please provide name, email, and password." });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ error: "User with this email already exists." });
    }

    const user = await User.create({ name, email, password });
    const token = generateToken(user._id);

    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email, avatar: user.avatar },
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ error: "Registration failed. Please try again." });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Please provide email and password." });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: "Invalid email or password." });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid email or password." });
    }

    const token = generateToken(user._id);

    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, avatar: user.avatar },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Login failed. Please try again." });
  }
};

export const googleLogin = async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ error: "No Google credential provided." });
    }

    let email, name, googleId, avatar;

    // Verify token with google-auth-library if CLIENT_ID is present
    if (process.env.GOOGLE_CLIENT_ID) {
      try {
        const ticket = await client.verifyIdToken({
          idToken: credential,
          audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        email = payload.email;
        name = payload.name;
        googleId = payload.sub;
        avatar = payload.picture;
      } catch (err) {
        console.error("Google verify token error, trying tokeninfo fallback:", err.message);
        // Fallback to tokeninfo API
        const resInfo = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);
        if (!resInfo.ok) {
          return res.status(400).json({ error: "Failed to verify Google credential." });
        }
        const payload = await resInfo.json();
        email = payload.email;
        name = payload.name;
        googleId = payload.sub;
        avatar = payload.picture;
      }
    } else {
      // Fallback to tokeninfo API if GOOGLE_CLIENT_ID is not yet configured (makes setup easier for user)
      const resInfo = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);
      if (!resInfo.ok) {
        return res.status(400).json({ error: "Failed to verify Google credential." });
      }
      const payload = await resInfo.json();
      email = payload.email;
      name = payload.name;
      googleId = payload.sub;
      avatar = payload.picture;
    }

    if (!email) {
      return res.status(400).json({ error: "Google sign-in did not return email." });
    }

    let user = await User.findOne({ email });
    if (!user) {
      // Create new user if they don't exist
      user = await User.create({
        name,
        email,
        googleId,
        avatar,
      });
    } else {
      // Update google ID and avatar if missing
      let updated = false;
      if (!user.googleId) { user.googleId = googleId; updated = true; }
      if (!user.avatar && avatar) { user.avatar = avatar; updated = true; }
      if (updated) await user.save();
    }

    const token = generateToken(user._id);

    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, avatar: user.avatar },
    });
  } catch (error) {
    console.error("Google login error:", error);
    res.status(500).json({ error: "Google authentication failed. Please try again." });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }
    res.json({ user: { id: user._id, name: user.name, email: user.email, avatar: user.avatar } });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ error: "Failed to fetch profile." });
  }
};
