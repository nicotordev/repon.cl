"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { fetcher } from "../lib/api-client";
import type { Product, AdjustStockInput, InventoryAdjustment } from "../lib/backend";

export function useInventory(q?: string, initialData?: Product[]) {
  const { getToken } = useAuth();

  return useQuery({
    queryKey: ["inventory", q],
    queryFn: async () => {
      const token = await getToken();
      const url = q ? `/api/v1/inventory?q=${encodeURIComponent(q)}` : '/api/v1/inventory';
      return fetcher<Product[]>(url, token);
    },
    initialData,
  });
}

export function useAdjustStock() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ productId, data }: { productId: string; data: AdjustStockInput }) => {
      const token = await getToken();
      return fetcher<InventoryAdjustment>(`/api/v1/inventory/${productId}/adjust`, token, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
    },
  });
}
