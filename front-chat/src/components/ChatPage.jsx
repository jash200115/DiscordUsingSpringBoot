import React, { useEffect, useRef, useState } from "react";
import { MdAttachFile, MdSend } from "react-icons/md";
import useChatContext from "../context/ChatContext";
import { useNavigate } from "react-router";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";
import toast from "react-hot-toast";
import { baseURL } from "../config/AxiosHelper";
import { getMessagess } from "../services/RoomService";
import { timeAgo } from "../config/helper";

const ChatPage = () => {
  const {
    roomId,
    currentUser,
    connected,
    setConnected,
    setRoomId,
    setCurrentUser,
  } = useChatContext();

  const navigate = useNavigate();
  const chatBoxRef = useRef(null);

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [stompClient, setStompClient] = useState(null);

  // Redirect if not connected
  useEffect(() => {
    if (!connected) {
      navigate("/");
    }
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

    if (connected) {
      loadMessages();
    }
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
      onStompError: (frame) => {
        console.error("Broker error:", frame);
      },
    });

    client.activate();
    setStompClient(client);

    return () => {
      client.deactivate();
    };
  }, [roomId, connected]);

  // Send message
  const sendMessage = () => {
    if (!input.trim() || !stompClient) return;

    const message = {
      sender: currentUser,
      content: input,
      roomId,
    };

    stompClient.publish({
      destination: `/app/sendMessage/${roomId}`,
      body: JSON.stringify(message),
    });

    setInput("");
  };

  const handleLogout = () => {
    if (stompClient) stompClient.deactivate();
    setConnected(false);
    setRoomId("");
    setCurrentUser("");
    navigate("/");
  };

  const handleWhiteboardOpen = () => {
  navigate(`/whiteboard/${roomId}`);
  };

  // Avatar generator (stable + no broken API)
  const getAvatar = (username) =>
    `https://api.dicebear.com/7.x/initials/svg?seed=${username}`;

  return (
    <div className="h-screen bg-[#313338] text-gray-100 flex flex-col">
      
      {/* Header */}
      <header className="h-14 flex items-center justify-between px-6 bg-[#2b2d31] border-b border-[#1e1f22] shadow">
        <h1 className="font-semibold text-sm tracking-wide">
          # {roomId} 
          <button
           onClick={handleWhiteboardOpen}
           className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
          >
            Whiteboard
          </button>
        </h1>

        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400">{currentUser}</span>
          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 transition text-xs px-3 py-1.5 rounded-md"
          >
            Leave
          </button>
        </div>
      </header>

      {/* Messages */}
      <main
  ref={chatBoxRef}
  className="flex-1 overflow-y-auto px-6 py-6 space-y-4"
>
  {messages.map((message, index) => {
    const isMe = message.sender === currentUser;

    return (
      <div
        key={index}
        className={`flex ${isMe ? "justify-end" : "justify-start"}`}
      >
        <div
          className={`flex gap-3 max-w-[70%] ${
            isMe ? "flex-row-reverse" : "flex-row"
          }`}
        >
          {/* Avatar */}
          <img
            src={`https://api.dicebear.com/7.x/initials/svg?seed=${message.sender}`}
            alt="avatar"
            className="h-9 w-9 rounded-full"
          />

          {/* Message bubble */}
          <div>
            <div
              className={`px-4 py-2 rounded-2xl text-sm shadow ${
                isMe
                  ? "bg-indigo-600 text-white rounded-br-none"
                  : "bg-[#3f4147] text-gray-100 rounded-bl-none"
              }`}
            >
              {!isMe && (
                <p className="text-xs font-semibold text-gray-300 mb-1">
                  {message.sender}
                </p>
              )}

              <p className="leading-relaxed break-words">
                {message.content}
              </p>
            </div>

            <p
              className={`text-[11px] mt-1 ${
                isMe ? "text-right text-gray-400" : "text-gray-500"
              }`}
            >
              {timeAgo(message.timeStamp)}
            </p>
          </div>
        </div>
      </div>
    );
  })}
</main>

      {/* Input */}
      <div className="p-4 bg-[#2b2d31] border-t border-[#1e1f22]">
        <div className="flex items-center gap-3 bg-[#383a40] rounded-xl px-4 py-2">
          <button className="text-gray-400 hover:text-gray-200 transition">
            <MdAttachFile size={20} />
          </button>

          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            type="text"
            placeholder={`Message #${roomId}`}
            className="flex-1 bg-transparent text-sm outline-none placeholder-gray-400"
          />

          <button
            onClick={sendMessage}
            className="text-indigo-400 hover:text-indigo-300 transition"
          >
            <MdSend size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
