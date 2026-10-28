import React from "react";

/**
 * NewtonsCradleLoader
 * A physics-inspired Newton's Cradle loading screen styled for the dark navy / bluish theme.
 * Replicates the swing momentum, hanging spheres, rhythmic motion, and ground reflection.
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
      {/* Ambient background glow to match the dark navy theme */}
      <div className="absolute w-96 h-96 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none -top-12" />
      <div className="absolute w-80 h-80 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none -bottom-10" />

      <div className="relative flex flex-col items-center z-10">
        {/* Newton's Cradle SVG */}
        <svg
          width="280"
          height="170"
          viewBox="0 0 300 180"
          className="overflow-visible"
        >
          <defs>
            {/* Sphere 3D gradient */}
            <radialGradient id="cradleSphereGlow" cx="35%" cy="30%" r="65%">
              <stop offset="0%" stopColor="#bae6fd" />
              <stop offset="25%" stopColor="#38bdf8" />
              <stop offset="65%" stopColor="#0284c7" />
              <stop offset="100%" stopColor="#034d75" />
            </radialGradient>

            {/* Glowing filter for spheres */}
            <filter id="cradleGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#0ea5e9" floodOpacity="0.45" />
            </filter>

            {/* Dynamic ground shadow gradient */}
            <radialGradient id="cradleShadowGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(14, 165, 233, 0.35)" />
              <stop offset="50%" stopColor="rgba(15, 23, 42, 0.4)" />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
          </defs>

          {/* Top suspension frame bar */}
          <line
            x1="65"
            y1="20"
            x2="235"
            y2="20"
            stroke="#1e293b"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <line
            x1="70"
            y1="19"
            x2="230"
            y2="19"
            stroke="#334155"
            strokeWidth="1.5"
            strokeLinecap="round"
          />

          {/* 5 Suspension Anchor Pins */}
          {[98, 124, 150, 176, 202].map((x) => (
            <circle key={x} cx={x} cy="20" r="2.5" fill="#38bdf8" />
          ))}

          {/* Dynamic Ground Shadow */}
          <ellipse
            cx="150"
            cy="158"
            rx="56"
            ry="6"
            fill="url(#cradleShadowGrad)"
            className="animate-cradle-shadow"
          />

          {/* Ball 0 (Leftmost - Swinging out and back) */}
          <g transform="translate(98, 20)">
            <g className="animate-cradle-left">
              <line
                x1="0"
                y1="0"
                x2="0"
                y2="105"
                stroke="#475569"
                strokeWidth="1.5"
              />
              <circle
                cx="0"
                cy="105"
                r="13"
                fill="url(#cradleSphereGlow)"
                stroke="#082f49"
                strokeWidth="1.5"
                filter="url(#cradleGlow)"
              />
              {/* Highlight shine */}
              <circle cx="-3" cy="101" r="2.5" fill="#ffffff" opacity="0.6" />
            </g>
          </g>

          {/* Ball 1 (Middle-Left - Stationary) */}
          <g transform="translate(124, 20)">
            <line
              x1="0"
              y1="0"
              x2="0"
              y2="105"
              stroke="#475569"
              strokeWidth="1.5"
            />
            <circle
              cx="0"
              cy="105"
              r="13"
              fill="url(#cradleSphereGlow)"
              stroke="#082f49"
              strokeWidth="1.5"
              filter="url(#cradleGlow)"
            />
            <circle cx="-3" cy="101" r="2.5" fill="#ffffff" opacity="0.6" />
          </g>

          {/* Ball 2 (Center - Stationary) */}
          <g transform="translate(150, 20)">
            <line
              x1="0"
              y1="0"
              x2="0"
              y2="105"
              stroke="#475569"
              strokeWidth="1.5"
            />
            <circle
              cx="0"
              cy="105"
              r="13"
              fill="url(#cradleSphereGlow)"
              stroke="#082f49"
              strokeWidth="1.5"
              filter="url(#cradleGlow)"
            />
            <circle cx="-3" cy="101" r="2.5" fill="#ffffff" opacity="0.6" />
          </g>

          {/* Ball 3 (Middle-Right - Stationary) */}
          <g transform="translate(176, 20)">
            <line
              x1="0"
              y1="0"
              x2="0"
              y2="105"
              stroke="#475569"
              strokeWidth="1.5"
            />
            <circle
              cx="0"
              cy="105"
              r="13"
              fill="url(#cradleSphereGlow)"
              stroke="#082f49"
              strokeWidth="1.5"
              filter="url(#cradleGlow)"
            />
            <circle cx="-3" cy="101" r="2.5" fill="#ffffff" opacity="0.6" />
          </g>

          {/* Ball 4 (Rightmost - Swinging out and back) */}
          <g transform="translate(202, 20)">
            <g className="animate-cradle-right">
              <line
                x1="0"
                y1="0"
                x2="0"
                y2="105"
                stroke="#475569"
                strokeWidth="1.5"
              />
              <circle
                cx="0"
                cy="105"
                r="13"
                fill="url(#cradleSphereGlow)"
                stroke="#082f49"
                strokeWidth="1.5"
                filter="url(#cradleGlow)"
              />
              <circle cx="-3" cy="101" r="2.5" fill="#ffffff" opacity="0.6" />
            </g>
          </g>
        </svg>

        {/* Text & Underline matching the reference */}
        <div className="flex flex-col items-center mt-3">
          <p className="text-[15px] font-medium tracking-[0.2em] text-slate-300 font-sans select-none">
            {message}
          </p>
          {/* Subtle grounded oval pill as in the reference */}
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
