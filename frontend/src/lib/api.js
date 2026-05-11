export const API_URL = import.meta.env.VITE_API_URL || "https://ether-ai-9ue1.onrender.com/api";

export async function request(path, { token, ...options } = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  if (response.status === 204) return null;
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Request failed");
  return data;
}
