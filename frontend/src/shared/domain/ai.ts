// src/shared/domain/ai.ts

export interface DailyCommentResponse {
    comment: string;
}

export interface ChatResponse {
    output: string;
    timestamp?: string;
}

export interface ImageAnalysisResponse {
    category: string;
    color: string;
    season: string[];
    material: string;
    careInstructions: string;
    description: string;
}