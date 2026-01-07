// src/lib/hooks/useAiService.ts
import { useState, useCallback } from 'react';
import { aiApi } from '../api/aiApi';

export const useAiService = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // 이미지 분석 함수
    const analyzeImage = async (base64Image: string) => {
        setLoading(true);
        setError(null);
        try {
            const result = await aiApi.analyzeImage(base64Image);
            return result;
        } catch (err) {
            console.error(err);
            setError("이미지 분석에 실패했습니다.");
            throw err;
        } finally {
            setLoading(false);
        }
    };

    // 날씨 멘트 가져오기
    const fetchDailyComment = useCallback(async (lat: number, lon: number) => {
        setLoading(true);
        try {
            const data = await aiApi.getDailyWeatherComment(lat, lon);
            return data;
        } catch (err) {
            console.error(err);
            return "오늘 날씨를 확인하고 옷차림을 점검하세요."; // 기본값
        } finally {
            setLoading(false);
        }
    }, []);

    // 챗봇 대화
    const sendMessage = useCallback(async (message: string) => {
        setLoading(true);
        try {
            const response = await aiApi.chatWithBot(message);
            return response;
        } catch (err) {
            setError('메시지 전송 실패');
            return "죄송합니다. 오류가 발생했습니다.";
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        analyzeImage,
        fetchDailyComment,
        sendMessage,
        loading,
        error
    };
};