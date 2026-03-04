# 💬 NexChat — Real-Time Chat Application

> A full-stack, production-grade real-time messaging platform built with **Spring Boot**, **React**, **WebSockets (STOMP/SockJS)**, **MongoDB**, and **Spring AI**. Inspired by Discord's UI, featuring room-based chat, JWT authentication, AI assistant, collaborative whiteboard, GIF/emoji support, and file sharing.

<video controls src="Screen Recording 2026-03-05 015033.mp4" title="Demo"></video>

---

## 📌 Table of Contents

- [Architecture Overview](#-architecture-overview)
- [Tech Stack](#-tech-stack)
- [System Design Concepts](#-system-design-concepts)
- [Backend Deep-Dive](#-backend-deep-dive)
- [Frontend Deep-Dive](#-frontend-deep-dive)
- [Key Features](#-key-features)
- [Project Structure](#-project-structure)
- [API Reference](#-api-reference)
- [WebSocket Protocol](#-websocket-protocol)
- [Security Model](#-security-model)
- [AI Integration](#-ai-integration)
- [Getting Started](#-getting-started)
- [Interview Q&A Cheat Sheet](#-interview-qa-cheat-sheet)

---

## 🏗 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT (React + Vite)                        │
│  ┌──────────────┐  ┌──────────────────┐  ┌───────────────────────┐  │
│  │   Chat Page  │  │  Whiteboard Page  │  │  JoinCreate / Auth   │  │
│  └──────┬───────┘  └────────┬─────────┘  └──────────┬────────────┘  │
│         │ STOMP/WS          │ STOMP/WS               │ REST/JWT      │
└─────────┼───────────────────┼────────────────────────┼──────────────┘
          │                   │                        │
          ▼                   ▼                        ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Spring Boot Backend (Java 21)                      │
│  ┌──────────────────┐  ┌──────────────────┐  ┌───────────────────┐  │
│  │  WebSocket Config │  │  REST Controllers │  │  Spring Security  │  │
│  │  (STOMP Broker)  │  │  /api/v1/rooms    │  │  + JWT Filter     │  │
│  └────────┬─────────┘  │  /api/auth        │  └───────────────────┘  │
│           │             │  /api/v1/nexchat  │                         │
│           │             └────────┬──────────┘                         │
│  ┌────────▼─────────────────────▼──────────────────────────────────┐ │
│  │                  Service / Repository Layer                       │ │
│  │   RoomService   NexchatService (Spring AI)   UserRepository      │ │
│  └────────────────────────────┬─────────────────────────────────────┘ │
└───────────────────────────────┼─────────────────────────────────────┘
                                │
                    ┌───────────▼──────────────┐
                    │    MongoDB Atlas / Local   │
                    │  Collections: rooms,       │
                    │  users, nexchat_convos     │
                    └──────────────────────────┘
                                │
                    ┌───────────▼──────────────┐
                    │  OpenRouter AI API         │
                    │  (GPT-OSS-120B via         │
                    │   Spring AI abstraction)   │
                    └──────────────────────────┘
```

---

## 🛠 Tech Stack

### Backend

| Technology | Version | Purpose |
|---|---|---|
| **Java** | 21 | Language (uses Records, Sealed Classes, Virtual Threads capable) |
| **Spring Boot** | 3.4.1 | Application framework, auto-configuration |
| **Spring WebSocket** | via Boot | STOMP broker, WebSocket handshake |
| **Spring Security** | via Boot | JWT-based stateless auth, RBAC |
| **Spring Data MongoDB** | via Boot | Repository pattern, auto-index creation |
| **Spring AI** | 1.0.0 | LLM abstraction layer (OpenAI-compatible) |
| **MongoDB** | 6+ | NoSQL document store for rooms, messages, users |
| **JJWT** | 0.11.5 | JWT generation, signing, validation |
| **Lombok** | 1.18.36 | Boilerplate reduction (`@Builder`, `@RequiredArgsConstructor`) |
| **Maven** | 3.x | Build tool, dependency management |

### Frontend

| Technology | Version | Purpose |
|---|---|---|
| **React** | 19 | UI library, component tree, hooks |
| **Vite** | 6.x | Build tool, HMR dev server |
| **Tailwind CSS** | 4.x | Utility-first CSS framework |
| **@stomp/stompjs** | 7.3.0 | STOMP client over WebSocket |
| **SockJS-client** | latest | WebSocket fallback transport |
| **Axios** | latest | HTTP client, centralized instance |
| **React Router** | v7 | Client-side routing |
| **React Hot Toast** | latest | Toast notifications |
| **Tenor API** | v2 | GIF search integration |
| **DiceBear API** | 7.x | Auto-generated user avatars |

---

## 🧠 System Design Concepts

### 1. WebSocket vs HTTP — Why WebSocket for Chat?

| HTTP (REST) | WebSocket |
|---|---|
| Request-Response (half-duplex) | Full-duplex (bidirectional) |
| Client must poll for new data | Server pushes data instantly |
| New TCP connection per request | Persistent TCP connection |
| Higher latency for real-time | Low latency, ideal for chat |

**Interview Answer:** "In a chat app, we need the server to push messages to all clients the moment a message is sent. HTTP would require each client to constantly poll (`GET /messages`) every second — wasteful and laggy. WebSocket upgrades an HTTP connection to a persistent, bidirectional channel, so the server can `publish` to clients instantly."

### 2. STOMP over WebSocket — The Pub/Sub Pattern

WebSocket is just a raw transport. **STOMP** (Simple Text Oriented Messaging Protocol) adds a messaging layer with:

- **Destinations** (like topics): `/topic/room/{roomId}`
- **Publisher/Subscriber model**: Any client subscribed to a topic gets the message
- **Application endpoints**: `/app/sendMessage/{roomId}` → Spring `@MessageMapping`

```
Client A publishes → /app/sendMessage/room1
                          ↓
              Spring MessageBroker
                          ↓
     Broadcasts to all subscribers of /topic/room/room1
                          ↓
        Client B, C, D all receive the message in real-time
```

**Interview Answer:** "STOMP adds structure on top of raw WebSocket. The Spring `@MessageBroker` acts like an in-memory message bus — clients subscribe to topic channels, and the broker fan-outs messages. This is the Observer/Pub-Sub pattern."

### 3. Stateless Auth with JWT

The app is **stateless** — the server stores NO session. Every request carries a self-contained JWT.

```
Login → Server signs JWT(userId, roles, expiry) with SECRET_KEY
      → Client stores token
      
Next Request → Client sends: Authorization: Bearer <token>
             → JwtAuthenticationFilter extracts + validates token
             → Sets SecurityContext (no DB call needed for auth check)
```

**Interview Answer:** "JWT eliminates server-side session storage, making the backend horizontally scalable. Any replica can validate the token using the shared secret. The tradeoff is you cannot invalidate a token before expiry without a token blacklist (e.g., Redis)."

### 4. MongoDB Document Model for Chat

Rooms embed messages directly (denormalized):

```json
{
  "_id": "...",
  "roomId": "general",
  "messages": [
    { "sender": "alice", "content": "Hello!", "timeStamp": "..." },
    { "sender": "bob",   "content": "Hi!",    "timeStamp": "..." }
  ]
}
```

**Why denormalized?** Chat messages are almost always read in the context of their room. Embedding avoids expensive JOINs. Tradeoff: MongoDB documents have a **16 MB limit**, so pagination (`subList`) is applied server-side.

**Interview Answer:** "In SQL we'd have `rooms` and `messages` tables with a FK. In MongoDB we embed because reads always fetch room + messages together — this is the access pattern. The penalty is document size growth over time, which is why we paginate and could archive old messages."

### 5. Pagination Strategy

```java
int start = Math.max(0, messages.size() - (page + 1) * size);
int end   = Math.min(messages.size(), start + size);
List<Message> paginatedMessages = messages.subList(start, end);
```

This returns the **most recent N messages** first (like chat apps do). Page 0 = latest, page 1 = older, etc.

### 6. Spring AI — LLM Abstraction Layer

Spring AI provides a vendor-agnostic `ChatClient` interface. Swap OpenAI for Anthropic/Gemini by changing config — zero code change.

```java
// Same code works for any LLM provider
String response = chatClient.prompt()
    .user(fullPrompt)
    .call()
    .content();
```

Conversation history is manually maintained in MongoDB and prepended to each prompt — simulating **stateful conversation** with a stateless API.

---

## 🔙 Backend Deep-Dive

### Package Structure

```
chat-app-backend/src/main/java/com/substring/chat/
├── config/
│   ├── WebSocketConfig.java        # STOMP broker configuration
│   ├── SecurityConfig.java         # Spring Security filter chain
│   ├── JwtAuthenticationFilter.java # OncePerRequestFilter for JWT
│   ├── JwtUtil.java                # Token generation & parsing
│   └── AiConfig.java              # ChatClient bean (Spring AI)
├── controllers/
│   ├── ChatController.java         # @MessageMapping WebSocket handler
│   ├── RoomController.java         # REST: CRUD for rooms & messages
│   ├── AuthController.java         # REST: register/login
│   └── NexchatController.java      # REST: AI chat endpoint
├── entities/
│   ├── Room.java                   # @Document: roomId + List<Message>
│   ├── Message.java                # Embedded: sender, content, timestamp
│   ├── User.java                   # @Document: email, password(hashed), roles
│   └── NexchatConversation.java    # @Document: username + conversation history
├── repositories/
│   ├── RoomRepository.java         # MongoRepository<Room, String>
│   ├── UserRepository.java         # MongoRepository<User, String>
│   └── NexchatRepository.java      # MongoRepository<NexchatConversation, String>
├── services/
│   └── NexchatService.java         # AI conversation logic with history
└── playload/
    ├── LoginRequest.java
    └── RegisterRequest.java
```

### WebSocket Configuration

```java
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {
    
    // In-memory STOMP broker for topic-based pub/sub
    config.enableSimpleBroker("/topic");
    
    // Messages sent to /app/... are routed to @MessageMapping methods
    config.setApplicationDestinationPrefixes("/app");
    
    // SockJS endpoint — provides WebSocket with HTTP long-polling fallback
    registry.addEndpoint("/chat").setAllowedOrigins("*").withSockJS();
}
```

### Chat Controller (STOMP Handler)

```java
@MessageMapping("/sendMessage/{roomId}")
@SendTo("/topic/room/{roomId}")
public Message sendMessage(@DestinationVariable String roomId, @Payload Message message) {
    // Persists message to MongoDB room document, then broadcasts to all subscribers
}
```

### JWT Filter Chain

```
HTTP Request
    → JwtAuthenticationFilter (extracts token from "Authorization: Bearer ...")
        → JwtUtil.extractEmail(token)
        → UserRepository.findByEmail(email)
        → Sets UsernamePasswordAuthenticationToken in SecurityContextHolder
    → Spring Security's authorization checks
    → Controller
```

---

## 🖥 Frontend Deep-Dive

### Component Structure

```
front-chat/src/
├── components/
│   ├── JoinCreateChat.jsx    # Landing: create/join room, login/register
│   ├── ChatPage.jsx          # Main chat UI (messages, emoji, GIF, file upload)
│   └── WhiteboardPage.jsx    # Collaborative canvas over WebSocket
├── context/
│   └── ChatContext.jsx       # Global state: roomId, currentUser, connected
├── config/
│   └── AxiosHelper.js        # Configured Axios instance (baseURL, interceptors)
├── services/
│   └── RoomService.js        # API calls: createRoom, joinRoom, getMessages
└── App.jsx                   # Router: /, /chat/:roomId, /whiteboard/:roomId
```

### State Management Pattern

Uses **React Context API** for global state (no Redux needed at this scale):

```jsx
// ChatContext provides: roomId, currentUser, connected, setters
const { roomId, currentUser, connected } = useChatContext();
```

**Interview Answer:** "Context API is suitable here because state updates are infrequent (join once, set username once). Redux would add overhead without benefit. For larger apps with frequent cross-component updates, Zustand or Redux Toolkit would be better."

### WebSocket Lifecycle in React

```
useEffect (on mount) 
  → new SockJS(baseURL + "/chat")
  → new Client({ webSocketFactory })
  → client.activate()
  → onConnect: subscribe to /topic/room/{roomId}
  → receive messages → setState

useEffect cleanup (on unmount)
  → client.deactivate() // prevents memory leaks
```

### Optimized Message Sending (useCallback)

```jsx
const sendMessage = useCallback(() => {
    stompClient.publish({ destination: `/app/sendMessage/${roomId}`, body: JSON.stringify(message) });
}, [input, stompClient, currentUser, roomId]); // Only recreated when deps change
```

**Interview Answer:** "`useCallback` memoizes the function reference. Without it, every render creates a new function — which matters if it's passed as a prop to child components, causing unnecessary re-renders."

---

## ✨ Key Features

| Feature | Implementation |
|---|---|
| 🔴 **Real-time messaging** | WebSocket + STOMP pub/sub per room |
| 🏠 **Room-based chat** | Dynamic topic channels `/topic/room/{roomId}` |
| 🔐 **JWT Authentication** | Stateless, BCrypt passwords, role-based |
| 🤖 **NexChat AI Assistant** | Spring AI + OpenRouter (GPT-OSS-120B), per-user conversation history |
| 🎨 **Collaborative Whiteboard** | Canvas drawing events broadcast via `/topic/whiteboard/{roomId}` |
| 😄 **Emoji Picker** | Categorized, searchable, custom built |
| 🎞 **GIF Support** | Tenor API v2 integration (search + trending) |
| 📎 **Image File Sharing** | Base64 encoded, sent via STOMP |
| 👍 **Message Reactions** | Client-side state (6 quick emojis) |
| 🪪 **Auto Avatars** | DiceBear API generates unique SVG avatars from username |
| 📜 **Message Pagination** | Last N messages, page-based subList |
| 🔄 **Auto-reconnect** | `reconnectDelay: 5000` in STOMP client |

---

## 📁 Project Structure

```
nexchat/
├── chat-app-backend/           # Spring Boot Maven project
│   ├── pom.xml
│   └── src/main/java/com/substring/chat/
│       ├── config/             # Security, WebSocket, JWT, AI config
│       ├── controllers/        # REST + STOMP controllers
│       ├── entities/           # MongoDB @Document models
│       ├── repositories/       # MongoRepository interfaces
│       ├── services/           # Business logic (AI service)
│       └── playload/           # Request DTOs
│
└── front-chat/                 # React + Vite project
    ├── package.json
    ├── vite.config.js
    └── src/
        ├── components/         # React pages/components
        ├── context/            # ChatContext (global state)
        ├── config/             # Axios configuration
        └── services/           # API service layer
```

---

## 📡 API Reference

### Auth Endpoints

| Method | Endpoint | Body | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | `{ username, email, password }` | Register new user |
| `POST` | `/api/auth/login` | `{ email, password }` | Returns JWT token |

### Room Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/v1/rooms` | Public | Create a room (body = room name as plain text) |
| `GET` | `/api/v1/rooms` | Public | Get all rooms |
| `GET` | `/api/v1/rooms/{roomId}` | Public | Join/get room details |
| `GET` | `/api/v1/rooms/{roomId}/messages?page=0&size=50` | Public | Paginated messages |

### AI Endpoint

| Method | Endpoint | Body | Description |
|---|---|---|---|
| `POST` | `/api/v1/nexchat/ask` | `{ username, question }` | Ask NexChat AI (maintains per-user history) |

---

## 🔌 WebSocket Protocol

### Connection

```javascript
const socket = new SockJS('http://localhost:8080/chat');
const client = new Client({ webSocketFactory: () => socket });
client.activate();
```

### Subscriptions

| Topic | Description |
|---|---|
| `/topic/room/{roomId}` | Receive chat messages for a room |
| `/topic/whiteboard/{roomId}` | Receive whiteboard draw events |

### Publishing

| Destination | Payload | Description |
|---|---|---|
| `/app/sendMessage/{roomId}` | `{ sender, content, roomId }` | Send a chat message |
| `/app/whiteboard/{roomId}` | `{ x0, y0, x1, y1, color }` | Send a draw event |

---

## 🔒 Security Model

```
Public routes (no token needed):
  /api/auth/**        → register & login
  /api/v1/nexchat/**  → AI endpoint
  /api/v1/rooms       → list/create rooms
  /chat/**            → WebSocket handshake

Protected routes:
  /api/admin/**       → ROLE_ADMIN only
  /api/user/**        → ROLE_USER only
  All other /api/**   → authenticated

JWT Flow:
  1. User logs in → receives signed JWT
  2. Frontend stores token (memory/localStorage)  
  3. Axios interceptor attaches: Authorization: Bearer <token>
  4. JwtAuthenticationFilter validates on every request
  5. Spring Security enforces role-based access
```

**Password Security:** BCrypt hashing with salt (via `BCryptPasswordEncoder`). Never store plain-text passwords.

**CORS:** Configured to allow `http://localhost:5173` (Vite dev server) with credentials support.

**CSRF:** Disabled — safe for stateless JWT APIs (CSRF attacks target cookie-based sessions).

---

## 🤖 AI Integration

**Spring AI** abstracts LLM providers. This project uses **OpenRouter** (OpenAI-compatible API) with `openai/gpt-oss-120b:free`.

### How Conversation Memory Works

```
User: "What is 2+2?"
  → Load NexchatConversation from MongoDB (or create new)
  → Build prompt: "USER: What is 2+2?"
  → Call LLM → "4"
  → Append both messages to history → Save to MongoDB

User: "Multiply that by 3"
  → Load history from MongoDB
  → Build prompt: "USER: What is 2+2?\nASSISTANT: 4\nUSER: Multiply that by 3"
  → LLM has full context → responds "12"
```

**System Prompt:** "You are NexChat AI, a helpful, friendly, and concise assistant..."

**Interview Answer:** "LLMs are stateless — each API call is independent. To simulate memory, we store the entire conversation history in MongoDB and prepend it to every new prompt. This is the 'message window' pattern. Production systems use vector databases (RAG) for long-term memory or truncate history to fit the context window."

---

## 🚀 Getting Started

### Prerequisites

- Java 21+
- Node.js 20+
- MongoDB (local or Atlas)
- OpenRouter API key (free tier available)

### Backend

```bash
cd chat-app-backend

# Configure application.properties:
# spring.mongodb.uri=mongodb://localhost:27017/chatapp
# spring.ai.openai.api-key=YOUR_OPENROUTER_KEY
# spring.ai.openai.base-url=https://openrouter.ai/api/v1
# spring.ai.openai.chat.model=openai/gpt-oss-120b:free

mvn spring-boot:run
# Server starts on http://localhost:8080
```

### Frontend

```bash
cd front-chat
npm install
npm run dev
# App starts on http://localhost:5173
---

## 📄 License

MIT License — feel free to use, modify, and distribute.

---

*Built with ❤️ using Spring Boot 3, React 19, WebSocket/STOMP, MongoDB, and Spring AI*