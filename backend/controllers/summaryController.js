import Document from "../models/Document.js";
import Activity from "../models/Activity.js";
import { callGeminiWithPdf, parseJsonResponse } from "../utils/gemini.js";

// GET /api/documents/:id/summary
// Generates the summary on first request and caches it; subsequent
// requests return the cached version unless ?regenerate=true.
export const getSummary = async (req, res) => {
  try {
    const doc = await Document.findOne({ _id: req.params.id, userId: req.user.id });
    if (!doc) {
      return res.status(404).json({ error: "Document not found" });
    }

    const regenerate = req.query.regenerate === "true";

    if (doc.summary.generated && !regenerate) {
      return res.json({ summary: doc.summary });
    }

    const prompt = `You are an expert study assistant. Read the attached PDF document carefully and produce a summary.

Respond with ONLY a JSON object (no markdown fences, no extra text) in exactly this format:
{
  "quick": "A concise 2-4 sentence overview of the document's main topic and purpose.",
  "detailed": "A thorough, well-structured summary covering the key sections, concepts, and important details of the document, written in multiple paragraphs."
}`;

    const raw = await callGeminiWithPdf(doc.pdfBase64, prompt);
    const parsed = parseJsonResponse(raw);

    doc.summary = {
      quick: parsed.quick || "",
      detailed: parsed.detailed || "",
      generated: true,
    };
    await doc.save();

    await Activity.create({
      userId: req.user.id,
      type: "generated_summary",
      documentId: doc._id,
      documentName: doc.name,
    });

    res.json({ summary: doc.summary });
  } catch (error) {
    console.error("Summary error:", error);
    res.status(500).json({ error: error.message || "Failed to generate summary. Please try again." });
  }
};
