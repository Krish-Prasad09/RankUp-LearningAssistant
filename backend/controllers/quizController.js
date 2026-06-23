import Document from "../models/Document.js";
import Folder from "../models/Folder.js";
import Activity from "../models/Activity.js";
import { callGroq, callGroqWithRetry, extractTextFromPdf, parseJsonResponse } from "../utils/groq.js";
import { buildQuizPdf } from "../utils/pdfExport.js";

const ALLOWED_QUIZ_COUNTS = [5, 10, 15, 20];
const DIFFICULTY_INSTRUCTIONS = {
  easy: "Easy: test direct recall, definitions, and basic comprehension from the material.",
  medium: "Medium: test understanding, application, and connections between related ideas.",
  hard: "Hard: test deeper reasoning, edge cases, multi-step application, and commonly confused concepts.",
};

// Chunk text into segments of maxLength (characters)
function chunkText(text, maxLength = 12000) {
  const chunks = [];
  let currentIndex = 0;

  while (currentIndex < text.length) {
    let endIndex = currentIndex + maxLength;
    if (endIndex >= text.length) {
      chunks.push(text.slice(currentIndex));
      break;
    }

    const lastSpace = text.lastIndexOf(" ", endIndex);
    if (lastSpace > currentIndex) {
      endIndex = lastSpace;
    }
    chunks.push(text.slice(currentIndex, endIndex).trim());
    currentIndex = endIndex;
  }

  return chunks;
}

