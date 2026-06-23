import { PDFParse } from "pdf-parse";

// Direct call to Groq API
const callGroqDirect = async (systemPrompt, userPrompt) => {
  const apiKey = process.env.GROQ_API_KEY;
  const model = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
  const url = "https://api.groq.com/openai/v1/chat/completions";

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: model,
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: userPrompt,
        },
      ],
      temperature: 0.2,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("Groq API error:", data);
    const details = data.error?.message || "Unknown error";
    const err = new Error(`Groq API error (status ${response.status}): ${details}`);
    err.status = response.status;
    throw err;
  }

  const text = data.choices?.[0]?.message?.content;
  if (!text) {
    throw new Error("No response returned from Groq.");
  }

  return text;
};

// Call Groq API with retries for rate limits and transient server errors (429, 500, 502, 503, 504)
export const callGroq = async (systemPrompt, userPrompt, retries = 5, delay = 2000) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await callGroqDirect(systemPrompt, userPrompt);
    } catch (err) {
      const errMsg = String(err.message || "").toLowerCase();
      const status = err.status;
      const isRetryable =
        status === 429 ||
        status === 500 ||
        status === 502 ||
        status === 503 ||
        status === 504 ||
        errMsg.includes("limit") ||
        errMsg.includes("rate") ||
        errMsg.includes("429") ||
        errMsg.includes("503") ||
        errMsg.includes("500") ||
        errMsg.includes("unavailable") ||
        errMsg.includes("demand") ||
        errMsg.includes("too large");

      if (isRetryable && attempt < retries) {
        const nextDelay = delay * Math.pow(1.5, attempt - 1);
        console.warn(`Groq API retryable error (status ${status || "unknown"}). Retrying attempt ${attempt}/${retries} in ${Math.round(nextDelay)}ms...`);
        await new Promise((resolve) => setTimeout(resolve, nextDelay));
        continue;
      }
      throw err;
    }
  }
};

// Call Groq API with retries (compatibility wrapper)
export const callGroqWithRetry = async (systemPrompt, userPrompt, retries = 5, delay = 2000) => {
  return callGroq(systemPrompt, userPrompt, retries, delay);
};

// Extracts text from base64 PDF
export const extractTextFromPdf = async (pdfBase64) => {
  if (!pdfBase64) return "";
  const pdfBuffer = Buffer.from(pdfBase64, "base64");
  const parser = new PDFParse({ data: pdfBuffer });
  try {
    const result = await parser.getText();
    return result.text || "";
  } finally {
    await parser.destroy().catch(() => {});
  }
};

// Clean helper to parse JSON outputs wrapped in markdown fences
export const parseJsonResponse = (text) => {
  const cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();
  return JSON.parse(cleaned);
};
