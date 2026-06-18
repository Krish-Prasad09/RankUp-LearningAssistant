import mongoose from 'mongoose';

const folderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  name: { type: String, required: true },
  path: { type: String, required: true },
  parent: { type: String, default: '/' },
  aiSettings: { type: Object, default: { chat: true, summary: true, flashcards: true, quizzes: true } },
}, { timestamps: true });

// Compound index to ensure path uniqueness per user
folderSchema.index({ userId: 1, path: 1 }, { unique: true });

export default mongoose.model('Folder', folderSchema);