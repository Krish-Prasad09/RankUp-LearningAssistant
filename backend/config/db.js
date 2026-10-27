import mongoose from "mongoose";

export const connectDB = async (retries = 5, delayMs = 2000) => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI is not defined in environment variables. Exiting...");
    process.exit(1);
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await mongoose.connect(uri);
      console.log("MongoDB connected successfully");
      return;
    } catch (err) {
      console.error(`MongoDB connection attempt ${attempt}/${retries} failed:`, err.message);
      if (attempt === retries) {
        console.error("Could not connect to MongoDB. Exiting...");
        process.exit(1);
      }
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
};
