import { useEffect, useRef, useState } from "react";
import { askQuestion } from "../../services/api";

export default function ChatTab({ doc, setDoc }) {
  const [messages, setMessages] = useState(doc.chatHistory || []);
  const [input, setInput] = useState("");
  const [answerMode, setAnswerMode] = useState("document");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const endRef = useRef(null);

  useEffect(() => {
    setMessages(doc.chatHistory || []);
  }, [doc._id]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = async () => {
    const question = input.trim();
    if (!question || loading) return;

    setError("");
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: question }]);
    setLoading(true);

    try {
      const data = await askQuestion(doc._id, question, answerMode);
      setMessages(data.chatHistory);
      setDoc((prev) => ({ ...prev, chatHistory: data.chatHistory }));
    } catch (err) {
      setError(err.message);
      setMessages((prev) => prev.slice(0, -1));
      setInput(question);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl flex flex-col text-slate-100" style={{ height: "75vh" }}>
      <div className="border-b border-slate-800 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <p className="text-xs font-medium text-slate-400">Answer source</p>
        <div className="inline-flex rounded-xl border border-slate-800 bg-slate-950 p-1">
          <button
            type="button"
            onClick={() => setAnswerMode("document")}
            disabled={loading}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              answerMode === "document"
                ? "bg-slate-900 text-emerald-400 shadow-sm"
                : "text-slate-550 hover:text-slate-350"
            }`}
          >
            PDF only
          </button>
          <button
            type="button"
            onClick={() => setAnswerMode("document_internet")}
            disabled={loading}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              answerMode === "document_internet"
                ? "bg-slate-900 text-emerald-400 shadow-sm"
                : "text-slate-550 hover:text-slate-350"
            }`}
          >
            PDF + Internet
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4">
        {messages.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-500 px-6">
            <div className="w-12 h-12 rounded-xl bg-emerald-950/40 flex items-center justify-center mb-3">
              <ChatIcon className="w-6 h-6 text-emerald-400" />
            </div>
            <p className="text-sm font-medium text-slate-200">Ask anything about this document</p>
            <p className="text-xs text-slate-500 mt-1">
              Choose whether the AI should stay inside the PDF or add web context.
            </p>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap ${
                m.role === "user"
                  ? "bg-emerald-600 text-white rounded-br-sm"
                  : "bg-slate-950 text-slate-200 rounded-bl-sm border border-slate-800"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-slate-950 text-slate-500 border border-slate-800 rounded-2xl rounded-bl-sm px-4 py-2.5 text-sm flex items-center gap-1.5">
              <Dot /> <Dot delay="150ms" /> <Dot delay="300ms" />
            </div>
          </div>
        )}

        <div ref={endRef} />
      </div>

      {error && (
        <div className="px-4 pb-2">
          <p className="text-xs text-red-400">{error}</p>
        </div>
      )}

      <div className="border-t border-slate-800 p-3 flex items-end gap-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a question about this document..."
          rows={1}
          className="flex-1 resize-none border border-slate-800 bg-slate-950 text-white placeholder-slate-550 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-emerald-500 max-h-32"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || loading}
          className="flex-shrink-0 w-10 h-10 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed text-white flex items-center justify-center transition-colors cursor-pointer"
        >
          <SendIcon className="w-4.5 h-4.5" />
        </button>
      </div>
    </div>
  );
}

function Dot({ delay = "0ms" }) {
  return (
    <span
      className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce"
      style={{ animationDelay: delay }}
    />
  );
}

function ChatIcon(props) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
    </svg>
  );
}

function SendIcon(props) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
    </svg>
  );
}
