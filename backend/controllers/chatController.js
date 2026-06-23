import Document from "../models/Document.js";
import Activity from "../models/Activity.js";
import { callGroq, extractTextFromPdf } from "../utils/groq.js";

// POST /api/documents/:id/chat
// Sends the question + stored PDF + chat history to Groq, saves both
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

    let historyContext = "";
    if (history && history.length > 0) {
      historyContext = "\n\nPrevious conversation:\n";
      history.forEach((msg) => {
        historyContext += `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}\n`;
      });
      historyContext += "\nNow answer the following new question:";
    }

    const modeInstruction = useInternet
      ? "Answer using the uploaded PDF document as the primary source, and use your pre-trained knowledge to add relevant, current, or clarifying context when it helps. Note: Live Google Search grounding is not available, so do not refer to live web searches."
      : "Answer based strictly on the content of the uploaded PDF document. Do not use outside knowledge. If the answer is not found in the PDF, clearly say so.";

    // Extract PDF text for context
    const pdfText = await extractTextFromPdf(doc.pdfBase64);

    const systemPrompt = `You are a helpful learning assistant. Here is the text content extracted from the uploaded PDF document:
---
${pdfText}
---`;

    const userPrompt = `${modeInstruction}
${historyContext}

Question: ${question}`;

    const answer = await callGroq(systemPrompt, userPrompt);

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

// POST /api/chat
export const askStatelessQuestion = async (req, res) => {
  try {
    const { question, history = [] } = req.body;
    if (!question || question.trim() === "") {
      return res.status(400).json({ error: "No question provided" });
    }

    let historyContext = "";
    if (history && history.length > 0) {
      historyContext = "\n\nPrevious conversation:\n";
      history.forEach((msg) => {
        historyContext += `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}\n`;
      });
      historyContext += "\nNow answer the following new question:";
    }

    const systemPrompt = "You are a helpful learning assistant. Answer the user's questions clearly, accurately, and in detail using your broad, pre-trained knowledge. Act as an expert search-grounded assistant.";
    const userPrompt = `${historyContext}\n\nQuestion: ${question}`;

    const answer = await callGroq(systemPrompt, userPrompt);
    res.json({ answer });
  } catch (error) {
    console.error("Stateless Chat error:", error);
    res.status(500).json({ error: error.message || "Failed to get answer from AI. Please try again." });
  }
};
