const API_URL = import.meta.env.VITE_API_BASE_URL || "/api";

const fetchWithAuth = async (endpoint, options = {}) => {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`Error ${response.status}`);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
};

export const getAllNews = async () => fetchWithAuth("/news/");

export const deleteNews = async (id) => {
  await fetchWithAuth(`/news/${id}`, { method: "DELETE" });
  return true;
};
