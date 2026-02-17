import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { HashRouter } from "react-router-dom";
import AppRoutes from "./config/Routes.jsx";
import { Toaster } from "react-hot-toast";
import { ChatProvider } from "./context/ChatContext.jsx";

createRoot(document.getElementById("root")).render(
  <HashRouter>
    <Toaster position="top-center" />
    <ChatProvider>
      <AppRoutes />
    </ChatProvider>
  </HashRouter>
);
