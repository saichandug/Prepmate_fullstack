import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// In development the React app runs on Vite (5173) and /api calls are proxied to the Express server.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiPort = env.PORT || 5000;

  return {
    plugins: [react()],
    base: "./",
    server: {
      proxy: {
        "/api": { target: `http://localhost:${apiPort}`, changeOrigin: true },
      },
    },
  };
});
