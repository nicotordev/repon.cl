"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { fetcher } from "../lib/api-client";
import type {
  Product,
  AdjustStockInput,
  InventoryAdjustment,
  CreateProductInput,
  UpdateProductInput,
} from "../lib/backend";

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

export function useCreateProduct() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateProductInput) => {
      const token = await getToken();
      return fetcher<Product>("/api/v1/inventory", token, {
        method: "POST",
        body: JSON.stringify(data),
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

  return useMutation({
    mutationFn: async (productId: string) => {
      const token = await getToken();
      return fetcher<void>(`/api/v1/inventory/${productId}`, token, {
        method: "DELETE",
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
      return fetcher<Product>(
        `/api/v1/inventory/${productId}/image`,
        token,
        { method: "POST", body: form }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
    },
  });
}

export function useDeleteProductImage() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productId: string) => {
      const token = await getToken();
      return fetcher<Product>(
        `/api/v1/inventory/${productId}/image`,
        token,
        { method: "DELETE" }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
    },
  });
}
