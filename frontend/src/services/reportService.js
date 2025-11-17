// src/services/reportService.js

const API_BASE_URL = "http://127.0.0.1:8000";

export async function createReport(shoutoutId, reason, token) {
  const res = await fetch(`${API_BASE_URL}/reports/${shoutoutId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      reason: reason,   // <-- REQUIRED FORMAT
    }),
  });

  const text = await res.text();  // log raw backend text (helps debug)
  console.log("RAW RESPONSE:", text);

  if (!res.ok) {
    throw new Error(`Report failed: ${res.status} - ${text}`);
  }

  return JSON.parse(text);
}
