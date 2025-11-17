import React, { useState, useEffect, useCallback } from "react";
import { Routes, Route, useNavigate, Navigate } from "react-router-dom";
import axios from "axios";
import Login from "./Login";
import Register from "./Register";
import Dashboard from "./Dashboard";
import AdminDashboard from "./AdminDashboard";
import Profile from "./Profile";   // ⭐ ADDED

// Fallback URL
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // --------------------
  // LOGOUT
  // --------------------
  const handleLogout = useCallback(() => {
    localStorage.removeItem("token");
    setToken(null);
    setCurrentUser(null);
    navigate("/login");
  }, [navigate]);

  // --------------------
  // FETCH CURRENT USER
  // --------------------
  useEffect(() => {
    const fetchUser = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await axios.get(`${API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCurrentUser(res.data);
      } catch (err) {
        console.error("Invalid/expired token", err);
        handleLogout();
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [token, handleLogout]);

  // --------------------
  // LOGIN SUCCESS
  // --------------------
  const handleLoginSuccess = (data) => {
    localStorage.setItem("token", data.access_token);
    setToken(data.access_token);
    navigate("/dashboard");
  };

  // --------------------
  // WAIT FOR LOADING
  // --------------------
  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          fontSize: "1.2rem",
        }}
      >
        Loading...
      </div>
    );
  }

  // --------------------
  // ROUTER
  // --------------------
  return (
    <Routes>
      {/* LOGIN */}
      <Route
        path="/login"
        element={
          !token ? (
            <Login onLoginSuccess={handleLoginSuccess} />
          ) : (
            <Navigate to="/dashboard" replace />
          )
        }
      />

      {/* REGISTER */}
      <Route
        path="/register"
        element={!token ? <Register /> : <Navigate to="/dashboard" replace />}
      />

      {/* PROFILE PAGE ⭐ */}
      <Route
        path="/profile"
        element={
          token && currentUser ? (
            <Profile user={currentUser} token={token} />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      {/* DASHBOARD → ADMIN OR NORMAL */}
      <Route
        path="/dashboard"
        element={
          token && currentUser ? (
            currentUser.role === "admin" ? (
              <AdminDashboard
                user={currentUser}
                token={token}
                onLogout={handleLogout}
              />
            ) : (
              <Dashboard
                user={currentUser}
                token={token}
                onLogout={handleLogout}
                apiUrl={API_URL}
              />
            )
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      {/* DEFAULT */}
      <Route
        path="/"
        element={
          token ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
    </Routes>
  );
}

export default App;
