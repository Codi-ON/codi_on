// src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { router } from "@/app/routes/router";
import "@/app/index.css";

import { AppProviders } from "@/app/providers";
import { store } from "@/app/store";
import { bootstrapApp } from "@/app/bootstrap";

// 여기서 dispatch 넘기지 말고 그냥 호출
bootstrapApp();

ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <AppProviders>
            <RouterProvider router={router} />
        </AppProviders>
    </React.StrictMode>
);