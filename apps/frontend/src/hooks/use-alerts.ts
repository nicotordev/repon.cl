"use client";

import type { StoreAlert } from "@/lib/alerts";
import { useStoreOptional } from "@/contexts/StoreContext";
import { fetcher } from "@/lib/api-client";
import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useAlerts() {
  const { getToken } = useAuth();
  const { storeId } = useStoreOptional() ?? { storeId: null };

  return useQuery({
    queryKey: ["alerts", storeId ?? ""],
    queryFn: async () => {
      const token = await getToken();
      const path = storeId
        ? `/api/v1/alerts?storeId=${encodeURIComponent(storeId)}`
        : "/api/v1/alerts";
      return fetcher<StoreAlert[]>(path, token);
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
