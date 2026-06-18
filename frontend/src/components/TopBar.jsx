import { useEffect, useState } from "react";
import { checkHealth } from "../services/api";

export default function TopBar({ title, subtitle }) {
  const [connected, setConnected] = useState(null);

  useEffect(() => {
    let mounted = true;
    const poll = () =>
      checkHealth()
        .then(() => mounted && setConnected(true))
        .catch(() => mounted && setConnected(false));
    poll();
    const id = setInterval(poll, 15000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, []);

  return (
    <div className="flex items-center justify-between px-8 py-5 border-b border-slate-800/60 bg-slate-900/40 backdrop-blur-sm sticky top-0 z-10">
      <div>
        {title && <h1 className="text-xl font-bold text-white">{title}</h1>}
        {subtitle && <p className="text-sm text-slate-400 mt-0.5">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-4">
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
            connected === null
              ? "bg-slate-800 text-slate-400"
              : connected
                ? "bg-emerald-950/30 text-emerald-400 border border-emerald-800/30"
                : "bg-red-950/30 text-red-400 border border-red-800/30"
          }`}
          title={connected === false ? "Start backend: cd backend && npm start" : ""}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              connected === null ? "bg-slate-500" : connected ? "bg-emerald-500 animate-pulse" : "bg-red-500"
            }`}
          />
          {connected === null ? "Checking..." : connected ? "Connected" : "Offline"}
        </div>
      </div>
    </div>
  );
}
