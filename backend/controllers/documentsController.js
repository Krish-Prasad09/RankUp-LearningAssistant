import Document from "../models/Document.js";
import Activity from "../models/Activity.js";
import mongoose from "mongoose";
import Folder from "../models/Folder.js";

// POST /api/documents  (multipart, field: pdf)
export const uploadDocument = async (req, res) => {
  try {
    const pdfFile = req.file;
    if (!pdfFile) {
      return res.status(400).json({ error: "No PDF file provided" });
    }

    const name = (req.body.name && req.body.name.trim()) || pdfFile.originalname.replace(/\.pdf$/i, "");
    const folderPath = (req.body.folderPath && req.body.folderPath.trim()) || "/";

    const doc = await Document.create({
      userId: req.user.id,
      name,
      originalFileName: pdfFile.originalname,
      mimeType: pdfFile.mimetype,
      size: pdfFile.size,
      pdfBase64: pdfFile.buffer.toString("base64"),
      folderPath,
    });

    await Activity.create({
      userId: req.user.id,
      type: "accessed_document",
      documentId: doc._id,
      documentName: doc.name,
    });

    res.status(201).json({ document: toSummary(doc) });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: "Failed to upload document. Please try again." });
  }
};

// GET /api/documents?page=1&limit=10
export const listDocuments = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 50);
    const skip = (page - 1) * limit;
    const folderPath = req.query.folderPath || "/";

    let filter = { userId: req.user.id };
    if (folderPath && folderPath !== "/") {
      filter.folderPath = folderPath;
    } else {
      // include documents with no folderPath set (legacy documents)
      filter.$or = [{ folderPath: "/" }, { folderPath: { $exists: false } }];
    }

    const [docs, total] = await Promise.all([
      Document.find(filter, Document.listProjection)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Document.countDocuments(filter),
    ]);

    res.json({
      documents: docs.map(toSummary),
      page,
      limit,
      total,
      hasMore: skip + docs.length < total,
    });
  } catch (error) {
    console.error("List documents error:", error);
    res.status(500).json({ error: "Failed to load documents." });
  }
};

// GET /api/documents/:id  -> full document including pdfBase64 (for viewer)
export const getDocument = async (req, res) => {
  try {
    const doc = await Document.findOne({ _id: req.params.id, userId: req.user.id });
    if (!doc) {
      return res.status(404).json({ error: "Document not found" });
    }

    doc.lastAccessedAt = new Date();
    await doc.save();

    await Activity.create({
      userId: req.user.id,
      type: "accessed_document",
      documentId: doc._id,
      documentName: doc.name,
    });

    res.json({ document: toFull(doc) });
  } catch (error) {
    console.error("Get document error:", error);
    res.status(500).json({ error: "Failed to load document." });
  }
};

// PATCH /api/documents/:id  { name }
export const renameDocument = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Name cannot be empty." });
    }

    const doc = await Document.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { name: name.trim() },
      { new: true, projection: Document.listProjection }
    );

    if (!doc) {
      return res.status(404).json({ error: "Document not found" });
    }

    res.json({ document: toSummary(doc) });
  } catch (error) {
    console.error("Rename document error:", error);
    res.status(500).json({ error: "Failed to rename document." });
  }
};

// DELETE /api/documents/:id
export const deleteDocument = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "Invalid document ID" });
    }

    const doc = await Document.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!doc) {
      return res.status(404).json({ error: "Document not found" });
    }

    await Activity.deleteMany({ documentId: doc._id, userId: req.user.id });

    res.json({ success: true });
  } catch (error) {
    console.error("Delete document error:", error);
    res.status(500).json({ error: "Failed to delete document." });
  }
};

// Folders
export const listFolders = async (req, res) => {
  try {
    const path = req.query.path || "/";
    const folders = await Folder.find({ userId: req.user.id, parent: path }).sort({ name: 1 });
    res.json({ folders });
  } catch (error) {
    console.error("List folders error:", error);
    res.status(500).json({ error: "Failed to load folders." });
  }
};

