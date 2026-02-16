"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { fetcher } from "@/src/lib/api-client";
import type { StoreAlert } from "@/src/lib/alerts";

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
      return fetcher<StoreAlert>(
        `/api/v1/alerts/${alertId}/read`,
        token,
        { method: "PATCH" }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
    },
  });
}
