// src/app/bootstrap.ts
import { ensureSessionKey } from "@/lib/session/sessionKey";

export function bootstrapApp(): void {
    ensureSessionKey();
}