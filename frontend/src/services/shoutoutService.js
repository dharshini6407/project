// src/services/shoutoutService.js
import api from "./api";

/**
 * Helper function to create the authorization config
 */
const getConfig = (token) => {
  if (!token) console.error("No token provided for API request");
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

// --- Fetch all shoutouts ---
export const getAllShoutouts = async (token) => {
  const res = await api.get("/shoutouts/", getConfig(token));
  return res.data;
};

// --- Create a new shoutout ---
export const createShoutout = async (payload, token) => {
  const res = await api.post("/shoutouts/", payload, getConfig(token));
  return res.data;
};

// --- Add reaction ---
export const addReaction = async (shoutoutId, payload, token) => {
  const res = await api.post(`/reactions/${shoutoutId}`, payload, getConfig(token));
  return res.data;
};

// --- Add comment ---
export const addComment = async (shoutoutId, payload, token) => {
  const res = await api.post(`/comments/${shoutoutId}`, payload, getConfig(token));
  return res.data;
};

// --- Get comments for a shoutout ---
export const getComments = async (shoutoutId, token) => {
  const res = await api.get(`/comments/${shoutoutId}`, getConfig(token));
  return res.data;
};

// --- ⭐ FLAG A COMMENT ⭐ ---
export const flagComment = async (commentId, reason, token) => {
  const res = await api.post(
    `/comments/${commentId}/flag`,
    { reason },
    getConfig(token)
  );
  return res.data;
};
