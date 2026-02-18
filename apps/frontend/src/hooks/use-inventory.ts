"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { useStoreOptional } from "@/contexts/StoreContext";
import { fetcher } from "../lib/api-client";
import type {
  Product,
  AdjustStockInput,
  InventoryAdjustment,
  CreateProductInput,
  UpdateProductInput,
  CatalogProduct,
  AddProductToStoreInput,
} from "../lib/backend";

export function useInventory(q?: string, initialData?: Product[]) {
  const { getToken } = useAuth();
  const { storeId } = useStoreOptional() ?? { storeId: null };

  return useQuery({
    queryKey: ["inventory", storeId ?? "", q],
    queryFn: async () => {
      const token = await getToken();
      const url = q
        ? `/api/v1/inventory?q=${encodeURIComponent(q)}`
        : "/api/v1/inventory";
      return fetcher<Product[]>(url, token, { storeId });
    },
    initialData,
  });
}

export function useAdjustStock() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const { storeId: contextStoreId } = useStoreOptional() ?? { storeId: null };

  return useMutation({
    mutationFn: async ({
      productId,
      data,
      storeId: paramStoreId,
    }: {
      productId: string;
      data: AdjustStockInput;
      storeId?: string;
    }) => {
      const token = await getToken();
      const storeId = paramStoreId ?? contextStoreId ?? "";
      return fetcher<InventoryAdjustment>(
        `/api/v1/inventory/${productId}/adjust?storeId=${storeId}`,
        token,
        {
          method: "POST",
          body: JSON.stringify(data),
          storeId: storeId || undefined,
        },
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
    },
  });
}

export function useSearchCatalog(query: string) {
  const { getToken } = useAuth();
  const { storeId } = useStoreOptional() ?? { storeId: null };
  const q = query.trim();
  return useQuery({
    queryKey: ["inventory", "catalog", storeId ?? "", q],
    queryFn: async () => {
      const token = await getToken();
      if (!q || q.length < 2) return [] as CatalogProduct[];
      return fetcher<CatalogProduct[]>(
        `/api/v1/inventory/catalog?q=${encodeURIComponent(q)}`,
        token,
        { storeId },
      );
    },
    enabled: q.length >= 2,
    staleTime: 30_000,
  });
}

export function useAddProductToStore() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const { storeId } = useStoreOptional() ?? { storeId: null };

  return useMutation({
    mutationFn: async (data: AddProductToStoreInput) => {
      const token = await getToken();
      return fetcher<Product>("/api/v1/inventory/catalog/add", token, {
        method: "POST",
        body: JSON.stringify(data),
        storeId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
    },
  });
}

export function useCreateProduct() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const { storeId } = useStoreOptional() ?? { storeId: null };

  return useMutation({
    mutationFn: async (data: CreateProductInput) => {
      const token = await getToken();
      return fetcher<Product>("/api/v1/inventory", token, {
        method: "POST",
        body: JSON.stringify(data),
        storeId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
    },
  });
}

export function useUpdateProduct() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const { storeId } = useStoreOptional() ?? { storeId: null };

  return useMutation({
    mutationFn: async ({
      productId,
      data,
    }: {
      productId: string;
      data: UpdateProductInput;
    }) => {
      const token = await getToken();
      return fetcher<Product>(`/api/v1/inventory/${productId}`, token, {
        method: "PATCH",
        body: JSON.stringify(data),
        storeId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
    },
  });
}

export function useDeleteProduct() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const { storeId } = useStoreOptional() ?? { storeId: null };

  return useMutation({
    mutationFn: async (productId: string) => {
      const token = await getToken();
      return fetcher<void>(`/api/v1/inventory/${productId}`, token, {
        method: "DELETE",
        storeId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
    },
  });
}

export function useUploadProductImage() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const { storeId } = useStoreOptional() ?? { storeId: null };

  return useMutation({
    mutationFn: async ({
      productId,
      file,
    }: {
      productId: string;
      file: File;
    }) => {
      const token = await getToken();
      const form = new FormData();
      form.append("file", file);
      return fetcher<Product>(`/api/v1/inventory/${productId}/image`, token, {
        method: "POST",
        body: form,
        storeId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
    },
  });
}

export function useDeleteProductImage() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const { storeId } = useStoreOptional() ?? { storeId: null };

  return useMutation({
    mutationFn: async (productId: string) => {
      const token = await getToken();
      return fetcher<Product>(`/api/v1/inventory/${productId}/image`, token, {
        method: "DELETE",
        storeId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
    },
  });
}
