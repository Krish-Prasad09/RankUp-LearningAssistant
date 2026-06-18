import mongoose from "mongoose";

const activitySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: {
      type: String,
      enum: ["accessed_document", "attempted_quiz", "generated_flashcards", "generated_summary"],
      required: true,
    },
    documentId: { type: mongoose.Schema.Types.ObjectId, ref: "Document", required: true },
    documentName: { type: String, required: true },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} }, // e.g. { score: 4, total: 5, attemptNumber: 2 }
  },
  { timestamps: true }
);

export default mongoose.model("Activity", activitySchema);
