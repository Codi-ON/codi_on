import { useQuery } from "@tanstack/react-query";
import { getTodayRecommend } from "../api/queries";

export function useTodayRecommend() {
  return useQuery({
    queryKey: ["recommend-today"],
    queryFn: getTodayRecommend,
  });
}