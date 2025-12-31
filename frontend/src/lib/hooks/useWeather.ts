
import { useCallback, useEffect, useState } from "react";
import { weatherRepo } from "@/lib/repo/weatherRepo";
import type { WeatherData } from "@/shared/domain/weather";
import { getUserMessage } from "@/lib/errors";

export function useWeather(region = "Seoul") {
  const [data, setData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await weatherRepo.getWeather(region);
      setData(res);
    } catch (e) {
      setError(getUserMessage(e));
    } finally {
      setLoading(false);
    }
  }, [region]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { data, loading, error, refresh };
}