import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";
import { baseURL } from "../config/AxiosHelper";

const WhiteboardPage = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();

  const canvasRef = useRef(null);
  const contextRef = useRef(null);

  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState("#000000");
  const [stompClient, setStompClient] = useState(null);

  const lastPosition = useRef(null);

  // -------------------------------
  // Setup WebSocket (STOMP)
  // -------------------------------
  useEffect(() => {
    const socket = new SockJS(`${baseURL}/chat`);

    const client = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
      onConnect: () => {
        console.log("Whiteboard connected");

        client.subscribe(`/topic/whiteboard/${roomId}`, (message) => {
          console.log("Received event:", message.body);
          const event = JSON.parse(message.body);
          drawFromEvent(event);
        });
      }
    });

    client.activate();
    setStompClient(client);

    return () => {
      client.deactivate();
    };
  }, [roomId]);

  // -------------------------------
  // Setup Canvas
  // -------------------------------
  useEffect(() => {
    const canvas = canvasRef.current;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight - 70;

    const context = canvas.getContext("2d");
    context.lineCap = "round";
    context.lineWidth = 3;

    contextRef.current = context;
  }, []);

  // -------------------------------
  // Draw From Received Event
  // -------------------------------
  const drawFromEvent = (event) => {
    const ctx = contextRef.current;

    ctx.strokeStyle = event.color;

    ctx.beginPath();
    ctx.moveTo(event.x0, event.y0);
    ctx.lineTo(event.x1, event.y1);
    ctx.stroke();
    ctx.closePath();
  };


  // -------------------------------
  // Start Drawing
  // -------------------------------
    const startDrawing = ({ nativeEvent }) => {
    const { offsetX, offsetY } = nativeEvent;

    lastPosition.current = { x: offsetX, y: offsetY };
    setIsDrawing(true);
  };

  // -------------------------------
  // Draw
  // -------------------------------
  const draw = ({ nativeEvent }) => {
    if (!isDrawing) return;

    const { offsetX, offsetY } = nativeEvent;
    const prev = lastPosition.current;

    const ctx = contextRef.current;
    ctx.strokeStyle = color;

    ctx.beginPath();
    ctx.moveTo(prev.x, prev.y);
    ctx.lineTo(offsetX, offsetY);
    ctx.stroke();
    ctx.closePath();

    // Send to backend
    sendDrawEvent({
      x0: prev.x,
      y0: prev.y,
      x1: offsetX,
      y1: offsetY,
      color
    });

    // Update last position
    lastPosition.current = { x: offsetX, y: offsetY };
  };


  // -------------------------------
  // Stop Drawing
  // -------------------------------
    const stopDrawing = () => {
    setIsDrawing(false);
    lastPosition.current = null;
   };


  // -------------------------------
  // Send Event via STOMP
  // -------------------------------
  const sendDrawEvent = (eventData) => {
    if (!stompClient) {
    console.log("STOMP NOT READY");
    return;
  }

  console.log("Sending event:", eventData);

    stompClient.publish({
      destination: `/app/whiteboard/${roomId}`,
      body: JSON.stringify(eventData)
    });
  };

  // -------------------------------
  // Clear Canvas
  // -------------------------------
  const clearCanvas = () => {
    const canvas = canvasRef.current;
    contextRef.current.clearRect(0, 0, canvas.width, canvas.height);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">

      {/* Top Bar */}
      <div className="flex justify-between items-center px-6 py-3 bg-white shadow-md">
        <h2 className="text-lg font-semibold">
          Whiteboard - Room {roomId}
        </h2>

        <div className="flex gap-4 items-center">

          {/* Color Picker */}
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-10 h-10 border rounded cursor-pointer"
          />

          <button
            onClick={clearCanvas}
            className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition"
          >
            Clear
          </button>

          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition"
          >
            Back
          </button>
        </div>
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        className="bg-white cursor-crosshair"
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
      />
    </div>
  );
};

export default WhiteboardPage;
