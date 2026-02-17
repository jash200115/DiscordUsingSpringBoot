import React, { useState } from "react";
import chatIcon from "../assets/chat.png";
import toast from "react-hot-toast";
import { createRoomApi, joinChatApi } from "../services/RoomService";
import useChatContext from "../context/ChatContext";
import { useNavigate } from "react-router";
const JoinCreateChat = () => {
  const [detail, setDetail] = useState({
    roomId: "",
    userName: "",
  });

  const { roomId, userName, setRoomId, setCurrentUser, setConnected } =
    useChatContext();
  const navigate = useNavigate();

  function handleFormInputChange(event) {
    setDetail({
      ...detail,
      [event.target.name]: event.target.value,
    });
  }

  function validateForm() {
    if (detail.roomId === "" || detail.userName === "") {
      toast.error("Invalid Input !!");
      return false;
    }
    return true;
  }

  async function joinChat() {
    if (validateForm()) {
      //join chat

      try {
        const room = await joinChatApi(detail.roomId);
        toast.success("joined..");
        setCurrentUser(detail.userName);
        setRoomId(room.roomId);
        setConnected(true);
        navigate("/chat");
      } catch (error) {
        if (error.status == 400) {
          toast.error(error.response.data);
        } else {
          toast.error("Error in joining room");
        }
        console.log(error);
      }
    }
  }

  async function createRoom() {
    if (validateForm()) {
      //create room
      console.log(detail);
      // call api to create room on backend
      try {
        const response = await createRoomApi(detail.roomId);
        console.log(response);
        toast.success("Room Created Successfully !!");
        //join the room
        setCurrentUser(detail.userName);
        setRoomId(response.roomId);
        setConnected(true);

        navigate("/chat");

        //forward to chat page...
      } catch (error) {
        console.log(error);
        if (error.status == 400) {
          toast.error("Room  already exists !!");
        } else {
          toast("Error in creating room");
        }
      }
    }
  }

  return (
  <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
    <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl p-8">
      
      {/* Icon */}
      <div className="flex justify-center mb-6">
        <img src={chatIcon} className="w-16 opacity-95" />
      </div>

      {/* Title */}
      <h1 className="text-2xl font-bold text-white text-center mb-2">
        Join a Room
      </h1>

      <p className="text-sm text-gray-400 text-center mb-8">
        Enter a Room ID to join an existing room or create a new one.
      </p>

      {/* Username */}
      <div className="mb-5">
        <label className="block text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
          Username
        </label>
        <input
          type="text"
          name="userName"
          value={detail.userName}
          onChange={handleFormInputChange}
          placeholder="Enter your name"
          className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 text-sm px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
        />
      </div>

      {/* Room ID */}
      <div className="mb-8">
        <label className="block text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
          Room ID
        </label>
        <input
          type="text"
          name="roomId"
          value={detail.roomId}
          onChange={handleFormInputChange}
          placeholder="Enter room ID"
          className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 text-sm px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        <button
          onClick={joinChat}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2.5 rounded-lg transition duration-200"
        >
          Join Room
        </button>

        <button
          onClick={createRoom}
          className="flex-1 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold py-2.5 rounded-lg transition duration-200"
        >
          Create Room
        </button>
      </div>
    </div>
  </div>
);
};

export default JoinCreateChat;
