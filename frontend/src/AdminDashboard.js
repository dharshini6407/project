// src/AdminDashboard.js
import React, { useState, useEffect, useMemo } from "react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import {
  getAllShoutouts,
  addReaction,
  addComment,
  getComments,
} from "./services/shoutoutService";
import {
  getReports,
  deleteShoutoutAdmin,
  deleteReportAdmin,
  getAllUsersAdmin,
  updateUserRoleAdmin,
  toggleUserActiveAdmin,
  deleteUserAdmin,
  getAllCommentsAdmin,
  getFlaggedCommentsAdmin,
  deleteCommentAdmin,
} from "./services/adminService";
import { Heart, PartyPopper, Sparkles, MessageCircle } from "lucide-react";

dayjs.extend(relativeTime);

/* ---------- SMALL UI PIECES ---------- */

function BragboardLogo({ size = 40 }) {
  return (
    <div className="flex items-center gap-3">
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="rounded-full"
      >
        <defs>
          <linearGradient id="admin-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#06b6d4" />
            <stop offset="100%" stopColor="#7c3aed" />
          </linearGradient>
        </defs>
        <rect rx="10" width="48" height="48" fill="url(#admin-grad)" />
        <path
          d="M14 27c2-4 6-6 10-6s8 2 10 6"
          stroke="white"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="24" cy="16" r="3.6" fill="white" />
      </svg>
      <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-teal-500 bg-clip-text text-transparent select-none">
        BragBoard Admin
      </span>
    </div>
  );
}

function Avatar({ name, size = 40 }) {
  const initials = (name || "U")
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div
      style={{ width: size, height: size }}
      className="flex items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-white font-bold"
    >
      {initials}
    </div>
  );
}

function StatCard({ title, value }) {
  return (
    <div className="bg-white rounded-xl shadow p-4">
      <div className="text-xs text-gray-500">{title}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
    </div>
  );
}

