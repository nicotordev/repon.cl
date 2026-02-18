"use client";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export type FetcherOptions = RequestInit & {
  /** When set, sends x-store-id header for store-scoped API routes. */
  storeId?: string | null;
};

export async function fetcher<T>(
  path: string,
  token: string | null,
  options: FetcherOptions = {}
): Promise<T> {
  const { storeId, ...fetchOptions } = options;
  const headers = new Headers(fetchOptions.headers);
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  if (storeId) {
    headers.set("x-store-id", storeId);
  }
  // Do not set Content-Type for FormData (browser sets multipart boundary)
  if (!(fetchOptions.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...fetchOptions,
    headers,
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: "An error occurred" }));
    const message =
      (error as { error?: string }).error ||
      (error as { message?: string }).message ||
      response.statusText;
    throw new Error(message);
  }

  return response.json();
}
