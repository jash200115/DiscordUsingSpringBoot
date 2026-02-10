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
  <div className="min-h-screen bg-gray-950 flex items-center justify-center">
    <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-xl shadow-xl p-6">
      
      {/* Icon */}
      <div className="flex justify-center mb-4">
        <img src={chatIcon} className="w-16 opacity-90" />
      </div>

      {/* Title */}
      <h1 className="text-xl font-semibold text-center mb-1">
        Join a Room
      </h1>
      <p className="text-sm text-gray-400 text-center mb-6">
        Enter a room ID to join or create a new one
      </p>

      {/* Username */}
      <div className="mb-4">
        <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">
          Username
        </label>
        <input
          type="text"
          name="userName"
          value={detail.userName}
          onChange={handleFormInputChange}
          placeholder="Enter your name"
          className="w-full bg-gray-800 border border-gray-700 text-sm px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Room ID */}
      <div className="mb-6">
        <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">
          Room ID
        </label>
        <input
          type="text"
          name="roomId"
          value={detail.roomId}
          onChange={handleFormInputChange}
          placeholder="Enter room ID"
          className="w-full bg-gray-800 border border-gray-700 text-sm px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={joinChat}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 rounded-md transition"
        >
          Join Room
        </button>
        <button
          onClick={createRoom}
          className="flex-1 bg-gray-700 hover:bg-gray-600 text-gray-100 text-sm font-medium py-2 rounded-md transition"
        >
          Create Room
        </button>
      </div>
    </div>
  </div>
);
};

export default JoinCreateChat;
