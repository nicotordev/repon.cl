"use client";

import type { StoreAlert } from "@/lib/alerts";
import { fetcher } from "@/lib/api-client";
import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useAlerts() {
  const { getToken } = useAuth();

  return useQuery({
    queryKey: ["alerts"],
    queryFn: async () => {
      const token = await getToken();
      return fetcher<StoreAlert[]>("/api/v1/alerts", token);
    },
  });
}

export function useMarkAlertRead() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (alertId: string) => {
      const token = await getToken();
      return fetcher<StoreAlert>(`/api/v1/alerts/${alertId}/read`, token, {
        method: "PATCH",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
    },
  });
}
