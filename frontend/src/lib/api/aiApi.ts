// src/lib/api/aiApi.ts
import axios from 'axios';
import type { DailyCommentResponse, ChatResponse, ImageAnalysisResponse } from '@/shared/domain/ai';


const MATERIAL_LIST = [
    "면", "폴리에스테르", "울", "실크", "린넨",
    "데님", "가죽", "나일론", "스판", "Unknown"
].join(', ');

const ANALYZE_IMAGE_PROMPT = `
Analyze this clothing item.
Identify the category (Top, Bottom, Outerwear, Shoes, Dress, Accessory), dominant color, suitable seasons (Summer, Winter, Spring, Autumn).

Task for Material:
Identify the primary material from the following list: [${MATERIAL_LIST}].
If unsure, select "Unknown". Do NOT invent new materials.

Provide short standard care instructions (e.g., 'Machine wash cold').
Task for Description:
Identify the specific item name in KOREAN (e.g., '패딩조끼', '나팔바지', '가죽 앵클 부츠', '체크무늬 셔츠').
Do NOT use full sentences. Do NOT describe features like "It is a...".
Just return the concise item name.

IMPORTANT: Provide 'careInstructions' and 'description' in KOREAN. 
('material' should be one of the English keys from the list above, or you can ask for Korean keys).

Return JSON keys: category,color,season,material,careInstructions,description.
`.trim();

// ------------------------------------------------------------------
//  유틸리티 함수 (n8n 응답 파싱)
// ------------------------------------------------------------------
function parseN8NResponse<T>(data: any): T {
    let rawText = data;

    // 객체 안에 text가 숨어있는 경우 추출
    if (data && typeof data === 'object' && 'text' in data) {
        rawText = data.text;
    }

    let parsed: any = rawText;

    // 문자열이면 JSON 파싱 시도
    if (typeof rawText === 'string') {
        const cleanText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
        try {
            parsed = JSON.parse(cleanText);
        } catch (e) {
            // 파싱 실패 시 원본 문자열 반환 시도 or 에러 무시
        }
    }

    // season 배열 처리 (문자열로 오면 배열로 변환)
    if (parsed && parsed.season && typeof parsed.season === 'string') {
        parsed.season = parsed.season.split(',').map((s: string) => s.trim());
    }
    // season이 아예 없으면 빈 배열
    if (parsed && !parsed.season) {
        parsed.season = [];
    }

    return parsed as T;
}

// ------------------------------------------------------------------
//  API 클라이언트 구현
// ------------------------------------------------------------------
// n8n 전용 Axios 인스턴스
const n8nClient = axios.create({
    headers: { 'Content-Type': 'application/json' }
});

export const aiApi = {
    // [API 1] 날씨 코멘트 (Daily Briefing)
    getDailyWeatherComment: async (lat: number, lon: number, activityType: 'indoor' | 'outdoor' = 'outdoor') => {
        const url = import.meta.env.VITE_N8N_DAILY_COMMENT_WEBHOOK_URL;

        // URL이 없을 경우 안전하게 기본값 반환
        if (!url) {
            console.warn("날씨 알림 Webhook URL이 설정되지 않았습니다.");
            return "오늘 날씨를 확인하고 옷차림을 점검하세요.";
        }

        try {
            const { data } = await n8nClient.post<DailyCommentResponse>(url, { lat, lon, activityType });
            // 응답이 { comment: "..." } 형태라고 가정하고 반환
            return data.comment || parseN8NResponse<{comment: string}>(data).comment;
        } catch (e) {
            console.error("Daily Comment Error:", e);
            return "날씨 정보를 불러오지 못했습니다.";
        }
    },

    // [API 2] 챗봇 (CodiON Chat)
    chatWithBot: async (message: string, lat?: number, lon?: number) => {
        const url = import.meta.env.VITE_N8N_CHAT_WEBHOOK_URL;

        if (!url) {
            console.warn("챗봇 Webhook URL이 설정되지 않았습니다.");
            return "죄송합니다. 현재 상담 서버 연결을 확인 중입니다.";
        }

        try {
            const { data } = await n8nClient.post<ChatResponse | any>(url, {
                message,
                lat,
                lon,
                timestamp: new Date().toISOString()
            });
            // n8n 응답 필드 유연하게 처리
            return data.output || data.text || data.message || "답변을 생성하지 못했습니다.";
        } catch (e) {
            console.error("Chat Error:", e);
            return "잠시 문제가 발생했어요. 다시 물어봐 주시겠어요?";
        }
    },

    // [API 3] 이미지 분석 (Image Analysis)
    analyzeImage: async (imageBase64: string) => {
        const url = import.meta.env.VITE_N8N_ANALYZE_IMAGE_WEBHOOK_URL;

        if (!url) throw new Error('Analyze Webhook URL not found');

        const { data } = await n8nClient.post(url, {
            imageBase64,
            prompt: ANALYZE_IMAGE_PROMPT, // 상단에 정의된 강력한 프롬프트 사용
        });

        return parseN8NResponse<ImageAnalysisResponse>(data);
    }
};