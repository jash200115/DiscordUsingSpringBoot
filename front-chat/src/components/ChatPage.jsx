import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  MdSend,
  MdAddCircleOutline,
  MdClose,
  MdImage,
  MdGif,
} from "react-icons/md";
import { BsEmojiSmile } from "react-icons/bs";
import useChatContext from "../context/ChatContext";
import { useNavigate } from "react-router";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";
import toast from "react-hot-toast";
import { baseURL } from "../config/AxiosHelper";
import { getMessagess } from "../services/RoomService";
import { timeAgo } from "../config/helper";

// ─── EMOJI DATA ────────────────────────────────────────────────────────────────
// A curated set of emoji categories (no external library needed)
const EMOJI_CATEGORIES = {
  "😀 Smileys": ["😀","😁","😂","🤣","😃","😄","😅","😆","😉","😊","😋","😎","😍","🥰","😘","😗","🙂","🤗","🤩","🤔","🫡","🤫","🤭","😐","😑","😶","😏","😒","🙄","😬","😮","😲","😳","🥺","😦","😧","😨","😰","😥","😢","😭","😱","😖","😣","😞","😓","😩","😫","🥱","😤","😠","😡","🤬","😈","👿","💀","☠️","🤡","👹","👺","💩","🙈","🙉","🙊"],
  "👍 Gestures": ["👋","🤚","🖐️","✋","🖖","👌","🤌","🤏","✌️","🤞","🫰","🤟","🤘","🤙","👈","👉","👆","🖕","👇","☝️","👍","👎","✊","👊","🤛","🤜","👏","🙌","👐","🤲","🫶","🙏","✍️","💪","🦾","🦿","🫵","🫴","🫳"],
  "❤️ Hearts": ["❤️","🧡","💛","💚","💙","💜","🖤","🤍","🤎","💔","❤️‍🔥","❤️‍🩹","❣️","💕","💞","💓","💗","💖","💘","💝","💟","♥️","💋","💌"],
  "🐶 Animals": ["🐶","🐱","🐭","🐹","🐰","🦊","🐻","🐼","🐨","🐯","🦁","🐮","🐷","🐸","🐵","🐔","🐧","🐦","🐤","🦆","🦅","🦉","🦇","🐺","🐗","🐴","🦄","🐝","🐛","🦋","🐌","🐞","🐜","🦟","🦗","🦂","🐢","🐍","🦎","🦖","🦕","🐙","🦑","🦐","🦞","🦀","🐡","🐠","🐟","🐬","🐳","🐋","🦈","🐊","🐅","🐆","🦓","🦍","🦧","🦣","🐘","🦛","🦏","🐪","🐫","🦒","🦘","🦬","🐃","🐂","🐄","🐎","🐖","🐏","🐑","🦙","🐐","🦌","🐕","🐩","🦮","🐕‍🦺","🐈","🐈‍⬛"],
  "🍕 Food": ["🍎","🍊","🍋","🍇","🍓","🫐","🍈","🍒","🍑","🥭","🍍","🥥","🥝","🍅","🍆","🥑","🥦","🧄","🧅","🥔","🌽","🌶️","🫑","🥒","🥬","🥗","🫙","🥘","🍲","🫕","🥣","🧆","🍳","🥚","🍜","🍝","🍠","🥮","🍱","🍛","🍣","🍤","🍙","🍚","🍘","🍥","🥟","🦪","🍦","🍧","🍨","🍩","🍪","🎂","🍰","🧁","🥧","🍫","🍬","🍭","🍮","🍯","🍻","🥂","🍷","🥃","🍸","🍹","🧉","☕","🫖","🧃","🥤","🧋","🍵","🫗"],
  "🎮 Activities": ["⚽","🏀","🏈","⚾","🎾","🏐","🏉","🥏","🎱","🪀","🏓","🏸","🥊","🥋","🎯","🪃","🏹","🎣","🤿","🎽","🛹","🛼","🛷","🥌","🎿","⛷️","🏋️","🤸","⛹️","🏊","🚴","🧗","🤺","🤼","🤾","🤹","🎭","🎨","🎬","🎤","🎸","🎹","🥁","🎷","🎺","🪗","🎻","🎲","🎮","🕹️","🎳","🎰","🧩","🪆","🪅","🎉","🎊","🎈","🎁","🏆","🥇","🥈","🥉","🎖️","🏅"],
  "🌍 Travel": ["🚗","🚕","🚙","🚌","🚎","🏎️","🚓","🚑","🚒","🚐","🛻","🚚","🚛","🚜","🛵","🏍️","🛺","🚲","🛴","🛹","🚁","✈️","🚀","🛸","🚢","🛳️","⛴️","🚤","🛥️","🚂","🚃","🚄","🚅","🚆","🚇","🚈","🚉","🚊","🚝","🚞","🚋","🚍","🚘","🚖","🚡","🚠","🚟","🚃","🚋","🚞","🛤️","🛣️","🗺️","🌎","🌍","🌏","🧭","🏔️","⛰️","🌋","🏕️","🏖️","🏜️","🏝️","🏞️","🏟️","🏛️","🏗️","🏘️","🏙️","🏚️"],
  "💡 Objects": ["⌚","📱","💻","⌨️","🖥️","🖨️","🖱️","🖲️","💽","💾","💿","📀","🎥","📷","📸","📹","📼","📞","☎️","📟","📠","📺","📻","🎙️","📡","🔋","🔌","💡","🔦","🕯️","🔎","🔍","📰","📄","📃","📑","📊","📈","📉","🗂️","📂","📁","📅","📆","🗒️","🗓️","📇","📌","📍","✂️","🗃️","🗄️","🗑️","🔒","🔓","🔏","🔑","🗝️","🔨","⚒️","🛠️","⛏️","🔧","🔩","⚙️","🗜️","⚖️","🦯","🔗","⛓️","🪝","🧲","🔫","💣","🧨","🪓","🔪"],
};

