// src/services/adminService.js
const API_BASE_URL = "http://127.0.0.1:8000";

const authHeaders = (token) => ({
  "Content-Type": "application/json",
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
});

// Generic fetch helper
async function request(path, { method = "GET", token, body } = {}) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: authHeaders(token),
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  if (!res.ok) {
    let msg = `Request failed ${res.status}`;
    try {
      const text = await res.text();
      if (text) msg = text;
    } catch (_) {}
    throw new Error(msg);
  }

  // 204 No Content
  if (res.status === 204) return null;
  return res.json();
}

// Normalise different shapes of "comments" responses
function normalizeComments(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.comments)) return data.comments;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.results)) return data.results;
  return [];
}

/* -----------------------------------------------------
   REPORTS
----------------------------------------------------- */

export async function getReports(token) {
  return request("/admin/reports", { token });
}

export async function deleteReportAdmin(reportId, token) {
  return request(`/admin/reports/${reportId}`, {
    method: "DELETE",
    token,
  });
}

/* -----------------------------------------------------
   SHOUTOUTS
----------------------------------------------------- */

export async function deleteShoutoutAdmin(shoutoutId, token) {
  return request(`/admin/shoutouts/${shoutoutId}`, {
    method: "DELETE",
    token,
  });
}

/* -----------------------------------------------------
   USERS
----------------------------------------------------- */

export async function getAllUsersAdmin(token) {
  return request("/admin/users", { token });
}

export async function updateUserRoleAdmin(userId, role, token) {
  return request(`/admin/users/${userId}/role`, {
    method: "PATCH",
    token,
    body: { role },
  });
}

export async function toggleUserActiveAdmin(userId, token) {
  return request(`/admin/users/${userId}/active`, {
    method: "PATCH",
    token,
  });
}

export async function deleteUserAdmin(userId, token) {
  return request(`/admin/users/${userId}`, {
    method: "DELETE",
    token,
  });
}

/* -----------------------------------------------------
   COMMENTS
----------------------------------------------------- */

export async function getAllCommentsAdmin(token) {
  const data = await request("/admin/comments", { token });
  return normalizeComments(data);
}

export async function getFlaggedCommentsAdmin(token) {
  const data = await request("/admin/comments/flagged", { token });
  return normalizeComments(data);
}

export async function deleteCommentAdmin(commentId, token) {
  return request(`/admin/comments/${commentId}`, {
    method: "DELETE",
    token,
  });
}

export async function blockUserAdmin(userId, token) {
  return request(`/admin/users/${userId}/block`, {
    method: "POST",
    token,
  });
}
