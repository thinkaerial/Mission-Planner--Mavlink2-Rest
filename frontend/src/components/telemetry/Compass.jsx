// src/components/Compass.jsx
import React from "react";

const Compass = ({ heading }) => {
  const ringStyle = {
    transform: `rotate(${-heading}deg)`,
    transition: "transform 300ms ease-out",
  };

  return (
    <div className="relative flex items-center justify-center w-24 h-24 border-2 border-gray-700 rounded-full bg-gray-900/60">
      <div className="absolute w-full h-full" style={ringStyle}>
        <span className="absolute font-bold text-white -translate-x-1/2 top-1 left-1/2">
          N
        </span>
        <span className="absolute font-bold text-white -translate-y-1/2 top-1/2 right-1.5">
          E
        </span>
        <span className="absolute font-bold text-white -translate-x-1/2 bottom-1 left-1/2">
          S
        </span>
        <span className="absolute font-bold text-white -translate-y-1/2 top-1/2 left-1.5">
          W
        </span>
      </div>
      <div className="relative flex items-center justify-center text-xl font-bold text-white w-12 h-12 border-2 border-sky-400 rounded-full bg-black/50">
        {Math.round(heading)}°
      </div>
      <div
        className="absolute -top-1.5 w-0 h-0 
        border-l-[6px] border-l-transparent
        border-r-[6px] border-r-transparent
        border-b-[8px] border-b-sky-400"
      />
    </div>
  );
};

export default Compass;
