import React, { useEffect, useRef, useState } from "react";
import { MdAttachFile, MdSend } from "react-icons/md";
import useChatContext from "../context/ChatContext";
import { useNavigate } from "react-router";
import SockJS from "sockjs-client";
import { Stomp } from "@stomp/stompjs";
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
  // console.log(roomId);
  // console.log(currentUser);
  // console.log(connected);

  const navigate = useNavigate();
  useEffect(() => {
    if (!connected) {
      navigate("/");
    }
  }, [connected, roomId, currentUser]);

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const inputRef = useRef(null);
  const chatBoxRef = useRef(null);
  const [stompClient, setStompClient] = useState(null);

  //page init:
  //messages ko load karne honge

  useEffect(() => {
    async function loadMessages() {
      try {
        const messages = await getMessagess(roomId);
        // console.log(messages);
        setMessages(messages);
      } catch (error) {}
    }
    if (connected) {
      loadMessages();
    }
  }, []);

  //scroll down

  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scroll({
        top: chatBoxRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  //stompClient ko init karne honge
  //subscribe

  useEffect(() => {
    const connectWebSocket = () => {
      ///SockJS
      const sock = new SockJS(`${baseURL}/chat`);
      const client = Stomp.over(sock);

      client.connect({}, () => {
        setStompClient(client);

        toast.success("connected");

        client.subscribe(`/topic/room/${roomId}`, (message) => {
          console.log(message);

          const newMessage = JSON.parse(message.body);

          setMessages((prev) => [...prev, newMessage]);

          //rest of the work after success receiving the message
        });
      });
    };

    if (connected) {
      connectWebSocket();
    }

    //stomp client
  }, [roomId]);

  //send message handle

  const sendMessage = async () => {
    if (stompClient && connected && input.trim()) {
      console.log(input);

      const message = {
        sender: currentUser,
        content: input,
        roomId: roomId,
      };

      stompClient.send(
        `/app/sendMessage/${roomId}`,
        {},
        JSON.stringify(message)
      );
      setInput("");
    }

    //
  };

  function handleLogout() {
    stompClient.disconnect();
    setConnected(false);
    setRoomId("");
    setCurrentUser("");
    navigate("/");
  }

  return (
  <div className="h-screen bg-gray-950 text-gray-100 flex flex-col">
    
    {/* Header */}
    <header className="h-14 flex items-center justify-between px-6 bg-gray-900 border-b border-gray-800">
      <h1 className="font-semibold text-sm">
        # {roomId}
      </h1>

      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-400">{currentUser}</span>
        <button
          onClick={handleLogout}
          className="bg-red-600 hover:bg-red-700 text-xs px-3 py-1.5 rounded-md"
        >
          Leave
        </button>
      </div>
    </header>

    {/* Messages */}
    <main
      ref={chatBoxRef}
      className="flex-1 overflow-y-auto px-6 py-4 space-y-4"
    >
      {messages.map((message, index) => {
        const isMe = message.sender === currentUser;

        return (
          <div
            key={index}
            className={`flex gap-3 ${
              isMe ? "justify-end" : "justify-start"
            }`}
          >
            {!isMe && (
              <img
                src="https://avatar.iran.liara.run/public/43"
                className="h-9 w-9 rounded-full"
              />
            )}

            <div className="max-w-xl">
              <div
                className={`px-4 py-2 rounded-lg text-sm ${
                  isMe
                    ? "bg-blue-600 text-white rounded-br-none"
                    : "bg-gray-800 text-gray-100 rounded-bl-none"
                }`}
              >
                {!isMe && (
                  <p className="text-xs font-semibold text-gray-300 mb-1">
                    {message.sender}
                  </p>
                )}
                <p>{message.content}</p>
              </div>
              <p className="text-[11px] text-gray-500 mt-1">
                {timeAgo(message.timeStamp)}
              </p>
            </div>
          </div>
        );
      })}
    </main>

    {/* Message Input */}
    <div className="p-4 bg-gray-900 border-t border-gray-800">
      <div className="flex items-center gap-3 bg-gray-800 rounded-lg px-3 py-2">
        <button className="text-gray-400 hover:text-gray-200">
          <MdAttachFile size={20} />
        </button>

        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          type="text"
          placeholder="Message #room"
          className="flex-1 bg-transparent text-sm outline-none placeholder-gray-500"
        />

        <button
          onClick={sendMessage}
          className="text-blue-500 hover:text-blue-400"
        >
          <MdSend size={20} />
        </button>
      </div>
    </div>
  </div>
);
};

export default ChatPage;
