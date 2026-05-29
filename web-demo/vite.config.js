import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";


export default defineConfig({
  logLevel: "error",

  plugins: [react()],

  resolve: {
    alias: {
      tslib: "tslib",
      "@": new URL("./src", import.meta.url).pathname,
    },
  },

  optimizeDeps: {
    include: ["tslib"],
  },
});