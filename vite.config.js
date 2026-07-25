import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          "firebase-app-auth": ["firebase/app", "firebase/auth"],
          "firebase-firestore": ["firebase/firestore"],
        },
      },
    },
  },
});
