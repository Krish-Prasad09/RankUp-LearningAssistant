import Document from "../models/Document.js";
import Folder from "../models/Folder.js";
import Activity from "../models/Activity.js";
import { callGeminiWithPdf, parseJsonResponse } from "../utils/gemini.js";
import { buildQuizPdf } from "../utils/pdfExport.js";

const ALLOWED_QUIZ_COUNTS = [5, 10, 15, 20];
const DIFFICULTY_INSTRUCTIONS = {
  easy: "Easy: test direct recall, definitions, and basic comprehension from the material.",
  medium: "Medium: test understanding, application, and connections between related ideas.",
  hard: "Hard: test deeper reasoning, edge cases, multi-step application, and commonly confused concepts.",
};

// POST /api/documents/:id/quiz/generate
// Generates a fresh quiz (replaces any existing questions,
// but keeps past attempts/scores for history).
export const generateQuiz = async (req, res) => {
  try {
    const { difficulty = "medium", sourceMode = "document", total = 5 } = req.body || {};
    const normalizedDifficulty = DIFFICULTY_INSTRUCTIONS[difficulty] ? difficulty : "medium";
    const questionCount = normalizeQuestionCount(total);
    const useInternet = sourceMode === "document_internet";

    const doc = await Document.findOne({ _id: req.params.id, userId: req.user.id });
    if (!doc) {
      return res.status(404).json({ error: "Document not found" });
    }

    const sourceInstruction = useInternet
      ? "Use the uploaded PDF as the syllabus and primary scope. You may use Google Search to include relevant exam-style questions, examples, and current context that match the PDF topics. Do not introduce unrelated topics."
      : "Use only the uploaded PDF content. Do not use outside knowledge or unrelated topics.";

    const prompt = `You are an expert exam writer. Read the attached PDF document and create exactly ${questionCount} multiple-choice questions.

Source mode: ${sourceInstruction}
Difficulty: ${DIFFICULTY_INSTRUCTIONS[normalizedDifficulty]}

Respond with ONLY a JSON array (no markdown fences, no extra text) in exactly this format:
[
  { "question": "...", "options": ["option A", "option B", "option C", "option D"], "correctIndex": 0 }
]
Rules:
- The array must contain exactly ${questionCount} items.
- "options" must always have exactly 4 strings.
- "correctIndex" is the 0-based index (0-3) of the correct option.
- Questions should be clear, unambiguous, and appropriate for the selected difficulty.`;

    const raw = await callGeminiWithPdf(doc.pdfBase64, prompt, { useGoogleSearch: useInternet });
    const parsed = parseJsonResponse(raw);

    if (!Array.isArray(parsed)) {
      throw new Error("AI did not return a valid quiz.");
    }

    const questions = parsed
      .filter((q) => q && q.question && Array.isArray(q.options) && q.options.length === 4)
      .slice(0, questionCount)
      .map((q) => ({
        question: String(q.question),
        options: q.options.map(String),
        correctIndex: Math.min(Math.max(parseInt(q.correctIndex) || 0, 0), 3),
      }));

    if (questions.length !== questionCount) {
      throw new Error("AI did not return the expected number of questions.");
    }

    doc.quiz.questions = questions;
    await doc.save();

    res.json({ quiz: doc.quiz });
  } catch (error) {
    console.error("Generate quiz error:", error);
    res.status(500).json({ error: error.message || "Failed to generate quiz. Please try again." });
  }
};

// GET /api/documents/:id/quiz
export const getQuiz = async (req, res) => {
  try {
    const doc = await Document.findOne({ _id: req.params.id, userId: req.user.id }, "quiz name");
    if (!doc) {
      return res.status(404).json({ error: "Document not found" });
    }
    res.json({ quiz: doc.quiz });
  } catch (error) {
    console.error("Get quiz error:", error);
    res.status(500).json({ error: "Failed to load quiz." });
  }
};

// POST /api/documents/:id/quiz/attempt
export const submitQuizAttempt = async (req, res) => {
  try {
    const doc = await Document.findOne({ _id: req.params.id, userId: req.user.id });
    if (!doc) {
      return res.status(404).json({ error: "Document not found" });
    }

    const { answers } = req.body;
    const questions = doc.quiz.questions;

    if (!questions.length) {
      return res.status(400).json({ error: "No quiz has been generated for this document yet." });
    }

    if (!Array.isArray(answers) || answers.length !== questions.length) {
      return res.status(400).json({ error: "Invalid answers submitted." });
    }

    let score = 0;
    const results = questions.map((q, i) => {
      const selected = Number.isInteger(answers[i]) ? answers[i] : -1;
      const correct = selected === q.correctIndex;
      if (correct) score += 1;
      return {
        question: q.question,
        options: q.options,
        correctIndex: q.correctIndex,
        selected,
        correct,
      };
    });

    const attemptNumber = doc.quiz.attempts.length + 1;
    doc.quiz.attempts.push({
      attemptNumber,
      score,
      total: questions.length,
      answers,
    });
    await doc.save();

    await Activity.create({
      userId: req.user.id,
      type: "attempted_quiz",
      documentId: doc._id,
      documentName: doc.name,
      meta: { score, total: questions.length, attemptNumber },
    });

    res.json({
      attemptNumber,
      score,
      total: questions.length,
      results,
      attempts: doc.quiz.attempts.map((a) => ({
        attemptNumber: a.attemptNumber,
        score: a.score,
        total: a.total,
        takenAt: a.takenAt,
      })),
    });
  } catch (error) {
    console.error("Submit quiz attempt error:", error);
    res.status(500).json({ error: "Failed to submit quiz attempt." });
  }
};

