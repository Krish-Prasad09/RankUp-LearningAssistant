import Document from "../models/Document.js";
import Activity from "../models/Activity.js";
import { callGeminiWithPdf, parseJsonResponse } from "../utils/gemini.js";
import { buildFlashcardsPdf } from "../utils/pdfExport.js";

const FLASHCARDS_PER_GENERATION = 5;
const FLASHCARDS_MAX = 30;

// POST /api/documents/:id/flashcards
// Generates 5 new flashcards and appends them, up to a max of 30.
export const generateFlashcards = async (req, res) => {
  try {
    const doc = await Document.findOne({ _id: req.params.id, userId: req.user.id });
    if (!doc) {
      return res.status(404).json({ error: "Document not found" });
    }

    if (doc.flashcards.length >= FLASHCARDS_MAX) {
      return res.status(400).json({
        error: `Maximum of ${FLASHCARDS_MAX} flashcards reached for this document.`,
        flashcards: doc.flashcards,
      });
    }

    const remaining = FLASHCARDS_MAX - doc.flashcards.length;
    const countToGenerate = Math.min(FLASHCARDS_PER_GENERATION, remaining);

    const existingQuestions = doc.flashcards.map((f) => f.question);
    const existingContext =
      existingQuestions.length > 0
        ? `\n\nThe following flashcard questions already exist for this document. Do NOT repeat these topics; generate new, different flashcards:\n${existingQuestions
            .map((q, i) => `${i + 1}. ${q}`)
            .join("\n")}`
        : "";

    const prompt = `You are an expert study assistant. Read the attached PDF document and create exactly ${countToGenerate} flashcards covering important concepts from it.${existingContext}

Respond with ONLY a JSON array (no markdown fences, no extra text) in exactly this format:
[
  { "question": "...", "answer": "..." }
]
The array must contain exactly ${countToGenerate} items. Keep questions concise and answers clear and informative.`;

    const raw = await callGeminiWithPdf(doc.pdfBase64, prompt);
    const parsed = parseJsonResponse(raw);

    if (!Array.isArray(parsed)) {
      throw new Error("AI did not return a valid flashcard list.");
    }

    const newCards = parsed
      .filter((c) => c && c.question && c.answer)
      .slice(0, countToGenerate)
      .map((c) => ({ question: String(c.question), answer: String(c.answer) }));

    doc.flashcards.push(...newCards);
    await doc.save();

    await Activity.create({
      userId: req.user.id,
      type: "generated_flashcards",
      documentId: doc._id,
      documentName: doc.name,
      meta: { count: newCards.length, total: doc.flashcards.length },
    });

    res.json({
      flashcards: doc.flashcards,
      maxReached: doc.flashcards.length >= FLASHCARDS_MAX,
      max: FLASHCARDS_MAX,
    });
  } catch (error) {
    console.error("Flashcards error:", error);
    res.status(500).json({ error: error.message || "Failed to generate flashcards. Please try again." });
  }
};

// GET /api/documents/:id/flashcards
export const getFlashcards = async (req, res) => {
  try {
    const doc = await Document.findOne({ _id: req.params.id, userId: req.user.id }, "flashcards name");
    if (!doc) {
      return res.status(404).json({ error: "Document not found" });
    }
    res.json({ flashcards: doc.flashcards, max: FLASHCARDS_MAX });
  } catch (error) {
    console.error("Get flashcards error:", error);
    res.status(500).json({ error: "Failed to load flashcards." });
  }
};

// GET /api/documents/:id/flashcards/export -> downloadable PDF
export const exportFlashcards = async (req, res) => {
  try {
    const doc = await Document.findOne({ _id: req.params.id, userId: req.user.id }, "flashcards name");
    if (!doc) {
      return res.status(404).json({ error: "Document not found" });
    }

    if (!doc.flashcards.length) {
      return res.status(400).json({ error: "No flashcards to export yet." });
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${sanitizeFilename(doc.name)}-flashcards.pdf"`
    );

    const pdfDoc = buildFlashcardsPdf(doc.name, doc.flashcards);
    pdfDoc.pipe(res);
    pdfDoc.end();
  } catch (error) {
    console.error("Export flashcards error:", error);
    res.status(500).json({ error: "Failed to export flashcards." });
  }
};

function sanitizeFilename(name) {
  return name.replace(/[^a-z0-9-_]+/gi, "_").slice(0, 80) || "document";
}
