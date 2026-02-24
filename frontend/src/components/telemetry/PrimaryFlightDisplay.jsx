import React from "react";
import { useTelemetry } from "../../context/TelemetryContext";

const ArtificialHorizon = ({ roll, pitch }) => {
  const pitchOffset = pitch * 3.5;
  return (
    <g
      transform={`rotate(${roll})`}
      style={{ transition: "transform 0.1s linear" }}
    >
      <defs>
        <clipPath id="horizonClip">
          <rect x="-150" y="-150" width="300" height="300" />
        </clipPath>
      </defs>
      <g
        clipPath="url(#horizonClip)"
        transform={`translate(0, ${pitchOffset})`}
      >
        <rect x="-300" y="-300" width="600" height="300" fill="#3B82F6" />
        <rect x="-300" y="0" width="600" height="300" fill="#8B4513" />
        <line x1="-300" y1="0" x2="300" stroke="#FFF" strokeWidth="1.5" />
        {[-30, -20, -10, 10, 20, 30].map((p) => (
          <g key={p}>
            <line
              x1="-20"
              x2="20"
              y1={-p * 3.5}
              y2={-p * 3.5}
              stroke="white"
              strokeWidth="1"
            />
            <text
              x={-25}
              y={-p * 3.5 + 4}
              fill="white"
              fontSize="10"
              textAnchor="end"
            >
              {p}
            </text>
          </g>
        ))}
      </g>
    </g>
  );
};
const HeadingIndicator = ({ heading }) => {
  return (
    <g transform={`translate(0, 50)`}>
      <defs>
        <clipPath id="headingClip">
          <rect x="-40" y="-15" width="80" height="30" />
        </clipPath>
      </defs>
      <rect
        x="-40"
        y="-15"
        width="80"
        height="30"
        fill="#000"
        fillOpacity="0.5"
      />
      <g clipPath="url(#headingClip)">
        <g
          transform={`rotate(${-heading})`}
          style={{ transition: "transform 0.1s linear" }}
        >
          {Array.from({ length: 36 }, (_, i) => i * 10).map((h) => (
            <g key={h} transform={`rotate(${h}) translate(0, -45)`}>
              <line
                y1="0"
                y2={h % 30 === 0 ? 8 : 4}
                stroke="white"
                strokeWidth="1"
              />
              {h % 30 === 0 && (
                <text
                  y="18"
                  textAnchor="middle"
                  fill="white"
                  fontSize="10"
                  transform={`rotate(${-h})`}
                >
                  {{ 0: "N", 90: "E", 180: "S", 270: "W" }[h] || h}
                </text>
              )}
            </g>
          ))}
        </g>
      </g>
      <path d="M 0 -12 L -5 -4 L 5 -4 Z" fill="#00FF00" />
      <text
        y="2"
        textAnchor="middle"
        fontSize="12"
        fill="#00FF00"
        fontWeight="bold"
      >
        {Math.round(heading).toString().padStart(3, "0")}°
      </text>
    </g>
  );
};
const Tape = ({ value, side }) => {
  const offset = -value * 3;
  const majorTicks = Array.from(
    { length: 9 },
    (_, i) => Math.round(value / 5) * 5 + (i - 4) * 5
  );
  const xPos = side === "left" ? -65 : 65;
  return (
    <g transform={`translate(${xPos}, 0)`}>
      <rect
        x="-20"
        y="-40"
        width="40"
        height="80"
        fill="#000"
        fillOpacity="0.5"
      />
      <clipPath id={`${side}TapeClip`}>
        <rect x="-20" y="-40" width="40" height="80" />
      </clipPath>
      <g
        clipPath={`url(#${side}TapeClip)`}
        transform={`translate(0, ${offset})`}
      >
        {majorTicks.map((v) => (
          <g key={v} transform={`translate(0, ${-v * 3})`}>
            <line
              x1={side === "left" ? 12 : -12}
              x2="20"
              stroke="white"
              strokeWidth="1"
            />
            <text
              x={side === "left" ? 10 : -10}
              y="3"
              textAnchor={side === "left" ? "end" : "start"}
              fill="white"
              fontSize="9"
            >
              {v}
            </text>
          </g>
        ))}
      </g>
      <path
        d={`M ${side === "left" ? 20 : -20} 0 L ${
          side === "left" ? 12 : -12
        } -6 L ${side === "left" ? 12 : -12} 6 Z`}
        fill="white"
      />
      <rect x="-15" y="-9" width="30" height="18" fill="black" />
      <text
        y="4"
        textAnchor="middle"
        fill="white"
        fontSize="12"
        fontWeight="bold"
      >
        {value.toFixed(1)}
      </text>
    </g>
  );
};

const PrimaryFlightDisplay = () => {
  const { roll, pitch, heading, groundSpeed, altitude } = useTelemetry();

  return (
    <div className="w-64 bg-black/50 backdrop-blur-sm rounded-lg border border-gray-700 p-1.5 shadow-2xl">
      <h3 className="text-center text-xs font-semibold text-gray-300 uppercase tracking-wider">
        Primary Flight Display
      </h3>
      <div className="relative h-48 mt-1">
        <svg viewBox="-90 -80 180 160" className="w-full h-full">
          <ArtificialHorizon roll={roll} pitch={pitch} />
          <Tape value={groundSpeed} side="left" />
          <Tape value={altitude} side="right" />
          <HeadingIndicator heading={heading} />
          <g>
            <line
              x1="-30"
              y1="0"
              x2="-8"
              y2="0"
              stroke="#FBBF24"
              strokeWidth="2"
            />
            <line
              x1="8"
              y1="0"
              x2="30"
              y2="0"
              stroke="#FBBF24"
              strokeWidth="2"
            />
            <line
              x1="0"
              y1="-8"
              x2="0"
              y2="8"
              stroke="#FBBF24"
              strokeWidth="2"
            />
          </g>
        </svg>
      </div>
    </div>
  );
};

export default PrimaryFlightDisplay;
