// @ts-nocheck

import React, { useEffect, useRef, useState } from "react";
import { BookOpen, GripHorizontal, X } from "lucide-react";

export default function FloatingReadingBubble({ exercise, onClose }) {
  const bubbleRef = useRef(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const [position, setPosition] = useState({ x: null, y: null });
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    if (!exercise) return;

    const setDefaultPosition = () => {
      const width = Math.min(384, window.innerWidth - 32);
      setPosition({
        x: Math.max(16, window.innerWidth - width - 24),
        y: Math.max(16, window.innerHeight - 360),
      });
    };

    setDefaultPosition();
    window.addEventListener("resize", setDefaultPosition);

    return () => window.removeEventListener("resize", setDefaultPosition);
  }, [exercise?.id]);

  useEffect(() => {
    if (!dragging) return;

    const previousUserSelect = document.body.style.userSelect;
    const previousCursor = document.body.style.cursor;
    document.body.style.userSelect = "none";
    document.body.style.cursor = "grabbing";

    return () => {
      document.body.style.userSelect = previousUserSelect;
      document.body.style.cursor = previousCursor;
    };
  }, [dragging]);

  const clampPosition = (nextX, nextY) => {
    const rect = bubbleRef.current?.getBoundingClientRect();
    const width = rect?.width || Math.min(384, window.innerWidth - 32);
    const height = rect?.height || 320;

    return {
      x: Math.min(Math.max(16, nextX), Math.max(16, window.innerWidth - width - 16)),
      y: Math.min(Math.max(16, nextY), Math.max(16, window.innerHeight - height - 16)),
    };
  };

  const handlePointerDown = (event) => {
    if (event.button !== 0) return;

    const rect = bubbleRef.current?.getBoundingClientRect();
    if (!rect) return;

    event.preventDefault();

    dragOffsetRef.current = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
    setDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event) => {
    if (!dragging) return;

    event.preventDefault();
    const next = clampPosition(
      event.clientX - dragOffsetRef.current.x,
      event.clientY - dragOffsetRef.current.y
    );
    setPosition(next);
  };

  const handlePointerEnd = (event) => {
    setDragging(false);
    event.currentTarget.releasePointerCapture?.(event.pointerId);
  };

  if (!exercise) return null;

  return (
    <aside
      ref={bubbleRef}
      className={`fixed left-0 top-0 z-40 max-h-[70vh] w-[calc(100vw-2rem)] max-w-sm overflow-y-auto border border-border bg-white p-4 shadow-[0_24px_70px_rgba(17,17,17,0.18)] will-change-transform ${
        dragging ? "select-none shadow-[0_28px_80px_rgba(17,17,17,0.24)]" : ""
      }`}
      style={{
        transform: `translate3d(${position.x ?? 16}px, ${position.y ?? 16}px, 0)`,
      }}
      aria-label={`Pinned reading exercise: ${exercise.title}`}
    >
      <div
        className={`flex cursor-grab touch-none select-none items-start justify-between gap-3 border-b border-border pb-3 ${
          dragging ? "cursor-grabbing" : ""
        }`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        aria-label="Drag pinned reading exercise"
      >
        <div className="min-w-0">
          <p className="flex items-center gap-2 font-mono text-[11px] uppercase text-muted-foreground">
            <BookOpen className="h-3.5 w-3.5 text-primary" />
            Recording bubble
          </p>
          <h3 className="mt-1 text-base font-black uppercase leading-tight text-foreground">
            {exercise.title}
          </h3>
        </div>

        <GripHorizontal className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />

        <button
          type="button"
          onClick={onClose}
          onPointerDown={(event) => event.stopPropagation()}
          className="grid h-8 w-8 shrink-0 place-items-center border border-border bg-background text-foreground transition-colors hover:border-foreground hover:bg-white"
          aria-label="Close pinned reading exercise"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <p className="mt-4 text-sm font-semibold leading-6 text-foreground">
        {exercise.text}
      </p>

      {exercise.focusCues?.length > 0 && (
        <div className="mt-4 border-t border-border pt-3">
          <p className="text-xs font-black uppercase text-muted-foreground">
            Focus cues
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {exercise.focusCues.map((cue) => (
              <span
                key={cue}
                className="border border-border bg-background px-2 py-1 text-xs font-bold text-foreground"
              >
                {cue}
              </span>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}
