import React from "react";

export default function DuckMark({ className = "" }) {
  return (
    <span className={`duck-mark ${className}`} aria-hidden="true">
      <span className="duck-mark-body" />
      <span className="duck-mark-head" />
      <span className="duck-mark-beak" />
      <span className="duck-mark-eye" />
      <span className="duck-mark-wing" />
    </span>
  );
}
