import { PDFParse } from "pdf-parse";

// Direct call to Groq API
const callGroqDirect = async (systemPrompt, userPrompt, modelOverride = null) => {
  const apiKey = process.env.GROQ_API_KEY;
  let model = modelOverride || process.env.GROQ_MODEL || "openai/gpt-oss-120b";

  // Automatically migrate legacy or deprecated models that are known to return 404
  if (!modelOverride && (
    model === "llama-3.3-70b-versatile" ||
    model.includes("llama-3.3") ||
    model.includes("llama3") ||
    model.includes("llama-3.1") ||
    model.includes("mixtral") ||
    model.includes("gemma")
  )) {
    model = "openai/gpt-oss-120b";
  }

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

// Call Groq API with retries for rate limits, 404 model fallback, and transient server errors
export const callGroq = async (systemPrompt, userPrompt, retries = 5, delay = 2000) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await callGroqDirect(systemPrompt, userPrompt);
    } catch (err) {
      const errMsg = String(err.message || "").toLowerCase();
      const status = err.status;

      // If a model is not found or unsupported (404), fall back to active models automatically
      if (status === 404 || errMsg.includes("does not exist") || errMsg.includes("not found")) {
        console.warn(`Groq model not found (404). Falling back to openai/gpt-oss-120b...`);
        try {
          return await callGroqDirect(systemPrompt, userPrompt, "openai/gpt-oss-120b");
        } catch (fbErr) {
          console.warn(`Fallback to openai/gpt-oss-120b failed, trying openai/gpt-oss-20b...`);
          return await callGroqDirect(systemPrompt, userPrompt, "openai/gpt-oss-20b");
        }
      }

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

// Extracts text directly from a raw PDF buffer (used at upload time)
export const extractTextFromBuffer = async (pdfBuffer) => {
  if (!pdfBuffer) return "";
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
