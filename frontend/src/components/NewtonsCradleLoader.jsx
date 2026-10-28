import React from "react";

/**
 * NewtonsCradleLoader
 * A physics-inspired Newton's Cradle loading screen styled for the dark navy / bluish theme.
 * Uses HTML elements with transform-origin: top center for 100% reliable cross-browser physics.
 * Left ball swings from +60deg (outward left) to 0deg (impact), transferring momentum
 * to the right ball which swings from 0deg to -60deg (outward right) and back.
 */
export default function NewtonsCradleLoader({
  message = "loading...",
  subtitle = null,
  fullScreen = true,
  className = "",
}) {
  const containerClasses = fullScreen
    ? `min-h-screen w-full flex flex-col items-center justify-center bg-[#090d16] relative overflow-hidden select-none ${className}`
    : `w-full py-12 flex flex-col items-center justify-center bg-[#090d16]/80 rounded-2xl relative overflow-hidden select-none ${className}`;

  return (
    <div className={containerClasses}>
      {/* Ambient background glow matching the dark navy / cyan theme */}
      <div className="absolute w-96 h-96 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none -top-12" />
      <div className="absolute w-80 h-80 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none -bottom-10" />

      <div className="relative flex flex-col items-center z-10">
        {/* Top Suspension Bar */}
        <div className="relative w-48 h-1.5 bg-slate-700/90 rounded-full border-t border-slate-500/50 shadow-md flex justify-center items-center">
          {/* 5 Anchor Pins exactly aligned with each 28px pendulum center */}
          <div className="w-[140px] flex items-center justify-between px-[13px]">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-sky-400 shadow-[0_0_5px_#38bdf8]"
              />
            ))}
          </div>
        </div>

        {/* 5 Pendulums in Flex Layout (Each 28px wide so balls touch with 0 gap) */}
        <div className="relative flex justify-center items-start w-[140px] h-[126px] overflow-visible">
          {/* Ball 0 (Leftmost - Swings outward to +60deg left, then back to 0deg impact) */}
          <div
            className="w-[28px] h-[120px] origin-top animate-cradle-left flex flex-col items-center"
            style={{ transformOrigin: "top center" }}
          >
            <div className="w-[1.5px] h-[92px] bg-slate-500/80" />
            <div className="relative w-[28px] h-[28px] rounded-full bg-gradient-to-br from-sky-300 via-sky-500 to-sky-700 border border-sky-950 shadow-[0_0_12px_rgba(14,165,233,0.55)] shrink-0">
              <div className="absolute top-1 left-1.5 w-1.5 h-1.5 rounded-full bg-white/70" />
            </div>
          </div>

          {/* Ball 1 (Middle-Left - Stationary) */}
          <div
            className="w-[28px] h-[120px] origin-top flex flex-col items-center"
            style={{ transformOrigin: "top center" }}
          >
            <div className="w-[1.5px] h-[92px] bg-slate-500/80" />
            <div className="relative w-[28px] h-[28px] rounded-full bg-gradient-to-br from-sky-300 via-sky-500 to-sky-700 border border-sky-950 shadow-[0_0_12px_rgba(14,165,233,0.55)] shrink-0">
              <div className="absolute top-1 left-1.5 w-1.5 h-1.5 rounded-full bg-white/70" />
            </div>
          </div>

          {/* Ball 2 (Center - Stationary) */}
          <div
            className="w-[28px] h-[120px] origin-top flex flex-col items-center"
            style={{ transformOrigin: "top center" }}
          >
            <div className="w-[1.5px] h-[92px] bg-slate-500/80" />
            <div className="relative w-[28px] h-[28px] rounded-full bg-gradient-to-br from-sky-300 via-sky-500 to-sky-700 border border-sky-950 shadow-[0_0_12px_rgba(14,165,233,0.55)] shrink-0">
              <div className="absolute top-1 left-1.5 w-1.5 h-1.5 rounded-full bg-white/70" />
            </div>
          </div>

          {/* Ball 3 (Middle-Right - Stationary) */}
          <div
            className="w-[28px] h-[120px] origin-top flex flex-col items-center"
            style={{ transformOrigin: "top center" }}
          >
            <div className="w-[1.5px] h-[92px] bg-slate-500/80" />
            <div className="relative w-[28px] h-[28px] rounded-full bg-gradient-to-br from-sky-300 via-sky-500 to-sky-700 border border-sky-950 shadow-[0_0_12px_rgba(14,165,233,0.55)] shrink-0">
              <div className="absolute top-1 left-1.5 w-1.5 h-1.5 rounded-full bg-white/70" />
            </div>
          </div>

          {/* Ball 4 (Rightmost - Swings outward to -60deg right, then back to 0deg impact) */}
          <div
            className="w-[28px] h-[120px] origin-top animate-cradle-right flex flex-col items-center"
            style={{ transformOrigin: "top center" }}
          >
            <div className="w-[1.5px] h-[92px] bg-slate-500/80" />
            <div className="relative w-[28px] h-[28px] rounded-full bg-gradient-to-br from-sky-300 via-sky-500 to-sky-700 border border-sky-950 shadow-[0_0_12px_rgba(14,165,233,0.55)] shrink-0">
              <div className="absolute top-1 left-1.5 w-1.5 h-1.5 rounded-full bg-white/70" />
            </div>
          </div>
        </div>

        {/* Dynamic Ground Shadow */}
        <div className="w-36 h-2 rounded-full bg-cyan-500/15 blur-[3px] animate-cradle-shadow mt-1" />

        {/* Text & Underline matching the reference */}
        <div className="flex flex-col items-center mt-3">
          <p className="text-[15px] font-medium tracking-[0.2em] text-slate-300 font-sans select-none">
            {message}
          </p>
          <div className="mt-2 w-16 h-1 rounded-full bg-slate-700/60 shadow-[0_0_8px_rgba(14,165,233,0.25)]" />

          {subtitle && (
            <p className="mt-3 text-xs text-slate-500 font-light tracking-wide">
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
