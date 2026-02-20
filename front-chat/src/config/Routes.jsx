import React from "react";
import { Routes, Route } from "react-router-dom";
import App from "../App";
import ChatPage from "../components/ChatPage";
import WhiteboardPage from "../components/WhiteboardPage";
import HomePage from "../pages/HomePage";
const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/chat" element={<ChatPage />} />
      <Route path="/whiteboard/:roomId" element={<WhiteboardPage />} />
      <Route path="/about" element={<h1>This is about page</h1>} />
      <Route path="*" element={<h1>404 Page Not Found</h1>} />
    </Routes>
  );
};

export default AppRoutes;
