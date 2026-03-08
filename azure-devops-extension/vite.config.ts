import react from "@vitejs/plugin-react";
import { resolve } from "path";
import { defineConfig } from "vite";

export default defineConfig({
  root: "src",
  base: "./",
  plugins: [react()],
  build: {
    outDir: "../dist",
    emptyOutDir: true,
    // Each contribution page is built as a separate entry point
    rollupOptions: {
      input: {
        "work-item-form": resolve(__dirname, "src/work-item-form/index.html"),
      },
      output: {
        entryFileNames: "[name]/[name].js",
        chunkFileNames: "shared/[name]-[hash].js",
        assetFileNames: (assetInfo) => {
          const name = assetInfo.name ?? "";
          if (name.endsWith(".css")) return "styles/[name][extname]";
          return "assets/[name][extname]";
        },
      },
    },
  },
});
