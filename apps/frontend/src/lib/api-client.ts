"use client";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export async function fetcher<T>(
  path: string,
  token: string | null,
  options: RequestInit = {}
): Promise<T> {
  const headers = new Headers(options.headers);
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  // Do not set Content-Type for FormData (browser sets multipart boundary)
  if (!(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
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