// GET /api/documents/:id/quiz/export
export const exportQuiz = async (req, res) => {
  try {
    const doc = await Document.findOne({ _id: req.params.id, userId: req.user.id }, "quiz name");
    if (!doc) {
      return res.status(404).json({ error: "Document not found" });
    }

    if (!doc.quiz.questions.length) {
      return res.status(400).json({ error: "No quiz to export yet." });
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${sanitizeFilename(doc.name)}-quiz.pdf"`
    );

    const pdfDoc = buildQuizPdf(doc.name, doc.quiz.questions);
    pdfDoc.pipe(res);
    pdfDoc.end();
  } catch (error) {
    console.error("Export quiz error:", error);
    res.status(500).json({ error: "Failed to export quiz." });
  }
};

export const generateQuizFromFolders = async (req, res) => {
  try {
    const { folders = [], difficulty = "medium", sourceMode = "document", total = 5 } = req.body || {};
    if (!Array.isArray(folders) || folders.length === 0) {
      return res.status(400).json({ error: "No folders provided" });
    }

    // collect all descendant folder paths (BFS)
    const queue = [...folders];
    const seen = new Set();
    while (queue.length) {
      const p = queue.shift();
      if (!p || seen.has(p)) continue;
      seen.add(p);
      const children = await Folder.find({ userId: req.user.id, parent: p });
      for (const c of children) queue.push(c.path);
    }
    const paths = Array.from(seen);

    // find documents in these folders
    const docs = await Document.find({ userId: req.user.id, folderPath: { $in: paths } });
    if (!docs || docs.length === 0) {
      return res.status(400).json({ error: "No documents found in selected folders." });
    }

    const normalizedDifficulty = ["easy", "medium", "hard"].includes(difficulty) ? difficulty : "medium";
    const useInternet = sourceMode === "document_internet";

    const DIFFICULTY_INSTRUCTIONS = {
      easy: "Easy: test direct recall, definitions, and basic comprehension from the material.",
      medium: "Medium: test understanding, application, and connections between related ideas.",
      hard: "Hard: test deeper reasoning, edge cases, multi-step application, and commonly confused concepts.",
    };

    const target = normalizeQuestionCount(total);
    const collected = [];

    // Distribute question requests across documents until we reach target
    for (let i = 0; i < docs.length && collected.length < target; i++) {
      const doc = docs[i];
      const remaining = target - collected.length;
      const perDoc = Math.min(remaining, Math.max(1, Math.ceil(target / docs.length)));

      const sourceInstruction = useInternet
        ? "Use the uploaded PDF as the syllabus and primary scope. You may use Google Search to include relevant exam-style questions, examples, and current context that match the PDF topics. Do not introduce unrelated topics."
        : "Use only the uploaded PDF content. Do not use outside knowledge or unrelated topics.";

      const prompt = `You are an expert exam writer. Read the attached PDF document (${doc.name}) and create exactly ${perDoc} multiple-choice questions.\n\nSource mode: ${sourceInstruction}\nDifficulty: ${DIFFICULTY_INSTRUCTIONS[normalizedDifficulty]}\n\nRespond with ONLY a JSON array (no markdown fences, no extra text) in exactly this format:\n[\n  { "question": "...", "options": ["option A", "option B", "option C", "option D"], "correctIndex": 0 }\n]\nRules:\n- The array must contain exactly ${perDoc} items.\n- "options" must always have exactly 4 strings.\n- "correctIndex" is the 0-based index (0-3) of the correct option.`;

      try {
        const raw = await callGeminiWithPdf(doc.pdfBase64, prompt, { useGoogleSearch: useInternet });
        const parsed = parseJsonResponse(raw);
        if (!Array.isArray(parsed)) continue;
        for (const q of parsed) {
          if (collected.length >= target) break;
          if (!q || !q.question || !Array.isArray(q.options) || q.options.length !== 4) continue;
          collected.push({
            question: String(q.question),
            options: q.options.map(String),
            correctIndex: Math.min(Math.max(parseInt(q.correctIndex) || 0, 0), 3)
          });
        }
      } catch (err) {
        console.error("Error generating from doc", doc._id, err.message || err);
        continue;
      }
    }

    if (collected.length === 0) {
      return res.status(500).json({ error: "Failed to generate any questions from the selected folders." });
    }

    const questions = collected.slice(0, target);
    res.json({ quiz: { questions, attempts: [] }, sourceDocs: docs.map((d) => ({ _id: d._id, name: d.name })) });
  } catch (error) {
    console.error("Generate quiz from folders error:", error);
    res.status(500).json({ error: error.message || "Failed to generate quiz from folders." });
  }
};

function sanitizeFilename(name) {
  return name.replace(/[^a-z0-9-_]+/gi, "_").slice(0, 80) || "document";
}

function normalizeQuestionCount(total) {
  const requested = parseInt(total) || 5;
  return ALLOWED_QUIZ_COUNTS.includes(requested) ? requested : 5;
}
