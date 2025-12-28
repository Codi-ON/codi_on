import type { WeatherData } from '@/shared/ui/mock';
import type { WeatherDto } from '../api/weatherApi';

export function toWeatherData(dto: WeatherDto): WeatherData {
  return {
    temp: dto.temp,
    feelsLike: dto.feelsLike,
    condition: dto.condition,
    humidity: dto.humidity,
    windSpeed: dto.windSpeed,
    uvIndex: dto.uvIndex as WeatherData['uvIndex'],
    description: dto.description,
    signals: dto.signals ?? [],
  };
}