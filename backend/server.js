import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { connectDB } from "./config/db.js";
import documentsRoutes from "./routes/documents.js";
import dashboardRoutes from "./routes/dashboard.js";
import authRoutes from "./routes/auth.js";
import tasksRoutes from "./routes/tasks.js";
import quizRoomsRoutes from "./routes/quizRooms.js";
import { auth } from "./middleware/auth.js";
import { attachQuizRoomsSocket } from "./socket/quizRoomsSocket.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors());
app.use(express.json({ limit: "5mb" }));

app.use("/api/auth", authRoutes);
app.use("/api/documents", auth, documentsRoutes);
app.use("/api/dashboard", auth, dashboardRoutes);
app.use("/api/tasks", auth, tasksRoutes);
app.use("/api/quiz-rooms", auth, quizRoomsRoutes);

app.get("/", (req, res) => {
  res.json({ message: "RankUp API is running" });
});

app.get("/api/health", (req, res) => {
  const dbState = ["disconnected", "connected", "connecting", "disconnecting"];
  res.json({
    status: "ok",
    db: dbState[mongoose.connection.readyState] || "unknown",
  });
});

connectDB().then(() => {
  const server = app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
  attachQuizRoomsSocket(server);
  server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.error(`Port ${PORT} is already in use. Stop the other process or change PORT in .env`);
    } else {
      console.error("Server error:", err.message);
    }
    process.exit(1);
  });
});
