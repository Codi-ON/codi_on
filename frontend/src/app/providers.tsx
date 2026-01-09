// src/app/providers.tsx
import React from "react";
import { Provider as ReduxProvider } from "react-redux";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { store } from "@/app/store";

const queryClient = new QueryClient({
    defaultOptions: {
        queries: { refetchOnWindowFocus: false, retry: 0 },
        mutations: { retry: 0 },
    },
});

export const AppProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <ReduxProvider store={store}>
            <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        </ReduxProvider>
    );
};