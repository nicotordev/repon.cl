"use client";

import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { fetcher } from "@/lib/api-client";
import type { Store } from "@/lib/store-types";

export function useStores() {
  const { getToken } = useAuth();

  return useQuery({
    queryKey: ["user", "stores"],
    queryFn: async () => {
      const token = await getToken();
      return fetcher<Store[]>("/api/v1/user/stores", token);
    },
  });
}