export const createFolder = async (req, res) => {
  try {
    const { path } = req.body;
    if (!path || !path.trim()) return res.status(400).json({ error: "Invalid path" });
    const parts = path.split("/").filter(Boolean);
    const name = parts[parts.length - 1] || "/";
    const parent = parts.length > 1 ? `/${parts.slice(0, -1).join("/")}` : "/";
    
    const existing = await Folder.findOne({ userId: req.user.id, path });
    if (existing) return res.status(400).json({ error: "Folder already exists" });
    
    const f = await Folder.create({ userId: req.user.id, name, path, parent });
    res.status(201).json({ folder: f });
  } catch (error) {
    console.error("Create folder error:", error);
    res.status(500).json({ error: "Failed to create folder." });
  }
};

export const deleteFolder = async (req, res) => {
  try {
    const path = (req.body?.path || req.query?.path || "").trim();
    if (!path || path === "/") return res.status(400).json({ error: "Cannot delete root folder" });

    const folder = await Folder.findOne({ userId: req.user.id, path });
    if (!folder) return res.status(404).json({ error: "Folder not found" });

    const escaped = path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const subfolders = await Folder.find({ userId: req.user.id, path: { $regex: `^${escaped}/` } });
    const pathsToDelete = [path, ...subfolders.map((f) => f.path)];

    const docs = await Document.find({ userId: req.user.id, folderPath: { $in: pathsToDelete } }, "_id");
    const docIds = docs.map((d) => d._id);

    await Document.deleteMany({ _id: { $in: docIds }, userId: req.user.id });
    await Activity.deleteMany({ documentId: { $in: docIds }, userId: req.user.id });
    await Folder.deleteMany({ path: { $in: pathsToDelete }, userId: req.user.id });

    res.json({ message: "Folder and all contents deleted" });
  } catch (error) {
    console.error("Delete folder error:", error);
    res.status(500).json({ error: "Failed to delete folder." });
  }
};

// GET /api/dashboard
export const getDashboard = async (req, res) => {
  try {
    const docs = await Document.find({ userId: req.user.id }, "flashcards quiz.attempts");

    const totalDocuments = docs.length;
    const totalFlashcards = docs.reduce((sum, d) => sum + d.flashcards.length, 0);
    const totalQuizzes = docs.reduce((sum, d) => sum + (d.quiz?.attempts?.length || 0), 0);

    const recentActivity = await Activity.find({ userId: req.user.id }).sort({ createdAt: -1 }).limit(10);
    const activityForStreak = await Activity.find({ userId: req.user.id }, "createdAt").sort({ createdAt: -1 });
    const learningStreak = calculateLearningStreak(activityForStreak.map((a) => a.createdAt));

    res.json({
      totalDocuments,
      totalFlashcards,
      totalQuizzes,
      learningStreak,
      recentActivity,
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    res.status(500).json({ error: "Failed to load dashboard." });
  }
};

// ---- helpers ----
function toSummary(doc) {
  return {
    _id: doc._id,
    name: doc.name,
    originalFileName: doc.originalFileName,
    size: doc.size,
    flashcardCount: doc.flashcards?.length || 0,
    quizAttemptCount: doc.quiz?.attempts?.length || 0,
    hasQuiz: (doc.quiz?.questions?.length || 0) > 0,
    chatMessageCount: doc.chatHistory?.length || 0,
    summaryGenerated: doc.summary?.generated || false,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    lastAccessedAt: doc.lastAccessedAt,
  };
}

function toFull(doc) {
  return {
    _id: doc._id,
    name: doc.name,
    originalFileName: doc.originalFileName,
    mimeType: doc.mimeType,
    size: doc.size,
    pdfBase64: doc.pdfBase64,
    chatHistory: doc.chatHistory,
    summary: doc.summary,
    flashcards: doc.flashcards,
    quiz: doc.quiz,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

function calculateLearningStreak(dates) {
  const days = new Set(
    dates.map((date) => {
      const d = new Date(date);
      return new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString().slice(0, 10);
    })
  );

  let cursor = new Date();
  cursor = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate());
  const todayKey = cursor.toISOString().slice(0, 10);

  if (!days.has(todayKey)) {
    cursor.setDate(cursor.getDate() - 1);
  }

  let count = 0;
  while (days.has(cursor.toISOString().slice(0, 10))) {
    count += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return count;
}
