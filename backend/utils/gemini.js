// Shared helper for calling Gemini. The PDF-question logic mirrors the
// original working implementation (same model, same auth header, same
// inline_data approach) so the core chat behavior is unchanged.

const GEMINI_MODEL = "gemini-2.5-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

/**
 * Calls Gemini with a PDF (base64) + a text prompt.
 * Returns the raw text response.
 */
export const callGeminiWithPdf = async (pdfBase64, prompt, options = {}) => {
  const { useGoogleSearch = false } = options;
  const body = {
    contents: [
      {
        parts: [
          {
            inline_data: {
              mime_type: "application/pdf",
              data: pdfBase64,
            },
          },
          { text: prompt },
        ],
      },
    ],
  };

  if (useGoogleSearch) {
    body.tools = [{ google_search: {} }];
  }

  const response = await fetch(GEMINI_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": process.env.GEMINI_API_KEY,
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("Gemini API error:", data);
    throw new Error("Failed to get a response from AI. Please try again.");
  }

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error("No response returned from AI.");
  }

  return text;
};

/**
 * Strips markdown code fences (```json ... ```) that Gemini sometimes wraps
 * around JSON responses, then parses the JSON.
 */
export const parseJsonResponse = (text) => {
  const cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();
  return JSON.parse(cleaned);
};
