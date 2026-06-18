import express from "express";
import upload from "../middleware/upload.js";
import {
  uploadDocument,
  listDocuments,
  getDocument,
  renameDocument,
  deleteDocument,
  getDashboard,
  listFolders,
  createFolder,
  deleteFolder,
} from "../controllers/documentsController.js";
import { askQuestion } from "../controllers/chatController.js";
import { getSummary } from "../controllers/summaryController.js";
import {
  generateFlashcards,
  getFlashcards,
  exportFlashcards,
} from "../controllers/flashcardsController.js";
import {
  generateQuiz,
  getQuiz,
  submitQuizAttempt,
  exportQuiz,
  generateQuizFromFolders,
} from "../controllers/quizController.js";

const router = express.Router();

// Folders (MUST be before /:id routes)
router.get("/folders", listFolders);
router.post("/folders", createFolder);
router.delete("/folders", deleteFolder);
router.post("/folders/delete", deleteFolder);

// Documents CRUD
router.post("/", upload.single("pdf"), uploadDocument);
router.get("/", listDocuments);
router.get("/:id", getDocument);
router.patch("/:id", renameDocument);
router.delete("/:id", deleteDocument);

// Chat
router.post("/:id/chat", askQuestion);

// Summary
router.get("/:id/summary", getSummary);

// Flashcards
router.get("/:id/flashcards", getFlashcards);
router.post("/:id/flashcards", generateFlashcards);
router.get("/:id/flashcards/export", exportFlashcards);

// Quiz
router.get("/:id/quiz", getQuiz);
router.post("/:id/quiz/generate", generateQuiz);
router.post("/:id/quiz/attempt", submitQuizAttempt);
router.get("/:id/quiz/export", exportQuiz);
// Generate a quiz from multiple folders (body: { folders: ["/path1","/path2"], difficulty, sourceMode, total })
router.post("/quiz/generate-from-folders", generateQuizFromFolders);

export default router;
