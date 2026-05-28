/**
 * Dispatches a browser CustomEvent when window is available.
 */
export function emitAppEvent(name, detail) {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new CustomEvent(name, { detail }));
}

