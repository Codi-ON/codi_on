import { http } from '../http';

export type WeatherDto = {
  temp: number;
  feelsLike: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  uvIndex: string;
  description: string;
  signals: string[];
};

export function fetchWeather(params?: { region?: string; date?: string }) {
  return http<WeatherDto>('/api/weather', { query: params });
}