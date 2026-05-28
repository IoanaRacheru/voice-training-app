/**
 * Creates a small JSON storage adapter over localStorage.
 * It centralizes error handling and default values.
 */
export function createLocalJsonStore(storageKey, fallbackValue) {
  const getFallback = () =>
    typeof fallbackValue === "function" ? fallbackValue() : fallbackValue;

  return {
    read() {
      if (typeof localStorage === "undefined") {
        return getFallback();
      }

      try {
        const parsed = JSON.parse(localStorage.getItem(storageKey) || "null");
        return parsed ?? getFallback();
      } catch (_error) {
        return getFallback();
      }
    },

    write(value) {
      if (typeof localStorage === "undefined") {
        return value;
      }

      localStorage.setItem(storageKey, JSON.stringify(value));
      return value;
    },
  };
}

