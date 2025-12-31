import { publicApi } from "@/lib/http";

export type WeatherTodayDto = {
  region: string;
  date: string;
  temperature: number;
  minTemperature: number;
  maxTemperature: number;
  feelsLikeTemperature: number;
  cloudAmount: number;
  sky: "CLEAR" | "CLOUDS" | "RAIN" | "SNOW";
  precipitationProbability: number;
  humidity: number;
  windSpeed: number;
};

export type WeatherWeeklyDto = WeatherTodayDto;

export type WeatherWeeklyResponseDto = {
  region: string;
  days: WeatherWeeklyDto[];
};

export const weatherApi = {
  getToday(region = "Seoul") {
    return publicApi.get<WeatherTodayDto>("/api/weather/today", {
      params: { region },
    });
  },

  getWeekly(region = "Seoul") {
    return publicApi.get<WeatherWeeklyResponseDto>("/api/weather/weekly", {
      params: { region },
    });
  },
};