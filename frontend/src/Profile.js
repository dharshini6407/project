import React, { useMemo } from "react";
import dayjs from "dayjs";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

// Avatar component reused
function Avatar({ name, size = 80 }) {
  const initials = (name || "U")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  return (
    <div
      style={{ width: size, height: size }}
      className="rounded-full bg-gradient-to-br from-blue-500 to-teal-400 flex items-center justify-center text-white font-bold text-3xl"
    >
      {initials}
    </div>
  );
}

export default function Profile({ user, token }) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* BACK BUTTON */}
      <button
        onClick={() => navigate("/dashboard")}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4"
      >
        <ArrowLeft size={18} /> Back to Dashboard
      </button>

      {/* PROFILE CARD */}
      <div className="max-w-3xl mx-auto bg-white shadow-lg rounded-2xl p-8">
        <div className="flex items-center gap-6">
          <Avatar name={user?.name} size={90} />

          <div>
            <h1 className="text-3xl font-bold">{user?.name}</h1>
            <p className="text-gray-600 text-sm">
              {user?.department} • {user?.role}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Email: {user?.email}
            </p>
          </div>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
          <div className="bg-gray-50 p-4 rounded-xl">
            <p className="text-xs text-gray-500">Shoutouts Sent</p>
            <p className="text-2xl font-semibold">{user?.stats?.sent || 0}</p>
          </div>

          <div className="bg-gray-50 p-4 rounded-xl">
            <p className="text-xs text-gray-500">Shoutouts Received</p>
            <p className="text-2xl font-semibold">
              {user?.stats?.received || 0}
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded-xl">
            <p className="text-xs text-gray-500">Total Reactions</p>
            <p className="text-2xl font-semibold">
              {user?.stats?.reactions || 0}
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded-xl">
            <p className="text-xs text-gray-500">Reaction Score</p>
            <p className="text-2xl font-semibold">
              {user?.stats?.reactionScore || 0}
            </p>
          </div>
        </div>

        {/* OPTIONAL FUTURE SECTIONS */}
        <div className="mt-10 text-sm text-gray-500 italic">
          More profile insights coming soon…
        </div>
      </div>
    </div>
  );
}
