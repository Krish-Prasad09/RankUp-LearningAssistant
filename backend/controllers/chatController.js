import Document from "../models/Document.js";
import Activity from "../models/Activity.js";
import { callGeminiWithPdf } from "../utils/gemini.js";

// POST /api/documents/:id/chat
// Sends the question + stored PDF + chat history to Gemini, saves both
// messages to the document's chatHistory.
export const askQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const { question, answerMode = "document" } = req.body;
    const useInternet = answerMode === "document_internet";

    if (!question || question.trim() === "") {
      return res.status(400).json({ error: "No question provided" });
    }

    const doc = await Document.findOne({ _id: id, userId: req.user.id });
    if (!doc) {
      return res.status(404).json({ error: "Document not found" });
    }

    const history = doc.chatHistory.map((m) => ({ role: m.role, content: m.content }));

    // ---- UNCHANGED CORE LOGIC: same prompt construction & Gemini call ----
    let historyContext = "";
    if (history && history.length > 0) {
      historyContext = "\n\nPrevious conversation:\n";
      history.forEach((msg) => {
        historyContext += `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}\n`;
      });
      historyContext += "\nNow answer the following new question:";
    }

    const modeInstruction = useInternet
      ? "Answer using the uploaded PDF document as the primary source, and use Google Search only to add relevant, current, or clarifying context when it helps. Make it clear when information comes from the web rather than the PDF."
      : "Answer based strictly on the content of the uploaded PDF document. Do not use outside knowledge. If the answer is not found in the PDF, clearly say so.";

    const prompt = `You are a helpful learning assistant. ${modeInstruction}
${historyContext}

Question: ${question}`;

    const answer = await callGeminiWithPdf(doc.pdfBase64, prompt, { useGoogleSearch: useInternet });
    // ---- END UNCHANGED CORE LOGIC ----

    doc.chatHistory.push({ role: "user", content: question });
    doc.chatHistory.push({ role: "assistant", content: answer });
    doc.lastAccessedAt = new Date();
    await doc.save();

    res.json({ answer, chatHistory: doc.chatHistory });
  } catch (error) {
    console.error("Chat error:", error);
    res.status(500).json({ error: error.message || "Failed to get answer from AI. Please try again." });
  }
};
