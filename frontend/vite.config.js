import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import path from "node:path";

// https://vite.dev/config/
export default defineConfig({
  logLevel: "error",

  plugins: [
    react(),
  ],

resolve: {
  alias: {
    tslib: "tslib",
    '@': path.resolve(__dirname, 'src'),
  },
},

  optimizeDeps: {
    include: ["tslib"],
  },
});