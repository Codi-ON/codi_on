// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

const BACKEND_TARGET = "http://15.164.212.243:8080";
const N8N_TARGET = "http://15.164.212.243:5678"; // n8n 안 쓰면 일단 있어도 무시됨

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
        dedupe: ["react", "react-dom"],
    },
    server: {
        proxy: {
            // n8n 웹훅
            "/api/n8n": {
                target: N8N_TARGET,
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/api\/n8n/, ""),
            },
            // 백엔드(Spring)
            "/api": {
                target: BACKEND_TARGET,
                changeOrigin: true,
            },
        },
    },
});