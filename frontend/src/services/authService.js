// src/services/authService.js
import api from "./api";

export const login = async (credentials) => {
  const res = await api.post("/auth/login", credentials);
  const accessToken = res.data?.access_token;
  const refreshToken = res.data?.refresh_token;

  if (accessToken) localStorage.setItem("accessToken", accessToken);
  if (refreshToken) localStorage.setItem("refreshToken", refreshToken);

  return res.data;
};

export const getMe = async () => {
  const res = await api.get("/auth/me");
  return res.data;
};

export const logout = () => {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
};
