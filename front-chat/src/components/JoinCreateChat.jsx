import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import useChatContext from "../context/ChatContext";
import { createRoomApi, joinChatApi } from "../services/RoomService";
import { httpClient } from "../config/AxiosHelper";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const stringToColor = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return `hsl(${hash % 360}, 55%, 40%)`;
};

const MOCK_ROOMS = [
  { roomId: "general", members: 12, active: true },
  { roomId: "dev-talk", members: 5, active: true },
  { roomId: "random", members: 8, active: false },
];

// ─── Create Room Modal ────────────────────────────────────────────────────────
function CreateRoomModal({ onClose, onCreate }) {
  const [roomName, setRoomName] = useState("");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#1e2124] border border-white/10 rounded-2xl p-6 w-80 shadow-2xl">
        <h3 className="text-white font-extrabold text-lg mb-1">Create a Room</h3>
        <p className="text-gray-400 text-xs mb-4">
          Give your room a unique ID. Others can join using this ID.
        </p>
        <label className="text-xs uppercase tracking-widest text-gray-400 font-semibold mb-1 block">Room ID</label>
        <input
          type="text"
          value={roomName}
          onChange={(e) => setRoomName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onCreate(roomName)}
          placeholder="e.g. my-cool-room"
          className="w-full bg-[#2b2d31] border border-white/10 text-white placeholder-gray-500 px-4 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-5"
          autoFocus
        />
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-gray-300 bg-[#2b2d31] hover:bg-[#383a40] transition">Cancel</button>
          <button onClick={() => onCreate(roomName)} className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition">Create Room</button>
        </div>
      </div>
    </div>
  );
}

// ─── AI Chat Panel ────────────────────────────────────────────────────────────
/**
 * SYSTEM DESIGN CONCEPT — Conversational AI with Context (Memory):
 * The backend (NexchatService) stores all previous Q&A pairs in MongoDB per username.
 * On each new question, it rebuilds the full conversation history as a prompt prefix.
 * This is the "Context Window" pattern — the model doesn't remember on its own;
 * WE send the history every time. This is stateless AI + stateful storage.
 *
 * INTERVIEW Q: "How do you maintain conversation context with an LLM?"
 * A: LLMs are stateless. We persist the history server-side (DB), then inject it
 *    into every new prompt as context. The frontend just sends username + question.
 */
