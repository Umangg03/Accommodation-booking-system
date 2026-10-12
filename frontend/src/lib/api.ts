export const API_URL =
  import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export async function apiFetch(
  input: string | URL,
  init: RequestInit = {},
): Promise<Response> {
  const headers = new Headers(init.headers);
  const token = sessionStorage.getItem("access_token");
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(input, { ...init, headers });
  if (response.status === 401) {
    sessionStorage.clear();
    window.location.replace("/");
    throw new Error("Your session has expired. Please sign in again.");
  }
  if (response.status === 403) {
    throw new Error("You don't have permission to perform this action.");
  }
  return response;
}
