import React from "react";

export default function DuckMark({ className = "" }) {
  return (
    <span className={`duck-mark ${className}`} aria-hidden="true">
      <span className="duck-mark-body" />
    </span>
  );
}