function Leaderboard({ title, data }) {
  return (
    <div className="bg-white rounded-xl shadow p-4">
      <h2 className="text-sm font-semibold text-gray-700 mb-3">{title}</h2>
      {data.length === 0 ? (
        <p className="text-xs text-gray-500">No data yet</p>
      ) : (
        <ul className="space-y-2 text-sm">
          {data.map((u) => (
            <li
              key={u.id}
              className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2"
            >
              <div className="flex items-center gap-3">
                <Avatar name={u.name} size={32} />
                <div>
                  <div className="font-semibold">{u.name}</div>
                  <div className="text-xs text-gray-500">{u.department}</div>
                </div>
              </div>
              <div className="text-xs font-semibold text-emerald-700">
                {title.includes("Tagged")
                  ? `${u.taggedCount} tags`
                  : `${u.points} pts`}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ---------- TABLES ---------- */

function ModerationTable({ reports, loading, onResolve, onDeleteShoutout }) {
  return (
    <>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-gray-700">
          Reported Shout-outs
        </h2>
        <div className="text-xs text-gray-500">
          {loading ? "Updating..." : `${reports.length} reports`}
        </div>
      </div>

      {reports.length === 0 ? (
        <p className="text-xs text-gray-500">🎉 No reported shout-outs</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs">
            <thead>
              <tr className="bg-gray-50 text-gray-500">
                <th className="text-left px-3 py-2">Shout-out</th>
                <th className="text-left px-3 py-2">Sender</th>
                <th className="text-left px-3 py-2">Reported By</th>
                <th className="text-left px-3 py-2">Reason</th>
                <th className="text-left px-3 py-2">Date</th>
                <th className="text-right px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((rep) => {
                const s = rep.shoutout;
                const snippet =
                  s?.message?.length > 60
                    ? s.message.slice(0, 60) + "..."
                    : s?.message || "(no content)";
                return (
                  <tr key={rep.id} className="border-t hover:bg-gray-50">
                    <td className="px-3 py-2">{snippet}</td>
                    <td className="px-3 py-2">{s?.sender?.name}</td>
                    <td className="px-3 py-2">
                      {rep.reported_by?.name || rep.reported_by_name || "—"}
                    </td>
                    <td className="px-3 py-2">{rep.reason}</td>
                    <td className="px-3 py-2">
                      {dayjs(rep.created_at).format("MMM D, YYYY • h:mm A")}
                    </td>
                    <td className="px-3 py-2 text-right space-x-2">
                      <button
                        onClick={() => onResolve(rep.id)}
                        className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded hover:bg-emerald-200 text-[11px]"
                      >
                        Resolve
                      </button>
                      <button
                        onClick={() => onDeleteShoutout(s.id)}
                        className="px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 text-[11px]"
                      >
                        Delete Post
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

function UsersTable({ users, onRole, onToggle, onDelete }) {
  return (
    <div className="overflow-x-auto">
      <h2 className="text-sm font-semibold text-gray-700 mb-3">Users</h2>
      <table className="min-w-full text-xs">
        <thead>
          <tr className="bg-gray-50 text-gray-500">
            <th className="px-3 py-2 text-left">Name</th>
            <th className="px-3 py-2 text-left">Department</th>
            <th className="px-3 py-2 text-left">Role</th>
            <th className="px-3 py-2 text-left">Active</th>
            <th className="px-3 py-2 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="border-t hover:bg-gray-50">
              <td className="px-3 py-2">{u.name}</td>
              <td className="px-3 py-2">{u.department}</td>
              <td className="px-3 py-2">
                <select
                  value={u.role}
                  onChange={(e) => onRole(u.id, e.target.value)}
                  className="border rounded px-2 py-1 text-xs"
                >
                  <option value="employee">Employee</option>
                  <option value="admin">Admin</option>
                </select>
              </td>
              <td className="px-3 py-2">
                <button
                  onClick={() => onToggle(u.id)}
                  className={`px-2 py-1 rounded text-white text-[11px] ${
                    u.is_active
                      ? "bg-emerald-600 hover:bg-emerald-700"
                      : "bg-gray-500 hover:bg-gray-600"
                  }`}
                >
                  {u.is_active ? "Active" : "Inactive"}
                </button>
              </td>
              <td className="px-3 py-2 text-right">
                <button
                  onClick={() => onDelete(u.id)}
                  className="px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 text-[11px]"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Generic comments table.
 * If `flaggedMode` is true -> shows flagged-by + reason.
 */
function CommentsTable({ comments, onDelete, flaggedMode = false }) {
  const hasData = comments && comments.length > 0;

  return (
    <div>
      <h2 className="text-sm font-semibold text-gray-700 mb-3">
        {flaggedMode ? "Flagged / Toxic Comments" : "All Comments"}
      </h2>

      {!hasData ? (
        <p className="text-xs text-gray-500">
          {flaggedMode ? "🎉 No flagged comments" : "No comments available"}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs">
            <thead>
              <tr className="bg-gray-50 text-gray-500">
                <th className="px-3 py-2 text-left">User</th>
                {flaggedMode && (
                  <th className="px-3 py-2 text-left">Flagged By</th>
                )}
                <th className="px-3 py-2 text-left">Comment</th>
                {flaggedMode && (
                  <th className="px-3 py-2 text-left">Reason</th>
                )}
                <th className="px-3 py-2 text-left">Date</th>
                <th className="px-3 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {comments.map((c) => (
                <tr key={c.id} className="border-t hover:bg-gray-50">
                  <td className="px-3 py-2">{c.user?.name}</td>
                  {flaggedMode && (
                    <td className="px-3 py-2">
                      {c.flagged_by?.name ||
                        c.flaggedBy?.name ||
                        c.flagged_user?.name ||
                        c.flagged_by_user?.name ||
                        c.reported_by?.name ||
                        c.flagger?.name ||
                        c.flagged_by_name ||
                        c.flaggedByName ||
                        "—"}
                    </td>
                  )}
                  <td className="px-3 py-2">{c.content}</td>
                  {flaggedMode && (
                    <td className="px-3 py-2">{c.flag_reason}</td>
                  )}
                  <td className="px-3 py-2">
                    {dayjs(c.created_at).format("MMM D, h:mm A")}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button
                      onClick={() => onDelete(c.id)}
                      className="px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 text-[11px]"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ---------- MAIN COMPONENT ---------- */

export default function AdminDashboard({
  user = { name: "Admin", department: "HR", role: "admin" },
  token = localStorage.getItem("token"),
  onLogout = () => {},
}) {
  const [shoutouts, setShoutouts] = useState([]);
  const [reports, setReports] = useState([]);
  const [users, setUsers] = useState([]);
  const [comments, setComments] = useState([]);
  const [flaggedComments, setFlaggedComments] = useState([]);

  const [loading, setLoading] = useState(false);
  const [moderationLoading, setModerationLoading] = useState(false);

  const [activeTab, setActiveTab] = useState("feed");

  const [activePostId, setActivePostId] = useState(null);
  const [commentText, setCommentText] = useState("");
  const [taggedUsers, setTaggedUsers] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredUsers, setFilteredUsers] = useState([]);

  const [filterDept, setFilterDept] = useState("all");
  const [filterSender, setFilterSender] = useState("all");
  const [filterDate, setFilterDate] = useState("all");

  useEffect(() => {
    setCommentText("");
    setTaggedUsers([]);
    setShowSuggestions(false);
    setFilteredUsers([]);
  }, [activePostId]);

  /* ---------- LOADERS ---------- */

  const loadShoutouts = async () => {
    setLoading(true);
    try {
      const data = await getAllShoutouts(token);
      const normalized = (Array.isArray(data) ? data : []).map((d) => ({
        ...d,
        reactions: {
          like: 0,
          clap: 0,
          star: 0,
          ...(d.reactions || {}),
        },
        myReactions:
          d.my_reactions || d.user_reactions || d.myReactions || [],
        comments: d.comments || [],
        comments_count:
          d.comments_count ??
          (Array.isArray(d.comments) ? d.comments.length : 0),
      }));
      setShoutouts(normalized);
    } catch (err) {
      console.error("Failed to load shoutouts:", err);
    }
    setLoading(false);
  };

  const loadReports = async () => {
    try {
      const data = await getReports(token);
      setReports(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load reports:", err);
    }
  };

  const loadUsers = async () => {
    try {
      const data = await getAllUsersAdmin(token);
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load users:", err);
    }
  };

// -------- FETCH COMMENTS --------
const loadCommentsAdmin = async () => {
  try {
    const data = await getAllCommentsAdmin(token);
    setComments(data || []);          // no Array.isArray check needed
  } catch (err) {
    console.error("Failed to load comments:", err);
  }
};

// -------- FETCH FLAGGED COMMENTS --------
const loadFlagged = async () => {
  try {
    const data = await getFlaggedCommentsAdmin(token);
    setFlaggedComments(data || []);
  } catch (err) {
    console.error("Failed to load flagged comments:", err);
  }
};

  useEffect(() => {
    if (!token) return;
    loadShoutouts();
    loadReports();
    loadUsers();
    loadCommentsAdmin();
    loadFlagged();
  }, [token]);

  /* ---------- STATS ---------- */

  const { totalUsers, totalShoutouts, totalComments, totalReactions } =
    useMemo(() => {
      const userIds = new Set();
      let reactionCount = 0;

      shoutouts.forEach((s) => {
        if (s.sender?.id) userIds.add(s.sender.id);
        (s.recipients || []).forEach((r) => r.id && userIds.add(r.id));

        reactionCount +=
          (s.reactions?.like || 0) +
          (s.reactions?.clap || 0) +
          (s.reactions?.star || 0);
      });

      return {
        totalUsers: userIds.size,
        totalShoutouts: shoutouts.length,
        totalComments: comments.length,
        totalReactions: reactionCount,
      };
    }, [shoutouts, comments]);

  const topContributors = useMemo(() => {
    const map = {};
    shoutouts.forEach((s) => {
      if (s.sender?.id) {
        if (!map[s.sender.id]) {
          map[s.sender.id] = {
            id: s.sender.id,
            name: s.sender.name,
            department: s.sender.department,
            sent: 0,
            received: 0,
            points: 0,
          };
        }
        map[s.sender.id].sent += 1;
        map[s.sender.id].points += 5;
      }
      (s.recipients || []).forEach((r) => {
        if (!map[r.id]) {
          map[r.id] = {
            id: r.id,
            name: r.name,
            department: r.department,
            sent: 0,
            received: 0,
            points: 0,
          };
        }
        map[r.id].received += 1;
        map[r.id].points += 2;
      });
    });
    return Object.values(map)
      .sort((a, b) => b.points - a.points)
      .slice(0, 5);
  }, [shoutouts]);

  const mostTagged = useMemo(() => {
    const map = {};
    shoutouts.forEach((s) =>
      (s.recipients || []).forEach((r) => {
        if (!map[r.id]) {
          map[r.id] = {
            id: r.id,
            name: r.name,
            department: r.department,
            taggedCount: 0,
          };
        }
        map[r.id].taggedCount += 1;
      })
    );
    return Object.values(map)
      .sort((a, b) => b.taggedCount - a.taggedCount)
      .slice(0, 5);
  }, [shoutouts]);

  /* ---------- FEED HELPERS ---------- */

  const loadCommentsForPost = async (postId) => {
    try {
      const postComments = await getComments(postId, token);
      setShoutouts((prev) =>
        prev.map((s) =>
          s.id === postId
            ? {
                ...s,
                comments: postComments,
                comments_count: postComments.length,
              }
            : s
        )
      );
    } catch (err) {
      console.error("Failed to fetch comments:", err);
    }
  };

  const toggleReaction = async (postId, type) => {
    let snapshot = null;
    try {
      setShoutouts((prev) => {
        snapshot = prev;
        return prev.map((s) => {
          if (s.id !== postId) return s;
          const reactions = { ...s.reactions };
          const my = Array.isArray(s.myReactions) ? s.myReactions : [];
          const has = my.includes(type);
          const newCount = Math.max(
            0,
            (reactions[type] || 0) + (has ? -1 : 1)
          );
          const newMy = has ? my.filter((t) => t !== type) : [...my, type];
          return {
            ...s,
            reactions: { ...reactions, [type]: newCount },
            myReactions: newMy,
          };
        });
      });

      const res = await addReaction(postId, { type }, token);
      if (res && res.id) {
        setShoutouts((prev) =>
          prev.map((s) =>
            s.id === res.id
              ? {
                  ...s,
                  ...res,
                  myReactions: res.my_reactions || s.myReactions,
                }
              : s
          )
        );
      }
    } catch (err) {
      console.error("Failed to toggle reaction:", err);
      if (snapshot) setShoutouts(snapshot);
    }
  };

  const highlightTags = (text = "") => {
    const regex = /(@[A-Za-z]+(?: [A-Za-z]+)?)/g;
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? (
        <span
          key={i}
          className="text-blue-600 font-semibold bg-blue-50 px-1.5 py-0.5 rounded-md"
        >
          {part}
        </span>
      ) : (
        <React.Fragment key={i}>{part}</React.Fragment>
      )
    );
  };

  const handleAddComment = async (postId) => {
    if (!commentText.trim()) return;
    try {
      await addComment(
        postId,
        {
          content: commentText.trim(),
          tagged_user_ids: taggedUsers.map((u) => u.id),
        },
        token
      );
      await loadCommentsForPost(postId);
      setCommentText("");
      setTaggedUsers([]);
      setShowSuggestions(false);
      setFilteredUsers([]);
    } catch (err) {
      console.error("Failed to add comment:", err);
    }
  };

  const handleCommentChange = (e) => {
    const value = e.target.value;
    setCommentText(value);

    const atIndex = value.lastIndexOf("@");
    if (atIndex >= 0) {
      const query = value.slice(atIndex + 1).toLowerCase();
      if (query.length > 0) {
        const matches = users.filter((u) =>
          (u.name || "").toLowerCase().includes(query)
        );
        setFilteredUsers(matches);
        setShowSuggestions(matches.length > 0);
      } else {
        setShowSuggestions(false);
        setFilteredUsers([]);
      }
    } else {
      setShowSuggestions(false);
      setFilteredUsers([]);
    }
  };

  const handleTagSelect = (selectedUser) => {
    const atIndex = commentText.lastIndexOf("@");
    const newText =
      commentText.slice(0, atIndex + 1) +
      selectedUser.name +
      " " +
      commentText.slice(atIndex + 1);

    setCommentText(newText);
    setTaggedUsers((prev) =>
      prev.find((p) => p.id === selectedUser.id)
        ? prev
        : [...prev, selectedUser]
    );
    setShowSuggestions(false);
  };

  /* ---------- ADMIN ACTIONS ---------- */

  const handleResolveReport = async (id) => {
    if (!window.confirm("Mark this report as resolved?")) return;
    setModerationLoading(true);
    try {
      await deleteReportAdmin(id, token);
      await loadReports();
    } catch (err) {
      console.error("Failed to resolve report:", err);
    }
    setModerationLoading(false);
  };

  const handleDeleteShoutout = async (id) => {
    if (!window.confirm("Delete this shoutout?")) return;
    setModerationLoading(true);
    try {
      await deleteShoutoutAdmin(id, token);
      await Promise.all([loadShoutouts(), loadReports()]);
    } catch (err) {
      console.error("Failed to delete shoutout:", err);
    }
    setModerationLoading(false);
  };

  const handleRoleChange = async (userId, role) => {
    try {
      await updateUserRoleAdmin(userId, role, token);
      await loadUsers();
    } catch (err) {
      console.error("Failed:", err);
    }
  };

  const handleToggleActive = async (userId) => {
    try {
      await toggleUserActiveAdmin(userId, token);
      await loadUsers();
    } catch (err) {
      console.error("Failed:", err);
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm("Delete user?")) return;
    try {
      await deleteUserAdmin(id, token);
      await loadUsers();
    } catch (err) {
      console.error("Failed:", err);
    }
  };

  const handleDeleteComment = async (id) => {
    if (!window.confirm("Delete this comment?")) return;
    try {
      await deleteCommentAdmin(id, token);
      await Promise.all([loadCommentsAdmin(), loadFlagged()]);
    } catch (err) {
      console.error("Failed:", err);
    }
  };

  /* ---------- FILTERED FEED ---------- */

  const filteredShoutouts = useMemo(() => {
    return shoutouts.filter((post) => {
      if (
        filterDept !== "all" &&
        post.sender?.department !== filterDept
      )
        return false;
      if (filterSender !== "all" && post.sender?.name !== filterSender)
        return false;

      const created = dayjs(post.created_at);
      if (filterDate === "today" && !created.isSame(dayjs(), "day"))
        return false;
      if (filterDate === "week" && !created.isSame(dayjs(), "week"))
        return false;
      if (filterDate === "month" && !created.isSame(dayjs(), "month"))
        return false;

      return true;
    });
  }, [shoutouts, filterDept, filterSender, filterDate]);

  const departmentOptions = useMemo(
    () =>
      Array.from(
        new Set(
          shoutouts
            .map((s) => s.sender?.department)
            .filter((d) => d && d !== "")
        )
      ),
    [shoutouts]
  );

  const senderOptions = useMemo(
    () =>
      Array.from(
        new Set(
          shoutouts
            .map((s) => s.sender?.name)
            .filter((n) => n && n !== "")
        )
      ),
    [shoutouts]
  );

  /* ---------- RENDER ---------- */

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="w-full bg-white shadow-sm py-3 px-6 flex items-center justify-between sticky top-0 z-20">
        <BragboardLogo size={36} />
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex flex-col items-end text-right">
            <span className="text-sm font-semibold">{user.name}</span>
            <span className="text-xs text-gray-500">
              {user.department} • {user.role}
            </span>
          </div>
          <Avatar name={user.name} size={40} />
          <button
            onClick={onLogout}
            className="ml-4 px-3 py-1.5 text-xs rounded bg-red-600 text-white hover:bg-red-700"
          >
            Log out
          </button>
        </div>
      </header>

      <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-6">
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Users" value={totalUsers} />
          <StatCard title="Total Shout-outs" value={totalShoutouts} />
          <StatCard title="Total Comments" value={totalComments} />
          <StatCard title="Total Reactions" value={totalReactions} />
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Leaderboard title="Top Contributors" data={topContributors} />
          <Leaderboard title="Most Tagged Employees" data={mostTagged} />
        </section>

        <div className="flex gap-3 border-b pb-2 mt-6">
          {[
            { id: "feed", label: "Feed" },
            { id: "reports", label: "Reports" },
            { id: "users", label: "Users" },
            { id: "comments", label: "Comments" },
            { id: "flagged", label: "Flagged" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`text-sm pb-2 px-3 ${
                activeTab === tab.id
                  ? "border-b-2 border-blue-600 text-blue-600 font-semibold"
                  : "text-gray-600"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <section className="bg-white rounded-xl shadow p-4">
          {activeTab === "feed" && (
            <>
              <div className="bg-white mb-4 flex flex-wrap gap-6 items-end">
                <div className="flex flex-col">
                  <label className="text-xs text-gray-500 mb-1">
                    Department
                  </label>
                  <select
                    value={filterDept}
                    onChange={(e) => setFilterDept(e.target.value)}
                    className="border p-2 rounded w-44"
                  >
                    <option value="all">All</option>
                    {departmentOptions.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col">
                  <label className="text-xs text-gray-500 mb-1">
                    Sender
                  </label>
                  <select
                    value={filterSender}
                    onChange={(e) => setFilterSender(e.target.value)}
                    className="border p-2 rounded w-44"
                  >
                    <option value="all">All</option>
                    {senderOptions.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col">
                  <label className="text-xs text-gray-500 mb-1">Date</label>
                  <select
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                    className="border p-2 rounded w-44"
                  >
                    <option value="all">All Time</option>
                    <option value="today">Today</option>
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between mb-4 mt-1">
                <h2 className="text-lg font-semibold">Recognition Feed</h2>
                <div className="text-sm text-gray-500">
                  {loading ? "Loading..." : `${filteredShoutouts.length} posts`}
                </div>
              </div>

              <div className="space-y-4">
                {filteredShoutouts.map((post) => {
                  const commentsCount =
                    post.comments_count ??
                    (post.comments ? post.comments.length : 0);

                  return (
                    <article
                      key={post.id}
                      className="bg-white rounded-2xl p-4 shadow hover:shadow-md transition border border-gray-100"
                    >
                      <div className="flex gap-3">
                        <Avatar name={post.sender?.name} size={48} />
                        <div className="flex-1">
                          <div className="font-semibold">
                            {post.sender?.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {post.sender?.department} •{" "}
                            {dayjs(post.created_at).format("MMM D, h:mm A")}
                          </div>

                          <p className="mt-3 text-gray-800">
                            {post.message}
                          </p>

                          <div className="mt-3 text-sm text-gray-600">
                            To:{" "}
                            <strong className="text-gray-800">
                              {(post.recipients || [])
                                .map((r) => r.name)
                                .join(", ") || "All"}
                            </strong>
                          </div>

                          <div className="mt-3 flex items-center gap-5 text-sm text-gray-600">
                            <button
                              onClick={() => toggleReaction(post.id, "like")}
                              className={`flex items-center gap-2 px-2 py-1 rounded hover:bg-pink-100 transition ${
                                post.myReactions?.includes("like")
                                  ? "text-pink-700 font-semibold"
                                  : "text-pink-600"
                              }`}
                            >
                              <Heart size={18} fill="currentColor" />
                              <span>{post.reactions?.like || 0}</span>
                            </button>

                            <button
                              onClick={() => toggleReaction(post.id, "clap")}
                              className={`flex items-center gap-2 px-2 py-1 rounded hover:bg-yellow-100 transition ${
                                post.myReactions?.includes("clap")
                                  ? "text-yellow-700 font-semibold"
                                  : "text-yellow-600"
                              }`}
                            >
                              <PartyPopper size={18} />
                              <span>{post.reactions?.clap || 0}</span>
                            </button>

                            <button
                              onClick={() => toggleReaction(post.id, "star")}
                              className={`flex items-center gap-2 px-2 py-1 rounded hover:bg-indigo-100 transition ${
                                post.myReactions?.includes("star")
                                  ? "text-indigo-800 font-semibold"
                                  : "text-indigo-600"
                              }`}
                            >
                              <Sparkles size={18} />
                              <span>{post.reactions?.star || 0}</span>
                            </button>

                            <button
                              onClick={() => {
                                const next =
                                  post.id === activePostId ? null : post.id;
                                setActivePostId(next);
                                if (next) loadCommentsForPost(post.id);
                              }}
                              className="flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-100 ml-auto text-gray-500 transition"
                            >
                              <MessageCircle size={18} />
                              <span>{commentsCount} comments</span>
                            </button>
                          </div>

                          {activePostId === post.id && (
                            <div className="mt-3 border-t pt-3 space-y-2">
                              {(!post.comments || post.comments.length === 0) ? (
                                <div className="text-xs text-gray-500">
                                  No comments yet — add one!
                                </div>
                              ) : (
                                post.comments.map((c) => (
                                  <div
                                    key={c.id}
                                    className="flex gap-2 items-start"
                                  >
                                    <Avatar name={c.user?.name} size={32} />
                                    <div className="bg-gray-50 rounded-xl px-3 py-2 w-full">
                                      <div className="text-sm font-semibold">
                                        {c.user?.name}
                                      </div>
                                      <div className="text-sm text-gray-700">
                                        {highlightTags(c.content)}
                                      </div>
                                      <div className="text-xs text-gray-400 mt-1">
                                        {dayjs(c.created_at).fromNow()}
                                      </div>
                                    </div>
                                  </div>
                                ))
                              )}

                              <div className="flex gap-2 mt-2 items-start">
                                <Avatar name={user?.name} size={34} />
                                <div className="relative flex-1">
                                  <input
                                    value={commentText}
                                    onChange={handleCommentChange}
                                    onKeyDown={(e) =>
                                      e.key === "Enter" &&
                                      handleAddComment(post.id)
                                    }
                                    placeholder="Write a comment... (use @ to tag)"
                                    className="w-full p-2 rounded-full border border-gray-300 focus:ring-1 focus:ring-blue-400 text-sm"
                                  />
                                  {showSuggestions && (
                                    <ul className="absolute z-10 bg-white border rounded shadow mt-1 w-full max-h-40 overflow-y-auto">
                                      {filteredUsers.map((u) => (
                                        <li
                                          key={u.id}
                                          onClick={() => handleTagSelect(u)}
                                          className="px-3 py-1 hover:bg-blue-100 cursor-pointer"
                                        >
                                          {u.name}{" "}
                                          <span className="text-xs text-gray-500">
                                            ({u.department})
                                          </span>
                                        </li>
                                      ))}
                                    </ul>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </>
          )}

          {activeTab === "reports" && (
            <ModerationTable
              reports={reports}
              loading={moderationLoading}
              onResolve={handleResolveReport}
              onDeleteShoutout={handleDeleteShoutout}
            />
          )}

          {activeTab === "users" && (
            <UsersTable
              users={users}
              onRole={handleRoleChange}
              onToggle={handleToggleActive}
              onDelete={handleDeleteUser}
            />
          )}

          {activeTab === "comments" && (
            <CommentsTable
              comments={comments}
              onDelete={handleDeleteComment}
              flaggedMode={false}
            />
          )}

          {activeTab === "flagged" && (
            <CommentsTable
              comments={flaggedComments}
              onDelete={handleDeleteComment}
              flaggedMode={true}
            />
          )}
        </section>
      </div>
    </div>
  );
}
