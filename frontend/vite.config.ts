import path from "path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");

  return {
    server: {
      port: 3000,
      host: "0.0.0.0",
    },
    plugins: [react()],
    // 필요할 때만 쓰자. (없어도 빌드/라우팅은 돌아가게)
    define: {
      "process.env.GEMINI_API_KEY": JSON.stringify(env.GEMINI_API_KEY ?? ""),
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
      },
    },
  };
});