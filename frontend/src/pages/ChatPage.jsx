import { useEffect, useRef, useState } from "react";
import TopBar from "../components/TopBar";
import { statelessChat } from "../services/api";

export default function ChatPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = async () => {
    const question = input.trim();
    if (!question || loading) return;

    setError("");
    setInput("");
    const newMessages = [...messages, { role: "user", content: question }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const data = await statelessChat(question, messages);
      setMessages((prev) => [...prev, { role: "assistant", content: data.answer }]);
    } catch (err) {
      setError(err.message || "Failed to get answer from AI.");
      // Rollback user message on error
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

  const clearChat = () => {
    setMessages([]);
    setError("");
  };

  return (
    <div className="animate-fade-in text-slate-100 flex flex-col h-[calc(100vh-70px)]">
      <TopBar title="AI Chat" subtitle="Chat with AI using general knowledge and web context" />

      <div className="flex-1 px-8 pb-6 flex flex-col min-h-0">
        <div className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col overflow-hidden shadow-sm">
          {/* Chat header */}
          <div className="border-b border-slate-800 px-5 py-4 flex items-center justify-between bg-slate-900/60">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-semibold text-slate-300 tracking-wider">ONLINE AI ASSISTANT</span>
            </div>
            {messages.length > 0 && (
              <button
                onClick={clearChat}
                className="text-xs font-medium text-slate-400 hover:text-red-400 transition-colors border border-slate-800 hover:border-red-900/50 bg-slate-950 px-3 py-1.5 rounded-xl cursor-pointer"
              >
                Clear History
              </button>
            )}
          </div>

          {/* Messages body */}
          <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-4 bg-slate-950/20">
            {messages.length === 0 && (
              <div className="flex-1 flex flex-col items-center justify-center text-center px-6 max-w-md mx-auto">
                <div className="w-14 h-14 rounded-2xl hero-gradient flex items-center justify-center mb-4 shadow-lg shadow-indigo-500/20 text-2xl">
                  🤖
                </div>
                <p className="text-sm font-semibold text-slate-200 mb-1.5">Start a conversation</p>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Ask anything! This assistant uses its broad knowledge to help you learn, summarize concepts, draft explanations, or research topics.
                </p>
              </div>
            )}

            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap shadow-sm ${
                    m.role === "user"
                      ? "bg-indigo-600 text-white rounded-br-sm shadow-indigo-500/5"
                      : "bg-slate-900 border border-slate-800 text-slate-350 rounded-bl-sm"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start animate-pulse">
                <div className="bg-slate-900 border border-slate-800 text-slate-500 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1.5 shadow-sm">
                  <Dot /> <Dot delay="150ms" /> <Dot delay="300ms" />
                </div>
              </div>
            )}

            <div ref={endRef} />
          </div>

          {/* Error notice */}
          {error && (
            <div className="px-5 py-2 bg-red-950/10 border-t border-red-900/20">
              <p className="text-xs text-red-400 font-medium">⚠️ {error}</p>
            </div>
          )}

          {/* Typing field */}
          <div className="border-t border-slate-800 p-4 bg-slate-900/60 flex items-end gap-3">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything..."
              rows={1}
              className="flex-1 resize-none border border-slate-800 bg-slate-950 text-slate-200 placeholder-slate-500 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all max-h-32 min-h-[44px]"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              className="flex-shrink-0 w-11 h-11 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white flex items-center justify-center transition-all cursor-pointer shadow-md shadow-indigo-500/5"
            >
              <SendIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Dot({ delay = "0ms" }) {
  return (
    <span
      className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce"
      style={{ animationDelay: delay }}
    />
  );
}

function SendIcon(props) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
    </svg>
  );
}
