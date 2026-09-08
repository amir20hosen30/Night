const BASE = "/api";

async function request(path, options = {}) {
  const res = await fetch(BASE + path, {
    credentials: "include",
    headers: options.body instanceof FormData ? undefined : { "Content-Type": "application/json" },
    ...options,
  });
  let data = null;
  try {
    data = await res.json();
  } catch {
    // no body
  }
  if (!res.ok) {
    throw new Error((data && data.error) || "درخواست با خطا مواجه شد.");
  }
  return data;
}

export const api = {
  getWorks: () => request("/works"),
  getWork: (id) => request(`/works/${id}`),
  getChapterPages: (chapterId) => request(`/chapters/${chapterId}/pages`),
  getGenres: () => request("/genres"),
  me: () => request("/me"),
  login: (username, password) =>
    request("/login", { method: "POST", body: JSON.stringify({ username, password }) }),
  register: (username, password) =>
    request("/register", { method: "POST", body: JSON.stringify({ username, password }) }),
  logout: () => request("/logout", { method: "POST" }),
  toggleFavorite: (workId) => request(`/works/${workId}/favorite`, { method: "POST" }),

  adminCreateWork: (formData) => request("/admin/works", { method: "POST", body: formData }),
  adminUpdateWork: (id, formData) => request(`/admin/works/${id}`, { method: "PUT", body: formData }),
  adminDeleteWork: (id) => request(`/admin/works/${id}`, { method: "DELETE" }),
  adminCreateChapter: (workId, number, title) =>
    request(`/admin/works/${workId}/chapters`, {
      method: "POST",
      body: JSON.stringify({ number, title }),
    }),
  adminDeleteChapter: (id) => request(`/admin/chapters/${id}`, { method: "DELETE" }),
  adminUploadPages: (workId, chapterId, formData) =>
    request(`/admin/works/${workId}/chapters/${chapterId}/pages`, { method: "POST", body: formData }),
};