// ─── GIF SEARCH (via Tenor public API) ─────────────────────────────────────────
// We use Tenor's public demo key for GIF search
const TENOR_API_KEY = "AIzaSyAyimkuYQYF_FXVALexPzfikAIjHkBQR6M"; // demo key
const searchGifs = async (query) => {
  try {
    const url = `https://tenor.googleapis.com/v2/search?q=${encodeURIComponent(query)}&key=${TENOR_API_KEY}&limit=20&media_filter=gif`;
    const res = await fetch(url);
    const data = await res.json();
    return data.results || [];
  } catch {
    return [];
  }
};

const fetchTrendingGifs = async () => {
  try {
    const url = `https://tenor.googleapis.com/v2/featured?key=${TENOR_API_KEY}&limit=20&media_filter=gif`;
    const res = await fetch(url);
    const data = await res.json();
    return data.results || [];
  } catch {
    return [];
  }
};

// ─── ATTACHMENT PREVIEW ─────────────────────────────────────────────────────────
const AttachmentPreview = ({ file, onRemove }) => {
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    if (!file) return;
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target.result);
      reader.readAsDataURL(file);
    }
    return () => setPreview(null);
  }, [file]);

  return (
    <div className="relative inline-block mr-2 mb-2">
      <div className="relative rounded-lg overflow-hidden border border-[#4f545c] bg-[#2b2d31]">
        {preview ? (
          <img src={preview} alt="attachment" className="h-24 w-24 object-cover" />
        ) : (
          <div className="h-24 w-24 flex flex-col items-center justify-center text-gray-400 p-2">
            <MdImage size={28} />
            <p className="text-[10px] mt-1 text-center truncate w-full px-1">{file.name}</p>
          </div>
        )}
        <button
          onClick={onRemove}
          className="absolute top-1 right-1 bg-[#202225] rounded-full p-0.5 hover:bg-red-600 transition"
        >
          <MdClose size={12} />
        </button>
      </div>
    </div>
  );
};

