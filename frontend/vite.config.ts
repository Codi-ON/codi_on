// vite.config.ts
import {defineConfig} from "vite";
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
            "/api/n8n": {
                target: "http://localhost:5678",
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/api\/n8n/, '')
            },
            "/api": {
                target: "http://localhost:8080",
                changeOrigin: true,
            },

        },
    },
});