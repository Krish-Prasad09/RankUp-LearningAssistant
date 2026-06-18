import mongoose from "mongoose";

export const connectDB = async (retries = 5, delayMs = 2000) => {
  const primaryUri = process.env.MONGODB_URI;
  const localUri = "mongodb://localhost:27017/ai-learning-assistant";
  const uri = primaryUri || localUri;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await mongoose.connect(uri);
      console.log(`MongoDB connected: ${uri === localUri ? "local" : "primary"}`);
      return;
    } catch (err) {
      console.error(`MongoDB connection attempt ${attempt}/${retries} failed:`, err.message);
      if (attempt === retries) {
        if (uri !== localUri) {
          console.warn(`Primary MongoDB connection failed. Falling back to local MongoDB at ${localUri}...`);
          try {
            await mongoose.connect(localUri);
            console.log("Connected to fallback local MongoDB");
            return;
          } catch (localErr) {
            console.error("Local MongoDB connection failed:", localErr.message);
          }
        }
        console.error("Could not connect to any MongoDB instance. Exiting...");
        process.exit(1);
      }
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
};
