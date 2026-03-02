import React, { useState } from "react";
import toast from "react-hot-toast";
import { createRoomApi, joinChatApi } from "../services/RoomService";
import useChatContext from "../context/ChatContext";
import { useNavigate } from "react-router";

// --- Mock rooms for UI demo (will be replaced by API call later) ---
const MOCK_ROOMS = [
  { roomId: "general", members: 12, active: true },
  { roomId: "tech-talk", members: 7, active: false },
  { roomId: "design-hub", members: 3, active: false },
  { roomId: "random", members: 20, active: true },
  { roomId: "announcements", members: 45, active: false },
];

// Utility: generate a consistent color from a string (for room avatars)
function stringToColor(str) {
  const colors = [
    "#5865F2", "#57F287", "#FEE75C", "#EB459E",
    "#ED4245", "#3BA55C", "#FAA61A", "#00AFF4",
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash += str.charCodeAt(i);
  return colors[hash % colors.length];
}

// ─── Create Room Modal ────────────────────────────────────────────────────────
function CreateRoomModal({ onClose, onCreate }) {
  const [roomName, setRoomName] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-[#1e2124] rounded-2xl p-6 w-full max-w-sm shadow-2xl border border-white/10">
        <h2 className="text-white text-xl font-bold mb-1">Create a Room</h2>
        <p className="text-gray-400 text-sm mb-5">
          Give your room a unique ID. Others can join using this ID.
        </p>

        <label className="text-xs uppercase tracking-widest text-gray-400 font-semibold mb-1 block">
          Room ID
        </label>
        <input
          type="text"
          value={roomName}
          onChange={(e) => setRoomName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onCreate(roomName)}
          placeholder="e.g. my-cool-room"
          className="w-full bg-[#2b2d31] border border-white/10 text-white placeholder-gray-500 
                     px-4 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-5"
          autoFocus
        />

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-gray-300 bg-[#2b2d31] hover:bg-[#383a40] transition"
          >
            Cancel
          </button>
          <button
            onClick={() => onCreate(roomName)}
            className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition"
          >
            Create Room
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── AI Chat Panel (right side) ───────────────────────────────────────────────
function AiChatPanel() {
  const [aiInput, setAiInput] = useState("");

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-8 pt-10 pb-6 border-b border-white/5">
        <div className="flex items-center gap-3 mb-3">
          {/* Animated AI orb */}
          <div className="relative w-10 h-10">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 animate-pulse opacity-80" />
            <div className="absolute inset-[3px] rounded-full bg-[#111214] flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
                  fill="url(#star-grad)" />
                <defs>
                  <linearGradient id="star-grad" x1="2" y1="2" x2="22" y2="22">
                    <stop offset="0%" stopColor="#818cf8" />
                    <stop offset="100%" stopColor="#e879f9" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-widest font-bold text-indigo-400">NexChat AI</p>
            <h2 className="text-white text-2xl font-extrabold leading-tight tracking-tight">
              Meet Your AI Companion
            </h2>
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
        {/* Big glowing gradient blob */}
        <div className="relative mb-8">
          <div className="w-32 h-32 rounded-full bg-gradient-to-br from-indigo-600/40 via-purple-600/40 to-pink-600/40 blur-3xl absolute inset-0 scale-150" />
          <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 flex items-center justify-center shadow-2xl shadow-indigo-900/50">
            <svg width="52" height="52" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
                fill="white" opacity="0.95" />
            </svg>
          </div>
        </div>

        <h1 className="text-white text-4xl font-black tracking-tight mb-3 leading-none">
          Ask Anything.<br />
          <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Get Answers Instantly.
          </span>
        </h1>
        <p className="text-gray-400 text-base max-w-sm leading-relaxed mb-2">
          Your personal AI is here — whether you need help, ideas, or just a conversation.
          NexChat AI is always on, always ready.
        </p>

        {/* Feature pills */}
        <div className="flex flex-wrap gap-2 justify-center mb-10">
          {["✦ Summarize chats", "✦ Answer questions", "✦ Write anything", "✦ Debug code"].map(f => (
            <span key={f} className="px-3 py-1 bg-white/5 border border-white/10 text-gray-300 text-xs rounded-full font-medium">
              {f}
            </span>
          ))}
        </div>
      </div>

      {/* Input bar */}
      <div className="px-6 pb-6">
        <div className="flex items-center gap-3 bg-[#2b2d31] border border-white/10 rounded-xl px-4 py-3 
                        focus-within:border-indigo-500/60 focus-within:ring-1 focus-within:ring-indigo-500/30 transition-all">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-indigo-400 flex-shrink-0">
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
              fill="currentColor" opacity="0.7" />
          </svg>
          <input
            type="text"
            value={aiInput}
            onChange={(e) => setAiInput(e.target.value)}
            placeholder="Ask NexChat AI anything…"
            className="flex-1 bg-transparent text-white placeholder-gray-500 text-sm focus:outline-none"
          />
          <button
            className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs font-bold px-4 py-1.5 
                       rounded-lg hover:opacity-90 transition disabled:opacity-40"
            disabled={!aiInput.trim()}
          >
            Ask
          </button>
        </div>
        <p className="text-center text-gray-600 text-xs mt-2">AI features coming soon — stay tuned ✨</p>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
const JoinCreateChat = () => {
  const [detail, setDetail] = useState({ roomId: "", userName: "" });
  const [rooms] = useState(MOCK_ROOMS);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [hoveredRoom, setHoveredRoom] = useState(null);

  const { setRoomId, setCurrentUser, setConnected } = useChatContext();
  const navigate = useNavigate();

  // ── Handlers ────────────────────────────────────────────────────────────────

  async function handleJoinRoom(roomId) {
    if (!detail.userName.trim()) {
      toast.error("Please enter your username first!");
      return;
    }
    try {
      const room = await joinChatApi(roomId);
      toast.success(`Joined #${room.roomId}!`);
      setCurrentUser(detail.userName);
      setRoomId(room.roomId);
      setConnected(true);
      navigate("/chat");
    } catch (error) {
      toast.error(error?.response?.data || "Room not found");
    }
  }

  async function handleCreateRoom(roomId) {
    if (!roomId.trim()) { toast.error("Room ID cannot be empty"); return; }
    if (!detail.userName.trim()) { toast.error("Please enter your username first!"); return; }
    try {
      const response = await createRoomApi(roomId.trim());
      toast.success(`Room #${response.roomId} created!`);
      setCurrentUser(detail.userName);
      setRoomId(response.roomId);
      setConnected(true);
      setShowCreateModal(false);
      navigate("/chat");
    } catch (error) {
      toast.error(error?.status === 400 ? "Room already exists!" : "Error creating room");
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen bg-[#111214] font-sans overflow-hidden">

      {/* ── LEFT SIDEBAR ─────────────────────────────────────────── */}
      <div className="w-72 flex-shrink-0 bg-[#1e2124] border-r border-white/5 flex flex-col">

        {/* Brand */}
        <div className="px-5 py-5 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
              </svg>
            </div>
            <span className="text-white font-extrabold text-base tracking-tight">NexChat</span>
          </div>
        </div>

        {/* Username input */}
        <div className="px-4 pt-4 pb-2">
          <label className="text-[10px] uppercase tracking-widest font-bold text-gray-500 mb-1.5 block">
            Your Username
          </label>
          <input
            type="text"
            name="userName"
            value={detail.userName}
            onChange={(e) => setDetail({ ...detail, userName: e.target.value })}
            placeholder="Set your name…"
            className="w-full bg-[#2b2d31] border border-white/5 text-white placeholder-gray-600 
                       px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 transition"
          />
        </div>

        {/* Section header */}
        <div className="px-4 pt-4 pb-2 flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-widest font-bold text-gray-500">
            Rooms
          </span>
          <button
            onClick={() => setShowCreateModal(true)}
            title="Create Room"
            className="w-5 h-5 rounded text-gray-400 hover:text-white hover:bg-white/10 flex items-center justify-center transition text-lg leading-none"
          >
            +
          </button>
        </div>

        {/* Room list */}
        <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-0.5 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
          {rooms.map((room) => (
            <button
              key={room.roomId}
              onClick={() => setSelectedRoom(room.roomId)}
              onMouseEnter={() => setHoveredRoom(room.roomId)}
              onMouseLeave={() => setHoveredRoom(null)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all group
                ${selectedRoom === room.roomId
                  ? "bg-white/10 text-white"
                  : "text-gray-400 hover:bg-white/5 hover:text-gray-200"}`}
            >
              {/* Room avatar */}
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold text-white flex-shrink-0 transition-all"
                style={{ background: stringToColor(room.roomId) }}
              >
                {room.roomId[0].toUpperCase()}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold truncate">#{room.roomId}</span>
                  {room.active && (
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0 ml-1" />
                  )}
                </div>
                <p className="text-[10px] text-gray-500 group-hover:text-gray-400 transition">
                  {room.members} members
                </p>
              </div>
            </button>
          ))}
        </div>

        {/* Join selected room CTA */}
        {selectedRoom && (
          <div className="p-3 border-t border-white/5">
            <button
              onClick={() => handleJoinRoom(selectedRoom)}
              className="w-full py-2.5 rounded-lg text-sm font-bold text-white 
                         bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-90 
                         transition shadow-lg shadow-indigo-900/30"
            >
              Join #{selectedRoom} →
            </button>
          </div>
        )}
      </div>

      {/* ── RIGHT MAIN PANEL ─────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden relative">

        {/* Subtle background effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/20 via-transparent to-purple-950/10 pointer-events-none" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] 
                        bg-indigo-600/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex-1 overflow-hidden">
          <AiChatPanel />
        </div>
      </div>

      {/* ── MODAL ────────────────────────────────────────────────── */}
      {showCreateModal && (
        <CreateRoomModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateRoom}
        />
      )}
    </div>
  );
};

export default JoinCreateChat;