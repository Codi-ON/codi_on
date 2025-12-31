import { weatherApi } from "@/lib/api/weatherApi";
import { weatherAdapter } from "@/lib/adapters/weatherAdapter";
import type { WeatherData } from "@/shared/domain/weather";

export const weatherRepo = {
    async getWeather(region = "Seoul"): Promise<WeatherData> {
        const [today, weekly] = await Promise.all([
            weatherApi.getToday(region),
            weatherApi.getWeekly(region),
        ]);

        return weatherAdapter.toWeatherData(today, weekly);
    },
};