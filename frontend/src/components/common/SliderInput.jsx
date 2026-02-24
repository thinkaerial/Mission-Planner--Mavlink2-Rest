// src/components/common/SliderInput.jsx
import React from "react";

const SliderInput = ({
  label,
  value,
  onChange,
  min,
  max,
  step,
  unit,
  disabled = false, // NEW: disabled prop
}) => {
  const disabledClasses = disabled
    ? "opacity-50 cursor-not-allowed"
    : "cursor-pointer";

  return (
    <div
      className={`grid grid-cols-2 items-center gap-4 ${
        disabled ? "opacity-60" : ""
      }`}
    >
      <label className="text-gray-400 text-xs">{label}</label>
      <div className="flex flex-col items-end">
        <div className="flex items-center gap-2 bg-gray-900 border border-gray-700 rounded-md px-2">
          <input
            type="number"
            value={value}
            onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
            min={min}
            max={max}
            step={step}
            className="w-16 p-1.5 bg-transparent text-white text-right outline-none"
            disabled={disabled} // NEW
          />
          <span className="text-gray-500 text-xs">{unit}</span>
        </div>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className={`w-full h-1.5 bg-gray-700 rounded-lg appearance-none mt-2 ${disabledClasses}`}
          disabled={disabled} // NEW
        />
      </div>
    </div>
  );
};

export default SliderInput;