function AiChatPanel({ username }) {
  const [aiInput, setAiInput] = useState("");

  /**
   * messages = [ { role: "user"|"assistant", content: "..." }, ... ]
   * This local state mirrors what's persisted on the backend.
   * We render it optimistically — user message appears instantly,
   * then the AI response fills in once the API call resolves.
   *
   * INTERVIEW Q: "What is optimistic UI update?"
   * A: You update the UI immediately on user action (before server confirms),
   *    giving a snappier feel. If the server fails, you roll back.
   */
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  // Auto-scroll to the latest message whenever messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /**
   * askNexchat — calls POST /api/v1/nexchat/ask
   *
   * REST API Design:
   *  - POST is used (not GET) because we are SENDING a body (question + username).
   *  - GET requests should be idempotent and have no body.
   *  - The backend returns { username, answer }.
   *
   * INTERVIEW Q: "Why POST for asking a question, not GET?"
   * A: GET is for retrieving resources without side effects. Here we are
   *    triggering AI inference AND mutating state (saving history to DB).
   *    POST is appropriate for operations that change server state.
   */
  async function askNexchat() {
    const question = aiInput.trim();
    if (!question) return;

    if (!username?.trim()) {
      toast.error("Please set your username in the left sidebar first!");
      return;
    }

    // Optimistic UI: show user message immediately
    const userMsg = { role: "user", content: question };
    setMessages((prev) => [...prev, userMsg]);
    setAiInput("");
    setLoading(true);

    try {
      /**
       * httpClient is an Axios instance with baseURL already configured.
       * We POST to /api/v1/nexchat/ask with { username, question }.
       *
       * INTERVIEW Q: "How do you structure API calls in React?"
       * A: Centralize them in a service layer (like RoomService.js here),
       *    using a configured Axios instance so baseURL/interceptors are reused.
       *    Keeps components clean — they just call service functions.
       */
      const response = await httpClient.post("/api/v1/nexchat/ask", {
        username: username.trim(),
        question,
      });

      const aiMsg = { role: "assistant", content: response.data.answer };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (error) {
      /**
       * Error Handling Strategy:
       * - Show a toast for user-facing feedback.
       * - Push an error message into the chat so the conversation thread isn't broken.
       * - Log to console for developer debugging.
       *
       * INTERVIEW Q: "How do you handle API errors gracefully in frontend?"
       * A: Don't just silently fail. Show feedback (toast/inline error),
       *    preserve UI state, and ideally allow the user to retry.
       */
      console.error("NexchatAI error:", error);
      toast.error("AI failed to respond. Please try again.");
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "⚠️ Something went wrong. Please try again.", isError: true },
      ]);
    } finally {
      // finally always runs — perfect for resetting loading state
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-8 pt-10 pb-6 border-b border-white/5 flex-shrink-0">
        <div className="flex items-center gap-3 mb-3">
          <div className="relative w-10 h-10">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 animate-pulse opacity-80" />
            <div className="absolute inset-[3px] rounded-full bg-[#111214] flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="url(#star-grad)" />
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

      {/* ── Chat Messages Area ── */}
      {/**
       * Conditional Rendering Pattern:
       * - No messages → show the "welcome" splash (empty state UX).
       * - Has messages → show the conversation thread.
       *
       * INTERVIEW Q: "What is an empty state in UI design?"
       * A: A placeholder shown when there's no data yet, guiding the user
       *    on what to do. Prevents blank/confusing screens.
       */}
      <div className="flex-1 overflow-y-auto px-8 py-4 space-y-4 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
        {messages.length === 0 ? (
          /* Welcome / empty state */
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="relative mb-8">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-indigo-600/40 via-purple-600/40 to-pink-600/40 blur-3xl absolute inset-0 scale-150" />
              <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 flex items-center justify-center shadow-2xl shadow-indigo-900/50">
                <svg width="52" height="52" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="white" opacity="0.95" />
                </svg>
              </div>
            </div>
            <h1 className="text-white text-4xl font-black tracking-tight mb-3 leading-none">
              Ask Anything.<br />
              <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Get Answers Instantly.
              </span>
            </h1>
            <p className="text-gray-400 text-base max-w-sm leading-relaxed mb-6">
              Your personal AI is here — whether you need help, ideas, or just a conversation.
              NexChat AI is always on, always ready.
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {["✦ Summarize chats", "✦ Answer questions", "✦ Write anything", "✦ Debug code"].map((f) => (
                <span key={f} className="px-3 py-1 bg-white/5 border border-white/10 text-gray-300 text-xs rounded-full font-medium">{f}</span>
              ))}
            </div>
          </div>
        ) : (
          /* Conversation thread */
          <>
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                {/**
                 * Message Bubble Design:
                 * - User messages → right-aligned, indigo background (sent)
                 * - AI messages → left-aligned, dark card (received)
                 * This is the standard chat UI convention (iMessage, WhatsApp, etc.)
                 */}
                {msg.role === "assistant" && (
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mr-2 flex-shrink-0 mt-1">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                      <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="white" />
                    </svg>
                  </div>
                )}
                <div
                  className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap
                    ${msg.role === "user"
                      ? "bg-indigo-600 text-white rounded-br-sm"
                      : msg.isError
                        ? "bg-red-900/30 border border-red-500/30 text-red-300 rounded-bl-sm"
                        : "bg-[#2b2d31] text-gray-200 rounded-bl-sm"
                    }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {/* Typing indicator while waiting for AI response */}
            {/**
             * INTERVIEW Q: "What is a loading/skeleton state?"
             * A: Visual feedback shown while async data is loading. Prevents
             *    the user from thinking the app is frozen. Improves perceived performance.
             */}
            {loading && (
              <div className="flex justify-start">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mr-2 flex-shrink-0 mt-1">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="white" />
                  </svg>
                </div>
                <div className="bg-[#2b2d31] px-4 py-3 rounded-2xl rounded-bl-sm flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:0ms]" />
                  <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce [animation-delay:150ms]" />
                  <span className="w-2 h-2 bg-pink-400 rounded-full animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            )}

            {/* Invisible div to scroll to */}
            <div ref={bottomRef} />
          </>
        )}
      </div>

      {/* ── Input Bar ── */}
      <div className="px-6 pb-6 pt-2 flex-shrink-0">
        <div className="flex items-center gap-3 bg-[#2b2d31] border border-white/10 rounded-xl px-4 py-3 focus-within:border-indigo-500/60 focus-within:ring-1 focus-within:ring-indigo-500/30 transition-all">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-indigo-400 flex-shrink-0">
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="currentColor" opacity="0.7" />
          </svg>
          <input
            type="text"
            value={aiInput}
            onChange={(e) => setAiInput(e.target.value)}
            /**
             * onKeyDown Enter handling:
             * Allows sending the message without clicking the button.
             * !loading guard prevents double-submitting while waiting for AI.
             *
             * INTERVIEW Q: "How do you prevent duplicate API calls?"
             * A: Disable the trigger (button/Enter) while a request is in-flight
             *    using a `loading` state boolean.
             */
            onKeyDown={(e) => e.key === "Enter" && !loading && askNexchat()}
            placeholder={username ? "Ask NexChat AI anything…" : "Set your username first…"}
            className="flex-1 bg-transparent text-white placeholder-gray-500 text-sm focus:outline-none"
            disabled={loading}
          />
          <button
            onClick={askNexchat}
            disabled={!aiInput.trim() || loading}
            className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs font-bold px-4 py-1.5 rounded-lg hover:opacity-90 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? "..." : "Ask"}
          </button>
        </div>
        {!username?.trim() && (
          <p className="text-center text-yellow-600 text-xs mt-2">⚠️ Enter your username in the sidebar to use NexChat AI</p>
        )}
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

  return (
    <div className="flex h-screen bg-[#111214] font-sans overflow-hidden">

      {/* ── LEFT SIDEBAR ─────────────────────────────────────────── */}
      <div className="w-72 flex-shrink-0 bg-[#1e2124] border-r border-white/5 flex flex-col">
        {/* Brand */}
        <div className="px-5 py-5 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
              </svg>
            </div>
            <span className="text-white font-extrabold text-base tracking-tight">NexChat</span>
          </div>
        </div>

        {/* Username input */}
        <div className="px-4 pt-4 pb-2">
          <label className="text-[10px] uppercase tracking-widest font-bold text-gray-500 mb-1.5 block">Your Username</label>
          <input
            type="text"
            name="userName"
            value={detail.userName}
            onChange={(e) => setDetail({ ...detail, userName: e.target.value })}
            placeholder="Set your name…"
            className="w-full bg-[#2b2d31] border border-white/5 text-white placeholder-gray-600 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 transition"
          />
        </div>

        {/* Section header */}
        <div className="px-4 pt-4 pb-2 flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Rooms</span>
          <button
            onClick={() => setShowCreateModal(true)}
            title="Create Room"
            className="w-5 h-5 rounded text-gray-400 hover:text-white hover:bg-white/10 flex items-center justify-center transition text-lg leading-none"
          >+</button>
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
                ${selectedRoom === room.roomId ? "bg-white/10 text-white" : "text-gray-400 hover:bg-white/5 hover:text-gray-200"}`}
            >
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                style={{ background: stringToColor(room.roomId) }}
              >
                {room.roomId[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold truncate">#{room.roomId}</span>
                  {room.active && <span className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0 ml-1" />}
                </div>
                <p className="text-[10px] text-gray-500 group-hover:text-gray-400 transition">{room.members} members</p>
              </div>
            </button>
          ))}
        </div>

        {/* Join CTA */}
        {selectedRoom && (
          <div className="p-3 border-t border-white/5">
            <button
              onClick={() => handleJoinRoom(selectedRoom)}
              className="w-full py-2.5 rounded-lg text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-90 transition shadow-lg shadow-indigo-900/30"
            >
              Join #{selectedRoom} →
            </button>
          </div>
        )}
      </div>

      {/* ── RIGHT MAIN PANEL ─────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/20 via-transparent to-purple-950/10 pointer-events-none" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-600/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative flex-1 overflow-hidden">
          {/**
           * PROP DRILLING — passing `username` down to AiChatPanel.
           * username comes from the left sidebar input (detail.userName).
           * The AI needs it to identify conversation history on the backend.
           *
           * INTERVIEW Q: "What is prop drilling and when is it a problem?"
           * A: Passing data through multiple component layers via props.
           *    It's fine for 1-2 levels (like here). For deep trees, use
           *    Context API or a state manager (Redux/Zustand) instead.
           */}
          <AiChatPanel username={detail.userName} />
        </div>
      </div>

      {/* Modal */}
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