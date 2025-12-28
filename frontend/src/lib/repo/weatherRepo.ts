import { env } from '../env';
import { MOCK_WEATHER } from '@/shared/ui/mock';
import { fetchWeather } from '../api/weatherApi';
import { toWeatherData } from '../adapters/weatherAdapter';
import type { WeatherData } from '@/shared/ui/mock';

export async function getWeather(): Promise<WeatherData> {
  if (env.useMock) return MOCK_WEATHER;

  const dto = await fetchWeather({ region: 'SEOUL' });
  return toWeatherData(dto);
}