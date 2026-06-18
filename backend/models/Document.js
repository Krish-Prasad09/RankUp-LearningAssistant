import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ["user", "assistant"], required: true },
    content: { type: String, required: true },
  },
  { _id: false, timestamps: true }
);

const flashcardSchema = new mongoose.Schema(
  {
    question: { type: String, required: true },
    answer: { type: String, required: true },
  },
  { _id: true }
);

const quizQuestionSchema = new mongoose.Schema(
  {
    question: { type: String, required: true },
    options: { type: [String], required: true }, // exactly 4 options
    correctIndex: { type: Number, required: true }, // 0-3
  },
  { _id: false }
);

const quizAttemptSchema = new mongoose.Schema(
  {
    attemptNumber: { type: Number, required: true },
    score: { type: Number, required: true },
    total: { type: Number, required: true },
    answers: { type: [Number], default: [] }, // selected option index per question, -1 if unanswered
    takenAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const quizSchema = new mongoose.Schema(
  {
    questions: { type: [quizQuestionSchema], default: [] },
    attempts: { type: [quizAttemptSchema], default: [] },
  },
  { _id: false }
);

const documentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    originalFileName: { type: String, required: true },
    mimeType: { type: String, default: "application/pdf" },
    size: { type: Number, required: true }, // bytes
    pdfBase64: { type: String, required: true },
    folderPath: { type: String, default: "/" },

    chatHistory: { type: [messageSchema], default: [] },

    summary: {
      quick: { type: String, default: "" },
      detailed: { type: String, default: "" },
      generated: { type: Boolean, default: false },
    },

    flashcards: { type: [flashcardSchema], default: [] },

    quiz: { type: quizSchema, default: () => ({ questions: [], attempts: [] }) },

    lastAccessedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Lightweight projection for list views (excludes heavy pdfBase64)
documentSchema.statics.listProjection =
  "name originalFileName size createdAt updatedAt lastAccessedAt folderPath flashcards quiz.attempts chatHistory summary.generated";

export default mongoose.model("Document", documentSchema);