// Generate questions from text by chunking
async function generateQuizQuestionsFromText(text, targetCount, difficulty, sourceInstruction, documentName = "", avoidQuestions = []) {
  const chunks = chunkText(text, 15000); // 15,000 characters is a good context size (~3,000 tokens)
  const collected = [];

  // Distribute the target count of questions across all chunks
  const chunkRequests = [];
  let remainingQuestions = targetCount;

  for (let i = 0; i < chunks.length; i++) {
    const countForThisChunk = Math.ceil(remainingQuestions / (chunks.length - i));
    chunkRequests.push({ chunk: chunks[i], count: countForThisChunk });
    remainingQuestions -= countForThisChunk;
  }

  // Filter chunks that actually need to generate questions and run them in parallel
  const promises = chunkRequests
    .filter((req) => req.count > 0)
    .map(async (req, i) => {
      const systemPrompt = `You are an expert exam writer. Here is a section of text content extracted from the uploaded PDF document${documentName ? ` (${documentName})` : ""}:
---
${req.chunk}
---`;

      const avoidContext = avoidQuestions.length > 0
        ? `\n\nDo NOT generate any of the following questions (or very similar ones) as they have already been used in previous attempts:\n${avoidQuestions.map((q, idx) => `- "${q}"`).join("\n")}`
        : "";

      const userPrompt = `Based on the provided PDF section, create exactly ${req.count} multiple-choice questions.

Source mode: ${sourceInstruction}
Difficulty: ${difficulty}${avoidContext}

Respond with ONLY a JSON array (no markdown fences, no extra text) in exactly this format:
[
  { "question": "...", "options": ["option A", "option B", "option C", "option D"], "correctIndex": 0 }
]
Rules:
- The array must contain exactly ${req.count} items.
- "options" must always have exactly 4 strings.
- "correctIndex" is the 0-based index (0-3) of the correct option.
- Questions should be clear, unambiguous, and appropriate for the selected difficulty.`;

      try {
        const raw = await callGroqWithRetry(systemPrompt, userPrompt);
        const parsed = parseJsonResponse(raw);
        if (Array.isArray(parsed)) {
          return parsed
            .filter((q) => q && q.question && Array.isArray(q.options) && q.options.length === 4)
            .slice(0, req.count)
            .map((q) => ({
              question: String(q.question),
              options: q.options.map(String),
              correctIndex: Math.min(Math.max(parseInt(q.correctIndex) || 0, 0), 3),
            }));
        }
      } catch (err) {
        console.error(`Error generating questions for chunk ${i}:`, err.message || err);
      }
      return [];
    });

  const results = await Promise.all(promises);
  for (const questions of results) {
    collected.push(...questions);
  }

  return collected;
}

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
      ? "Use the uploaded PDF as the syllabus and primary scope. You may use your internal knowledge to include relevant exam-style questions, examples, and current context that match the PDF topics. Do not introduce unrelated topics. Note: Live Google Search grounding is not available."
      : "Use only the uploaded PDF content. Do not use outside knowledge or unrelated topics.";

    // Extract PDF text for context
    const pdfText = await extractTextFromPdf(doc.pdfBase64);

    // Collect previously seen questions to avoid duplication
    const avoidQuestions = [
      ...new Set([
        ...(doc.quiz.questions || []).map((q) => q.question),
        ...(doc.quiz.attempts || []).flatMap((a) => (a.questions || []).map((q) => q.question)),
      ]),
    ].slice(-30);

    const questions = await generateQuizQuestionsFromText(
      pdfText,
      questionCount,
      DIFFICULTY_INSTRUCTIONS[normalizedDifficulty],
      sourceInstruction,
      doc.name,
      avoidQuestions
    );

    if (questions.length === 0) {
      throw new Error("AI did not return any valid quiz questions. Please try again.");
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
      questions: doc.quiz.questions,
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
    const { folders = [], documentIds = [], difficulty = "medium", sourceMode = "document", total = 5 } = req.body || {};
    
    let docs = [];
    if (Array.isArray(documentIds) && documentIds.length > 0) {
      docs = await Document.find({ userId: req.user.id, _id: { $in: documentIds } });
    } else if (Array.isArray(folders) && folders.length > 0) {
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
      docs = await Document.find({ userId: req.user.id, folderPath: { $in: paths } });
    } else {
      return res.status(400).json({ error: "No folders or documents selected." });
    }

    if (!docs || docs.length === 0) {
      return res.status(400).json({ error: "No documents found." });
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

    // Collect previously seen questions to avoid duplication
    const avoidQuestions = [
      ...new Set(
        docs.flatMap((doc) => [
          ...(doc.quiz?.questions || []).map((q) => q.question),
          ...(doc.quiz?.attempts || []).flatMap((a) => (a.questions || []).map((q) => q.question)),
        ])
      ),
    ].slice(-30);

    // Distribute question requests across documents
    const docRequests = [];
    let remainingQuestions = target;

    for (let i = 0; i < docs.length; i++) {
      const countForThisDoc = Math.ceil(remainingQuestions / (docs.length - i));
      docRequests.push({ doc: docs[i], count: countForThisDoc });
      remainingQuestions -= countForThisDoc;
    }

    const sourceInstruction = useInternet
      ? "Use the uploaded PDF as the syllabus and primary scope. You may use your internal knowledge to include relevant exam-style questions, examples, and current context that match the PDF topics. Do not introduce unrelated topics. Note: Live Google Search grounding is not available."
      : "Use only the uploaded PDF content. Do not use outside knowledge or unrelated topics.";

    // Run generations for all active documents in parallel
    const promises = docRequests
      .filter((req) => req.count > 0)
      .map(async (req) => {
        try {
          const pdfText = await extractTextFromPdf(req.doc.pdfBase64);
          return await generateQuizQuestionsFromText(
            pdfText,
            req.count,
            DIFFICULTY_INSTRUCTIONS[normalizedDifficulty],
            sourceInstruction,
            req.doc.name,
            avoidQuestions
          );
        } catch (err) {
          console.error("Error generating from doc", req.doc._id, err.message || err);
          return [];
        }
      });

    const results = await Promise.all(promises);
    for (const questions of results) {
      collected.push(...questions);
    }

    if (collected.length === 0) {
      return res.status(500).json({ error: "Failed to generate any questions from the selected sources." });
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

export const analyzeQuizAttempt = async (req, res) => {
  try {
    const { questions, answers } = req.body;
    if (!Array.isArray(questions) || !Array.isArray(answers) || questions.length !== answers.length) {
      return res.status(400).json({ error: "Invalid questions or answers format." });
    }

    const mistakes = [];
    let correctCount = 0;

    questions.forEach((q, index) => {
      const selected = answers[index];
      const isCorrect = selected === q.correctIndex;
      if (isCorrect) {
        correctCount++;
      } else {
        mistakes.push({
          number: index + 1,
          question: q.question,
          options: q.options,
          correctOption: q.options[q.correctIndex],
          selectedOption: selected >= 0 && selected < 4 ? q.options[selected] : "Skipped/Unanswered",
        });
      }
    });

    const systemPrompt = "You are a professional educational counselor and learning analytics expert. Your goal is to analyze a student's quiz attempt, identify their conceptual gaps, and provide constructive advice for improvement.";
    
    let userPrompt = "";
    if (mistakes.length === 0) {
      userPrompt = `A student completed a quiz with a perfect score of ${correctCount}/${questions.length}!
Please generate a mastery report in Markdown format. The report must contain:
1. **Mastery Summary**: Highly praise their perfect understanding of the material.
2. **Advanced Topics to Explore**: Suggest deeper concepts, edge cases, or advanced applications related to the quiz context that they should explore next to challenge themselves.
3. **Actionable Growth Suggestions**: Provide study techniques for long-term retention (e.g. teaching others, active recall scheduling).

Keep the tone encouraging, professional, and actionable. Use bullet points and headers.`;
    } else {
      userPrompt = `A student completed a quiz with a score of ${correctCount}/${questions.length}.
Here are the details of the questions they answered incorrectly or skipped:
${mistakes.map(m => `
Question ${m.number}: ${m.question}
- Correct Answer: ${m.correctOption}
- Student's Answer: ${m.selectedOption}
`).join("\n")}

Please generate a detailed learning analysis report in Markdown format. The report must contain:
1. **Performance Summary**: A brief, encouraging overview of how they did.
2. **Concept Gaps & Weak Topics**: Identify the specific topics, definitions, or areas where the student showed weakness based on their mistakes.
3. **Actionable Improvement Advice**: Provide concrete, step-by-step suggestions on how they can study these weak topics, including study techniques, visual aids, or research ideas.
4. **Recommended Study Plan**: A mini-checklist of tasks they should do next (e.g. read folders, make summaries, retake quiz).

Keep the tone encouraging, professional, and actionable. Use bullet points and headers.`;
    }

    const report = await callGroqWithRetry(systemPrompt, userPrompt);
    res.json({ report });
  } catch (error) {
    console.error("Analyze quiz attempt error:", error);
    res.status(500).json({ error: "Failed to generate AI analysis report." });
  }
};
