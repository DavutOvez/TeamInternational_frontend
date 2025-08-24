import { QueryFunction, QueryFunctionContext, QueryClient } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}
const API_BASE_URL = "http://192.168.1.113:8000";


export async function apiRequest(method: string, url: string, body?: any) {
  const accessToken = localStorage.getItem("accessToken");

  const response = await fetch(`${API_BASE_URL}${url}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { "Authorization": `Bearer ${accessToken}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    throw new Error(`${response.status}: ${await response.text()}`);
  }
  return response;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export function getQueryFn<T>(options: { on401: UnauthorizedBehavior }): QueryFunction<T | null> {
  return async ({ queryKey }: QueryFunctionContext) => {
    const url = `${API_BASE_URL}${queryKey[0]}`;
    const token = localStorage.getItem("accessToken");

    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch(url, { headers });

    if (options.on401 === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return (await res.json()) as T;
  };
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "returnNull" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
