import mongoose from "mongoose";

const roomQuestionSchema = new mongoose.Schema(
  {
    question: { type: String, required: true },
    options: { type: [String], required: true },
    correctIndex: { type: Number, required: true },
  },
  { _id: false }
);

const roomPlayerSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    joinedAt: { type: Date, default: Date.now },
    answers: { type: [Number], default: [] },
    score: { type: Number, default: 0 },
    submittedAt: { type: Date },
  },
  { _id: false }
);

const quizRoomSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, index: true },
    hostUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, default: "Multiplayer Quiz" },
    status: { type: String, enum: ["waiting", "active", "finished"], default: "waiting" },
    questions: { type: [roomQuestionSchema], required: true },
    players: { type: [roomPlayerSchema], default: [] },
  },
  { timestamps: true }
);

export default mongoose.model("QuizRoom", quizRoomSchema);
