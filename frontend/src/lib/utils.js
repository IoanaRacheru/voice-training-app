/**
 * Safely parses a JSON string, returning a fallback value if parsing fails or the value is not the expected type.
 * @param {string|null|undefined} value - The JSON string to parse.
 * @param {any} fallback - The value to return if parsing fails.
 * @param {(parsed: any) => boolean} [validate] - Optional validation function for the parsed value.
 * @returns {any}
 */
export function safeJsonParse(value, fallback, validate) {
  try {
    const parsed = JSON.parse(value ?? "null");
    if (validate && !validate(parsed)) return fallback;
    return parsed;
  } catch {
    return fallback;
  }
}
import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"
/**
 * @param {...any} inputs
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export const isIframe = (() => {
  if (typeof window === 'undefined') return false;
  try {
    return window.self !== window.top;
  } catch (e) {
    return true; // Assume iframe if access is denied
  }
})();