// ─── EMOJI PICKER ────────────────────────────────────────────────────────────────
const EmojiPicker = ({ onSelect, onClose }) => {
  const [activeCategory, setActiveCategory] = useState(Object.keys(EMOJI_CATEGORIES)[0]);
  const [search, setSearch] = useState("");
  const ref = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const allEmojis = Object.values(EMOJI_CATEGORIES).flat();
  const filteredEmojis = search
    ? allEmojis.filter((e) => e.includes(search))
    : EMOJI_CATEGORIES[activeCategory];

  return (
    <div
      ref={ref}
      className="absolute bottom-14 left-0 w-80 bg-[#1e1f22] border border-[#2b2d31] rounded-xl shadow-2xl z-50 flex flex-col overflow-hidden"
      style={{ animation: "fadeUp 0.15s ease" }}
    >
      {/* Search */}
      <div className="p-2 border-b border-[#2b2d31]">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search emoji..."
          className="w-full bg-[#2b2d31] text-sm text-gray-200 rounded-lg px-3 py-1.5 outline-none placeholder-gray-500"
          autoFocus
        />
      </div>

      {/* Category tabs */}
      {!search && (
        <div className="flex gap-1 px-2 pt-2 pb-1 overflow-x-auto scrollbar-none">
          {Object.keys(EMOJI_CATEGORIES).map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              title={cat}
              className={`text-base px-2 py-1 rounded-md flex-shrink-0 transition ${
                activeCategory === cat ? "bg-[#5865f2]" : "hover:bg-[#2b2d31]"
              }`}
            >
              {cat.split(" ")[0]}
            </button>
          ))}
        </div>
      )}

      {/* Emoji grid */}
      <div className="grid grid-cols-8 gap-0.5 p-2 h-48 overflow-y-auto">
        {filteredEmojis.map((emoji, i) => (
          <button
            key={i}
            onClick={() => onSelect(emoji)}
            className="text-xl hover:bg-[#2b2d31] rounded-md p-1 transition leading-none"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
};

// ─── GIF PICKER ──────────────────────────────────────────────────────────────────
const GifPicker = ({ onSelect, onClose }) => {
  const [gifs, setGifs] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  // Load trending on mount
  useEffect(() => {
    setLoading(true);
    fetchTrendingGifs().then((g) => {
      setGifs(g);
      setLoading(false);
    });
  }, []);

  // Search
  const handleSearch = useCallback(async (q) => {
    if (!q.trim()) {
      setLoading(true);
      const g = await fetchTrendingGifs();
      setGifs(g);
      setLoading(false);
      return;
    }
    setLoading(true);
    const g = await searchGifs(q);
    setGifs(g);
    setLoading(false);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => handleSearch(search), 400);
    return () => clearTimeout(t);
  }, [search, handleSearch]);

  return (
    <div
      ref={ref}
      className="absolute bottom-14 left-10 w-80 bg-[#1e1f22] border border-[#2b2d31] rounded-xl shadow-2xl z-50 flex flex-col overflow-hidden"
      style={{ animation: "fadeUp 0.15s ease" }}
    >
      <div className="p-2 border-b border-[#2b2d31] flex items-center justify-between">
        <span className="text-xs font-bold text-gray-300 uppercase tracking-wide">GIFs</span>
        <button onClick={onClose} className="text-gray-400 hover:text-white transition">
          <MdClose size={16} />
        </button>
      </div>
      <div className="p-2 border-b border-[#2b2d31]">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search Tenor..."
          className="w-full bg-[#2b2d31] text-sm text-gray-200 rounded-lg px-3 py-1.5 outline-none placeholder-gray-500"
          autoFocus
        />
      </div>
      <div className="h-56 overflow-y-auto p-1">
        {loading ? (
          <div className="flex items-center justify-center h-full text-gray-500 text-sm">Loading...</div>
        ) : gifs.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500 text-sm">No results</div>
        ) : (
          <div className="columns-2 gap-1">
            {gifs.map((gif) => {
              const url = gif?.media_formats?.gif?.url || gif?.media_formats?.tinygif?.url;
              if (!url) return null;
              return (
                <img
                  key={gif.id}
                  src={url}
                  alt={gif.title}
                  className="w-full mb-1 rounded cursor-pointer hover:opacity-80 transition"
                  onClick={() => onSelect(url)}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── MESSAGE RENDERER (handles text, image URLs, GIF URLs) ──────────────────────
const MessageContent = ({ content }) => {
  const isImageUrl = (str) => /^https?:\/\/.+\.(png|jpg|jpeg|webp|gif)(\?.*)?$/i.test(str);
  const isGifUrl = (str) => /^https:\/\/media\.tenor\.com\//i.test(str);

  if (isGifUrl(content) || isImageUrl(content)) {
    return (
      <img
        src={content}
        alt="media"
        className="max-w-xs max-h-48 rounded-lg mt-1 cursor-pointer hover:opacity-90 transition"
        onError={(e) => { e.target.style.display = "none"; }}
      />
    );
  }

  // Check if content is a base64 image (uploaded image)
  if (content.startsWith("data:image/")) {
    return (
      <img
        src={content}
        alt="uploaded"
        className="max-w-xs max-h-48 rounded-lg mt-1"
      />
    );
  }

  return <p className="leading-relaxed break-words whitespace-pre-wrap">{content}</p>;
};

// ─── REACTION BUTTON ─────────────────────────────────────────────────────────────
const QUICK_REACTIONS = ["👍","❤️","😂","😮","😢","🔥"];

const MessageReactions = ({ reactions = {}, onReact }) => {
  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {Object.entries(reactions).map(([emoji, count]) =>
        count > 0 ? (
          <button
            key={emoji}
            onClick={() => onReact(emoji)}
            className="flex items-center gap-1 bg-[#2b2d31] hover:bg-[#3f4147] border border-[#4f545c] rounded-full px-2 py-0.5 text-xs transition"
          >
            <span>{emoji}</span>
            <span className="text-gray-300">{count}</span>
          </button>
        ) : null
      )}
    </div>
  );
};

// ─── MAIN CHAT PAGE ───────────────────────────────────────────────────────────────
const ChatPage = () => {
  const { roomId, currentUser, connected, setConnected, setRoomId, setCurrentUser } = useChatContext();
  const navigate = useNavigate();
  const chatBoxRef = useRef(null);
  const fileInputRef = useRef(null);

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [stompClient, setStompClient] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [hoverMessageIdx, setHoverMessageIdx] = useState(null);
  const [messageReactions, setMessageReactions] = useState({}); // { messageIdx: { emoji: count } }

  // Redirect if not connected
  useEffect(() => {
    if (!connected) navigate("/");
  }, [connected, navigate]);

  // Load previous messages
  useEffect(() => {
    async function loadMessages() {
      try {
        const data = await getMessagess(roomId);
        setMessages(data);
      } catch (error) {
        console.error(error);
      }
    }
    if (connected) loadMessages();
  }, [connected, roomId]);

  // Auto scroll
  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [messages]);

  // WebSocket connection
  useEffect(() => {
    if (!connected) return;
    const socket = new SockJS(`${baseURL}/chat`);
    const client = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
      onConnect: () => {
        toast.success("Connected to room");
        client.subscribe(`/topic/room/${roomId}`, (message) => {
          const newMessage = JSON.parse(message.body);
          setMessages((prev) => [...prev, newMessage]);
        });
      },
      onStompError: (frame) => console.error("Broker error:", frame),
    });
    client.activate();
    setStompClient(client);
    return () => client.deactivate();
  }, [roomId, connected]);

  // Send text message
  const sendMessage = useCallback(() => {
    if ((!input.trim() && attachedFiles.length === 0) || !stompClient) return;

    // If there are attached files, send each as a separate message with base64 content
    if (attachedFiles.length > 0) {
      attachedFiles.forEach((file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const message = { sender: currentUser, content: e.target.result, roomId };
          stompClient.publish({ destination: `/app/sendMessage/${roomId}`, body: JSON.stringify(message) });
        };
        reader.readAsDataURL(file);
      });
      setAttachedFiles([]);
    }

    if (input.trim()) {
      const message = { sender: currentUser, content: input, roomId };
      stompClient.publish({ destination: `/app/sendMessage/${roomId}`, body: JSON.stringify(message) });
      setInput("");
    }
  }, [input, attachedFiles, stompClient, currentUser, roomId]);

  // Send GIF
  const sendGif = (gifUrl) => {
    if (!stompClient) return;
    const message = { sender: currentUser, content: gifUrl, roomId };
    stompClient.publish({ destination: `/app/sendMessage/${roomId}`, body: JSON.stringify(message) });
    setShowGifPicker(false);
  };

  // Emoji insert
  const insertEmoji = (emoji) => {
    setInput((prev) => prev + emoji);
  };

  // File attach
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setAttachedFiles((prev) => [...prev, ...files]);
    e.target.value = "";
  };

  // Reaction
  const handleReact = (messageIdx, emoji) => {
    setMessageReactions((prev) => {
      const current = prev[messageIdx] || {};
      return {
        ...prev,
        [messageIdx]: {
          ...current,
          [emoji]: (current[emoji] || 0) + 1,
        },
      };
    });
  };

  const handleLogout = () => {
    if (stompClient) stompClient.deactivate();
    setConnected(false);
    setRoomId("");
    setCurrentUser("");
    navigate("/");
  };

  const handleWhiteboardOpen = () => navigate(`/whiteboard/${roomId}`);

  return (
    <div className="h-screen bg-[#313338] text-gray-100 flex flex-col select-none" style={{ fontFamily: "'gg sans', 'Noto Sans', sans-serif" }}>
      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .scrollbar-none { scrollbar-width: none; }
        .scrollbar-none::-webkit-scrollbar { display: none; }
        .chat-scroll::-webkit-scrollbar { width: 8px; }
        .chat-scroll::-webkit-scrollbar-track { background: transparent; }
        .chat-scroll::-webkit-scrollbar-thumb { background: #1a1b1e; border-radius: 4px; }
        .message-row:hover .reaction-bar { opacity: 1; pointer-events: all; }
        .reaction-bar { opacity: 0; pointer-events: none; transition: opacity 0.1s; }
      `}</style>

      {/* ── Header ── */}
      <header className="h-12 flex items-center justify-between px-4 bg-[#2b2d31] border-b border-[#1e1f22] shadow-md flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-lg font-bold">#</span>
          <h1 className="font-semibold text-sm text-white">{roomId}</h1>
          <div className="h-4 w-px bg-[#4f545c] mx-1" />
          <span className="text-gray-400 text-xs hidden sm:block">Text Channel</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleWhiteboardOpen}
            className="text-xs bg-[#4f545c] hover:bg-[#5d6269] px-3 py-1.5 rounded-md transition text-gray-200"
          >
            🖊 Whiteboard
          </button>
          <span className="text-sm text-gray-400 hidden sm:block">{currentUser}</span>
          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 transition text-xs px-3 py-1.5 rounded-md font-medium"
          >
            Leave
          </button>
        </div>
      </header>

      {/* ── Messages ── */}
      <main ref={chatBoxRef} className="flex-1 overflow-y-auto px-0 py-4 chat-scroll">
        {messages.map((message, index) => {
          const isMe = message.sender === currentUser;
          const prevMessage = messages[index - 1];
          const isContinuation = prevMessage?.sender === message.sender;
          const reactions = messageReactions[index] || {};

          return (
            <div
              key={index}
              className="message-row group relative px-4 py-0.5 hover:bg-[#2e2f34] transition-colors"
              onMouseEnter={() => setHoverMessageIdx(index)}
              onMouseLeave={() => setHoverMessageIdx(null)}
            >
              {/* Quick reaction toolbar on hover */}
              <div className="reaction-bar absolute right-4 -top-3 z-10 bg-[#1e1f22] border border-[#2b2d31] rounded-lg flex items-center px-1 py-0.5 shadow-lg gap-0.5">
                {QUICK_REACTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => handleReact(index, emoji)}
                    className="text-sm px-1 py-0.5 rounded hover:bg-[#2b2d31] transition"
                    title={`React with ${emoji}`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              {!isContinuation ? (
                // Full message with avatar
                <div className="flex gap-4 mt-3">
                  <img
                    src={`https://api.dicebear.com/7.x/initials/svg?seed=${message.sender}`}
                    alt="avatar"
                    className="h-10 w-10 rounded-full flex-shrink-0 mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 mb-0.5">
                      <span className={`font-semibold text-sm ${isMe ? "text-indigo-400" : "text-white"}`}>
                        {message.sender}
                      </span>
                      <span className="text-[11px] text-gray-500">
                        {timeAgo(message.timeStamp)}
                      </span>
                    </div>
                    <div className="text-sm text-gray-200">
                      <MessageContent content={message.content} />
                    </div>
                    <MessageReactions reactions={reactions} onReact={(e) => handleReact(index, e)} />
                  </div>
                </div>
              ) : (
                // Continuation (same sender, no avatar)
                <div className="flex gap-4">
                  <div className="w-10 flex-shrink-0 flex items-center justify-center">
                    {hoverMessageIdx === index && (
                      <span className="text-[10px] text-gray-600">{timeAgo(message.timeStamp)}</span>
                    )}
                  </div>
                  <div className="flex-1 text-sm text-gray-200 min-w-0">
                    <MessageContent content={message.content} />
                    <MessageReactions reactions={reactions} onReact={(e) => handleReact(index, e)} />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </main>

      {/* ── Input Area ── */}
      <div className="px-4 pb-6 pt-0 flex-shrink-0 bg-[#313338]">
        {/* Attached files preview */}
        {attachedFiles.length > 0 && (
          <div className="flex flex-wrap mb-2 pt-2">
            {attachedFiles.map((file, i) => (
              <AttachmentPreview
                key={i}
                file={file}
                onRemove={() => setAttachedFiles((prev) => prev.filter((_, idx) => idx !== i))}
              />
            ))}
          </div>
        )}

        {/* Input box */}
        <div className="relative bg-[#383a40] rounded-xl overflow-visible">
          {/* Pickers */}
          {showEmojiPicker && (
            <EmojiPicker onSelect={(e) => { insertEmoji(e); }} onClose={() => setShowEmojiPicker(false)} />
          )}
          {showGifPicker && (
            <GifPicker onSelect={sendGif} onClose={() => setShowGifPicker(false)} />
          )}

          <div className="flex items-end px-3 py-2 gap-2">
            {/* Attach file */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-gray-400 hover:text-gray-200 transition flex-shrink-0 mb-1"
              title="Attach image"
            >
              <MdAddCircleOutline size={22} />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFileChange}
            />

            {/* Main input */}
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder={`Message #${roomId}`}
              rows={1}
              className="flex-1 bg-transparent text-sm outline-none placeholder-gray-400 resize-none leading-6 max-h-36 overflow-y-auto py-0.5"
              style={{ fontFamily: "inherit" }}
            />

            {/* GIF button */}
            <button
              onClick={() => { setShowGifPicker((v) => !v); setShowEmojiPicker(false); }}
              className={`flex-shrink-0 mb-1 transition font-bold text-xs px-1.5 py-0.5 rounded ${showGifPicker ? "text-white bg-indigo-600" : "text-gray-400 hover:text-gray-200"}`}
              title="Send a GIF"
            >
              GIF
            </button>

            {/* Emoji button */}
            <button
              onClick={() => { setShowEmojiPicker((v) => !v); setShowGifPicker(false); }}
              className={`flex-shrink-0 mb-1 transition ${showEmojiPicker ? "text-yellow-400" : "text-gray-400 hover:text-yellow-400"}`}
              title="Pick an emoji"
            >
              <BsEmojiSmile size={20} />
            </button>

            {/* Send */}
            {(input.trim() || attachedFiles.length > 0) && (
              <button
                onClick={sendMessage}
                className="flex-shrink-0 mb-1 text-indigo-400 hover:text-indigo-300 transition"
              >
                <MdSend size={20} />
              </button>
            )}
          </div>
        </div>
        <p className="text-[11px] text-gray-600 mt-1.5 px-1">
          <strong>Enter</strong> to send · <strong>Shift+Enter</strong> for new line
        </p>
      </div>
    </div>
  );
};

export default ChatPage;