// src/Dashboard.js
import React, { useState, useMemo, useEffect } from "react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

import {
  getAllShoutouts,
  createShoutout,
  addReaction,
  addComment,
  getComments,
  flagComment, // ⭐ New
} from "./services/shoutoutService";

import { createReport } from "./services/reportService";

import {
  Heart,
  PartyPopper,
  Sparkles,
  MessageCircle,
  Flag,
} from "lucide-react";

dayjs.extend(relativeTime);

// ---------- BRAGBOARD LOGO ----------
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
          <linearGradient id="grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#06b6d4" />
            <stop offset="100%" stopColor="#7c3aed" />
          </linearGradient>
        </defs>
        <rect rx="10" width="48" height="48" fill="url(#grad)" />
        <path
          d="M14 27c2-4 6-6 10-6s8 2 10 6"
          stroke="white"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="24" cy="16" r="3.6" fill="white" />
      </svg>
      <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-teal-500 bg-clip-text text-transparent">
        BragBoard
      </span>
    </div>
  );
}

// ---------- AVATAR ----------
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
      className="flex items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-teal-400 text-white font-bold"
    >
      {initials}
    </div>
  );
}

// ---------- MAIN COMPONENT ----------
export default function Dashboard({
  user = { name: "You", department: "General", role: "employee" },
  token = localStorage.getItem("token"),
  onLogout = () => {},
}) {
  const [users, setUsers] = useState([]);
  const [shoutouts, setShoutouts] = useState([]);
  const [loading, setLoading] = useState(false);

  const [activePostId, setActivePostId] = useState(null);
  const [commentText, setCommentText] = useState("");

  const [showNewModal, setShowNewModal] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [newRecipients, setNewRecipients] = useState([]);

  // --- REPORT SHOUTOUT STATE ---
  const [reportModal, setReportModal] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportPostId, setReportPostId] = useState(null);

  // --- ⭐ FLAG COMMENT STATE ⭐ ---
  const [flagModal, setFlagModal] = useState(false);
  const [flagReason, setFlagReason] = useState("");
  const [flagCommentId, setFlagCommentId] = useState(null);
  const [flagCommentData, setFlagCommentData] = useState(null);

  // Tagging
  const [taggedUsers, setTaggedUsers] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [mentionQuery, setMentionQuery] = useState("");

  // Filters
  const [filterDept, setFilterDept] = useState("all");
  const [filterSender, setFilterSender] = useState("all");
  const [filterDate, setFilterDate] = useState("all");

  // PROFILE OVERLAY
  const [profileUser, setProfileUser] = useState(null);

  // Reset comment box when switching posts
  useEffect(() => {
    setCommentText("");
    setTaggedUsers([]);
    setShowSuggestions(false);
    setFilteredUsers([]);
    setMentionQuery("");
  }, [activePostId]);

  // =============== FETCH SHOUTOUTS ===============
  useEffect(() => {
    const fetchShoutouts = async () => {
      try {
        setLoading(true);
        const data = await getAllShoutouts(token);

        const normalized = Array.isArray(data)
          ? data.map((d) => ({
              ...d,
              reactions: {
                like: d.reactions?.like || 0,
                clap: d.reactions?.clap || 0,
                star: d.reactions?.star || 0,
              },
              myReactions:
                d.my_reactions || d.user_reactions || d.myReactions || [],
            }))
          : [];

        setShoutouts(normalized);

        // Build user list
        const userMap = new Map();
        normalized.forEach((s) => {
          if (s.sender) userMap.set(s.sender.id, s.sender);
          (s.recipients || []).forEach((r) => userMap.set(r.id, r));
        });

        setUsers(Array.from(userMap.values()));
      } catch (err) {
        console.error("Failed to load shoutouts:", err);
      } finally {
        setLoading(false);
      }
    };

    if (token) fetchShoutouts();
  }, [token]);

  // =============== LOAD COMMENTS ===============
  const loadComments = async (postId) => {
    try {
      const comments = await getComments(postId, token);
      setShoutouts((prev) =>
        prev.map((s) => (s.id === postId ? { ...s, comments } : s))
      );
    } catch (err) {
      console.error("Failed to fetch comments:", err);
    }
  };

  // =============== REPORT SHOUTOUT ===============
  const submitReport = async () => {
    if (!reportReason.trim()) return;

    try {
      await createReport(reportPostId, reportReason.trim(), token);
      alert("Reported successfully!");
    } catch (err) {
      console.error("Failed to report:", err);
      alert("Failed to submit report.");
    }

    setReportModal(false);
    setReportReason("");
    setReportPostId(null);
  };

  // =============== ⭐ FLAG COMMENT ⭐ ===============
  const openFlagComment = (comment) => {
    setFlagCommentId(comment.id);
    setFlagCommentData(comment);
    setFlagReason("");
    setFlagModal(true);
  };

  const submitFlagComment = async () => {
    if (!flagReason.trim()) return;

    try {
      await flagComment(flagCommentId, flagReason.trim(), token);
      alert("Comment flagged successfully!");
      if (activePostId) loadComments(activePostId);
    } catch (err) {
      console.error("Failed to flag comment:", err);
      alert("Failed to flag comment.");
    }

    setFlagModal(false);
    setFlagReason("");
    setFlagCommentId(null);
    setFlagCommentData(null);
  };

  // =============== REACTIONS ===============
  const toggleReaction = async (postId, type) => {
    let snapshot = null;

    try {
      setShoutouts((prev) => {
        snapshot = prev;
        return prev.map((s) => {
          if (s.id !== postId) return s;

          const reactions = { ...s.reactions };
          const my = [...(s.myReactions || [])];

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

      await addReaction(postId, { type }, token);
    } catch (err) {
      console.error("Failed to toggle reaction:", err);
      if (snapshot) setShoutouts(snapshot);
    }
  };

  // =============== TAG HIGHLIGHTS ===============
  const highlightTags = (text = "") => {
    const regex = /(@[A-Za-z]+(?: [A-Za-z]+)?)/g;
    return text.split(regex).map((part, i) =>
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

  // =============== ADD COMMENT ===============
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

      await loadComments(postId);

      setCommentText("");
      setTaggedUsers([]);
      setShowSuggestions(false);
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
      setMentionQuery(query);

      if (query.length > 0) {
        const matches = users.filter((u) =>
          u.name.toLowerCase().includes(query)
        );
        setFilteredUsers(matches);
        setShowSuggestions(matches.length > 0);
      } else {
        setShowSuggestions(false);
      }
    } else {
      setShowSuggestions(false);
      setFilteredUsers([]);
      setMentionQuery("");
    }
  };

  const handleTagSelect = (userToTag) => {
    const atIndex = commentText.lastIndexOf("@");
    const newText =
      commentText.slice(0, atIndex + 1) +
      userToTag.name +
      " " +
      commentText.slice(atIndex + 1);

    setCommentText(newText);

    if (!taggedUsers.find((u) => u.id === userToTag.id)) {
      setTaggedUsers([...taggedUsers, userToTag]);
    }

    setShowSuggestions(false);
  };

  // =============== NEW SHOUTOUT ===============
  const postNewShoutout = async () => {
    if (!newMessage.trim()) return;

    try {
      await createShoutout(
        {
          message: newMessage.trim(),
          recipient_ids: newRecipients,
        },
        token
      );

      const updated = await getAllShoutouts(token);
      setShoutouts(updated);
    } catch (err) {
      console.error("Failed to post shoutout:", err);
    }

    setShowNewModal(false);
    setNewMessage("");
    setNewRecipients([]);
  };

  // =============== LEADERBOARD ===============
  const leaderboard = useMemo(() => {
    const points = {};

    shoutouts.forEach((s) => {
      const sender = s.sender?.name || "Unknown";
      points[sender] = (points[sender] || 0) + 5;

      (s.recipients || []).forEach(
        (r) => (points[r.name] = (points[r.name] || 0) + 2)
      );
    });

    return Object.entries(points)
      .map(([name, pts]) => ({ name, pts }))
      .sort((a, b) => b.pts - a.pts)
      .slice(0, 5);
  }, [shoutouts]);

  // =============== DEPT COUNTS ===============
  const deptCounts = useMemo(() => {
    const map = {};
    shoutouts.forEach((s) => {
      const dept = s.sender?.department || "General";
      map[dept] = (map[dept] || 0) + 1;
    });
    return Object.entries(map).map(([dept, count]) => ({ dept, count }));
  }, [shoutouts]);

  // =============== PROFILE HELPERS ===============
  const openProfile = (profileUserObj) => {
    if (!profileUserObj) return;
    setProfileUser(profileUserObj);
  };

  const closeProfile = () => setProfileUser(null);

  const getProfileStats = (profileUserObj) => {
    if (!profileUserObj || !profileUserObj.id) {
      return {
        sent: [],
        received: [],
        sentCount: 0,
        receivedCount: 0,
        likeCount: 0,
        clapCount: 0,
        starCount: 0,
        reactionScore: 0,
      };
    }

    const sent = shoutouts.filter((s) => s.sender?.id === profileUserObj.id);
    const received = shoutouts.filter((s) =>
      (s.recipients || []).some((r) => r.id === profileUserObj.id)
    );

    const sentCount = sent.length;
    const receivedCount = received.length;

    let likeCount = 0;
    let clapCount = 0;
    let starCount = 0;

    sent.forEach((s) => {
      likeCount += s.reactions?.like || 0;
      clapCount += s.reactions?.clap || 0;
      starCount += s.reactions?.star || 0;
    });

    const reactionScore = likeCount * 1 + clapCount * 2 + starCount * 3;

    return {
      sent,
      received,
      sentCount,
      receivedCount,
      likeCount,
      clapCount,
      starCount,
      reactionScore,
    };
  };

  // ============================================
  //                RENDER UI
  // ============================================
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 relative">
      <header className="w-full bg-white shadow-sm py-3 px-6 flex items-center justify-between sticky top-0 z-20">
  <BragboardLogo size={38} />

  {/* TOP RIGHT PROFILE BUTTON */}
  <button
    onClick={() => openProfile(user)}
    className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full hover:bg-gray-200 transition"
  >
    <Avatar name={user?.name} size={34} />
    <span className="text-sm text-gray-700 font-medium hidden sm:block">
      {user?.name}
    </span>
  </button>
</header>

      {/* PROFILE OVERLAY */}
      {profileUser && (
        <div className="fixed inset-0 z-40 bg-black bg-opacity-30 flex items-start justify-center pt-16">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl mx-4 max-h-[80vh] overflow-y-auto relative">
            <button
              onClick={closeProfile}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-sm"
            >
              ✕
            </button>

            <div className="p-6 pb-4 border-b flex items-center gap-4">
              <Avatar name={profileUser.name} size={72} />
              <div>
                <h2 className="text-2xl font-semibold">{profileUser.name}</h2>
                <p className="text-sm text-gray-500">
                  {profileUser.department || "General"} •{" "}
                  {profileUser.role || "Employee"}
                </p>
                {profileUser.id && (
                  <p className="text-xs text-gray-400 mt-1">
                    User ID: {profileUser.id}
                  </p>
                )}
              </div>
            </div>

            {(() => {
              const stats = getProfileStats(profileUser);

              return (
                <div className="p-6 pt-4 space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-gray-50 rounded-xl p-4">
                      <div className="text-xs text-gray-500">
                        Shoutouts Sent
                      </div>
                      <div className="text-2xl font-semibold">
                        {stats.sentCount}
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-4">
                      <div className="text-xs text-gray-500">
                        Shoutouts Received
                      </div>
                      <div className="text-2xl font-semibold">
                        {stats.receivedCount}
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-4">
                      <div className="text-xs text-gray-500 mb-1">
                        Reactions (Like / Clap / Star)
                      </div>
                      <div className="text-sm font-semibold">
                        {stats.likeCount} / {stats.clapCount} / {stats.starCount}
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-4">
                      <div className="text-xs text-gray-500">
                        Reaction Score
                      </div>
                      <div className="text-2xl font-semibold">
                        {stats.reactionScore}
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-white border rounded-xl p-4">
                      <h3 className="text-sm font-semibold mb-3">
                        Shoutouts Sent
                      </h3>
                      {stats.sent.length === 0 ? (
                        <p className="text-xs text-gray-500">
                          No shoutouts sent yet.
                        </p>
                      ) : (
                        <ul className="space-y-2 max-h-64 overflow-y-auto text-xs">
                          {stats.sent.map((s) => (
                            <li key={s.id} className="border rounded-lg p-2">
                              <div className="text-gray-800">{s.message}</div>
                              <div className="text-gray-500 mt-1">
                                To:{" "}
                                {(s.recipients || [])
                                  .map((r) => r.name)
                                  .join(", ") || "—"}
                              </div>
                              <div className="text-[10px] text-gray-400 mt-1">
                                {dayjs(s.created_at).format(
                                  "MMM D, YYYY • h:mm A"
                                )}
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <div className="bg-white border rounded-xl p-4">
                      <h3 className="text-sm font-semibold mb-3">
                        Shoutouts Received
                      </h3>
                      {stats.received.length === 0 ? (
                        <p className="text-xs text-gray-500">
                          No shoutouts received yet.
                        </p>
                      ) : (
                        <ul className="space-y-2 max-h-64 overflow-y-auto text-xs">
                          {stats.received.map((s) => (
                            <li key={s.id} className="border rounded-lg p-2">
                              <div className="text-gray-800">{s.message}</div>
                              <div className="text-gray-500 mt-1">
                                From: {s.sender?.name || "Unknown"}
                              </div>
                              <div className="text-[10px] text-gray-400 mt-1">
                                {dayjs(s.created_at).format(
                                  "MMM D, YYYY • h:mm A"
                                )}
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      <div className="p-4 lg:p-8 max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT SIDEBAR */}
        <aside className="lg:col-span-3 hidden lg:block">
          <div className="bg-white rounded-xl shadow p-4 sticky top-24 space-y-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => openProfile(user)}
                className="rounded-full focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <Avatar name={user?.name} size={56} />
              </button>
              <div>
                <div
                  className="font-semibold cursor-pointer hover:underline"
                  onClick={() => openProfile(user)}
                >
                  {user?.name}
                </div>
                <div className="text-xs text-gray-500">
                  {user?.department} • {user?.role}
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowNewModal(true)}
              className="w-full text-sm bg-gradient-to-r from-blue-600 to-teal-500 text-white py-2 rounded-lg"
            >
              Post Shoutout
            </button>

            <button
              onClick={onLogout}
              className="w-full text-sm py-2 bg-red-600 text-white rounded"
            >
              Log out
            </button>
          </div>
        </aside>

        {/* MAIN FEED */}
        <main className="lg:col-span-6">
          {/* FILTER BAR */}
          <div className="bg-white p-4 rounded-xl shadow mb-5 flex flex-wrap gap-6 items-end">
            {/* DEPARTMENT */}
            <div className="flex flex-col">
              <label className="text-xs text-gray-500 mb-1">Department</label>
              <select
                value={filterDept}
                onChange={(e) => setFilterDept(e.target.value)}
                className="border p-2 rounded w-44"
              >
                <option value="all">All</option>
                {[
                  ...new Set(
                    users.map((u) => u.department).filter(Boolean)
                  ),
                ].map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            {/* SENDER */}
            <div className="flex flex-col">
              <label className="text-xs text-gray-500 mb-1">Sender</label>
              <select
                value={filterSender}
                onChange={(e) => setFilterSender(e.target.value)}
                className="border p-2 rounded w-44"
              >
                <option value="all">All</option>
                {[
                  ...new Set(
                    shoutouts.map((s) => s.sender?.name).filter(Boolean)
                  ),
                ].map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>

            {/* DATE */}
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

          {/* FEED TITLE */}
          <div className="flex items-center justify-between mb-4 mt-2">
            <h2 className="text-xl font-semibold">Recognition Feed</h2>
            <span className="text-sm text-gray-500">
              {loading ? "Loading..." : `${shoutouts.length} posts`}
            </span>
          </div>

          {/* FEED LIST */}
          <div className="space-y-4">
            {shoutouts
              .filter((post) => {
                if (
                  filterDept !== "all" &&
                  post.sender?.department !== filterDept
                )
                  return false;

                if (
                  filterSender !== "all" &&
                  post.sender?.name !== filterSender
                )
                  return false;

                const created = dayjs(post.created_at);

                if (filterDate === "today" && !created.isSame(dayjs(), "day"))
                  return false;

                if (filterDate === "week" && !created.isSame(dayjs(), "week"))
                  return false;

                if (filterDate === "month" && !created.isSame(dayjs(), "month"))
                  return false;

                return true;
              })
              .map((post) => (
                <article
                  key={post.id}
                  className="bg-white rounded-2xl p-4 shadow hover:shadow-md transition"
                >
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => openProfile(post.sender)}
                      className="rounded-full focus:outline-none focus:ring-2 focus:ring-blue-400"
                    >
                      <Avatar name={post.sender?.name} size={48} />
                    </button>

                    <div className="flex-1">
                      <div
                        className="font-semibold cursor-pointer hover:underline"
                        onClick={() => openProfile(post.sender)}
                      >
                        {post.sender?.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {post.sender?.department} •{" "}
                        {dayjs(post.created_at).format("MMM D, h:mm A")}
                      </div>

                      <p className="mt-3 text-gray-800">{post.message}</p>

                      <div className="mt-3 text-sm text-gray-600">
                        To:{" "}
                        <strong className="text-gray-800">
                          {(post.recipients || []).length === 0
                            ? "All"
                            : (post.recipients || []).map((r, idx) => (
                                <span key={r.id || idx}>
                                  <span
                                    className="cursor-pointer hover:underline"
                                    onClick={() => openProfile(r)}
                                  >
                                    {r.name}
                                  </span>
                                  {idx <
                                  (post.recipients
                                    ? post.recipients.length - 1
                                    : 0)
                                    ? ", "
                                    : ""}
                                </span>
                              ))}
                        </strong>
                      </div>

                      {/* REACTIONS + REPORT */}
                      <div className="mt-3 flex items-center gap-5 text-sm text-gray-600">
                        {/* LIKE */}
                        <button
                          onClick={() => toggleReaction(post.id, "like")}
                          className={`flex items-center gap-2 px-2 py-1 rounded hover:bg-pink-100 transition ${
                            post.myReactions?.includes("like")
                              ? "text-pink-700 font-semibold"
                              : "text-pink-600"
                          }`}
                        >
                          <Heart size={18} fill="currentColor" />
                          <span>{post.reactions?.like}</span>
                        </button>

                        {/* CLAP */}
                        <button
                          onClick={() => toggleReaction(post.id, "clap")}
                          className={`flex items-center gap-2 px-2 py-1 rounded hover:bg-yellow-100 transition ${
                            post.myReactions?.includes("clap")
                              ? "text-yellow-700 font-semibold"
                              : "text-yellow-600"
                          }`}
                        >
                          <PartyPopper size={18} />
                          <span>{post.reactions?.clap}</span>
                        </button>

                        {/* STAR */}
                        <button
                          onClick={() => toggleReaction(post.id, "star")}
                          className={`flex items-center gap-2 px-2 py-1 rounded hover:bg-indigo-100 transition ${
                            post.myReactions?.includes("star")
                              ? "text-indigo-800 font-semibold"
                              : "text-indigo-600"
                          }`}
                        >
                          <Sparkles size={18} />
                          <span>{post.reactions?.star}</span>
                        </button>

                        {/* REPORT SHOUTOUT */}
                        <button
                          onClick={() => {
                            setReportReason("");
                            setReportPostId(post.id);
                            setReportModal(true);
                          }}
                          className="flex items-center gap-1 ml-auto text-red-500 hover:text-red-700 transition"
                        >
                          <Flag size={18} />
                          <span className="text-xs">Report</span>
                        </button>

                        {/* OPEN COMMENTS */}
                        <button
                          onClick={() => {
                            setActivePostId(
                              post.id === activePostId ? null : post.id
                            );
                            if (post.id !== activePostId) loadComments(post.id);
                          }}
                          className="flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-100 text-gray-500"
                        >
                          <MessageCircle size={18} />
                          <span>{(post.comments || []).length}</span>
                        </button>
                      </div>

                      {/* COMMENTS */}
                      {activePostId === post.id && (
                        <div className="mt-3 border-t pt-3 space-y-2">
                          {(post.comments || []).length === 0 ? (
                            <div className="text-xs text-gray-500">
                              No comments yet — add one!
                            </div>
                          ) : (
                            post.comments.map((c) => (
                              <div
                                key={c.id}
                                className="flex gap-2 items-start"
                              >
                                <button
                                  type="button"
                                  onClick={() => openProfile(c.user)}
                                  className="rounded-full focus:outline-none focus:ring-2 focus:ring-blue-400"
                                >
                                  <Avatar name={c.user?.name} size={32} />
                                </button>

                                <div className="bg-gray-50 rounded-xl px-3 py-2 w-full">
                                  <div className="flex justify-between">
                                    <div
                                      className="text-sm font-semibold cursor-pointer hover:underline"
                                      onClick={() => openProfile(c.user)}
                                    >
                                      {c.user?.name}
                                    </div>

                                    {/* ⭐ FLAG COMMENT BUTTON ⭐ */}
                                    <button
                                      onClick={() => openFlagComment(c)}
                                      className="text-orange-500 text-xs hover:text-orange-700"
                                    >
                                      Flag
                                    </button>
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

                          {/* COMMENT INPUT */}
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

                              {/* TAG SUGGESTIONS */}
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
              ))}
          </div>
        </main>

        {/* RIGHT PANEL */}
        <aside className="lg:col-span-3 hidden lg:block sticky top-24 self-start">
          {/* LEADERBOARD */}
          <div className="bg-white rounded-xl shadow p-4 mb-4">
            <div className="text-sm text-gray-600 font-semibold mb-3">
              Leaderboard
            </div>
            <ul className="space-y-2">
              {leaderboard.map((l, idx) => (
                <li
                  key={idx}
                  className="flex items-center justify-between bg-gray-50 p-2 rounded"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold">
                      {idx === 0
                        ? "🥇"
                        : idx === 1
                        ? "🥈"
                        : idx === 2
                        ? "🥉"
                        : idx + 1}
                    </div>
                    <div>
                      <div className="font-semibold text-sm">{l.name}</div>
                      <div className="text-xs text-gray-500">
                        Points: {l.pts}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* DEPARTMENT COUNTS */}
          <div className="bg-white rounded-xl shadow p-4">
            <div className="text-sm text-gray-600 font-semibold mb-3">
              Shoutouts by Department
            </div>
            <ul className="space-y-2">
              {deptCounts.length === 0 ? (
                <li className="text-sm text-gray-500">No data yet</li>
              ) : (
                deptCounts.map((d, idx) => (
                  <li
                    key={idx}
                    className="flex items-center justify-between bg-gray-50 p-2 rounded"
                  >
                    <span className="text-sm font-medium">{d.dept}</span>
                    <span className="text-sm text-gray-600">{d.count}</span>
                  </li>
                ))
              )}
            </ul>
          </div>
        </aside>
      </div>

      {/* ---------------- REPORT MODAL ---------------- */}
      {reportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-3 text-red-600 flex items-center gap-2">
              <Flag size={18} /> Report Shoutout
            </h3>

            <textarea
              rows={4}
              className="w-full border rounded p-2"
              placeholder="Describe the issue..."
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
            />

            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setReportModal(false)}
                className="px-4 py-2 bg-gray-200 rounded"
              >
                Cancel
              </button>

              <button
                onClick={submitReport}
                className="px-4 py-2 bg-red-600 text-white rounded"
              >
                Submit Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- FLAG COMMENT MODAL ---------------- */}
      {flagModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-3 text-orange-600 flex items-center gap-2">
              <Flag size={18} /> Flag Comment
            </h3>

            {flagCommentData && (
              <div className="mb-3 text-xs bg-gray-50 border rounded p-2 text-gray-600">
                <div className="font-semibold">
                  {flagCommentData.user?.name}
                </div>
                <div>{flagCommentData.content}</div>
              </div>
            )}

            <textarea
              rows={4}
              className="w-full border rounded p-2 text-sm"
              placeholder="Why are you flagging this comment?"
              value={flagReason}
              onChange={(e) => setFlagReason(e.target.value)}
            />

            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setFlagModal(false)}
                className="px-4 py-2 bg-gray-200 rounded text-sm"
              >
                Cancel
              </button>

              <button
                onClick={submitFlagComment}
                className="px-4 py-2 bg-orange-600 text-white rounded text-sm"
              >
                Submit Flag
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- NEW SHOUTOUT MODAL ---------------- */}
      {showNewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Create a Shoutout</h3>

            <textarea
              className="w-full p-2 border rounded mb-3"
              rows={4}
              placeholder="Write something positive..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
            />

            <label className="text-sm font-medium">Select Recipients:</label>
            <select
              multiple
              value={newRecipients}
              onChange={(e) =>
                setNewRecipients(
                  Array.from(e.target.selectedOptions, (opt) => opt.value)
                )
              }
              className="w-full mt-1 border rounded p-2 mb-4"
            >
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.department})
                </option>
              ))}
            </select>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowNewModal(false)}
                className="px-4 py-2 bg-gray-200 rounded"
              >
                Cancel
              </button>

              <button
                onClick={postNewShoutout}
                className="px-4 py-2 bg-blue-600 text-white rounded"
              >
                Post
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
