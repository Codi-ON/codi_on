import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

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
            // n8n 웹훅 (필요하면)
            "/webhook": {
                target: "http://15.164.212.243:5678",
                changeOrigin: true,
            },
            "/api/n8n": {
                target: "http://15.164.212.243:5678",
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/api\/n8n/, ""),
            },
            // 백엔드
            "/api": {
                target: "http://15.164.212.243:8080",
                changeOrigin: true,
            },
        },
    },
});