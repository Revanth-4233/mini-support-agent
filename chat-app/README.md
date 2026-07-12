# 💬 ChatApp — Real-Time Chat Application

A production-quality, real-time chat application built with **React Native (Expo)** on the frontend and **Node.js + Express + Socket.io + MongoDB** on the backend. Messages are delivered instantly via WebSockets and persisted in MongoDB.

> **Live API URL**: `https://mini-support-agent.onrender.com` _(update after deployment)_

---

## ✨ Features

### Core
- ✅ **Real-time messaging** — instant message delivery via Socket.io (no page refresh needed)
- ✅ **Message broadcasting** — new messages broadcast to all connected users in real time
- ✅ **Connection handling** — graceful handling of user connections and disconnections
- ✅ **Persistent chat history** — messages stored in MongoDB and loaded on app start
- ✅ **REST API** — send and fetch messages via Express endpoints
- ✅ **Auto-scroll** — chat scrolls to newest message automatically
- ✅ **Timestamps** — every message shows formatted date and time
- ✅ **Loading state** — spinner shown while fetching messages
- ✅ **Error handling** — error banners with retry option on API/socket failures
- ✅ **Auto-reconnect** — socket reconnects automatically on disconnect

### Bonus (All Implemented ✅)
- ✅ **Username-based login** — dummy authentication with display name entry
- ✅ **Typing indicator** — animated "User is typing..." with bouncing dots
- ✅ **Online/offline user status** — real-time count of connected users in the header with green/red connection indicator
- ✅ **Message read/delivered status** — sent (✓), delivered (✓✓ grey), read (✓✓ blue) tick indicators on own messages
- ✅ **MongoDB storage** — all messages persisted in MongoDB with Mongoose ODM
- ✅ **Logout** — return to login screen and disconnect socket cleanly

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React Native, Expo (managed workflow) |
| **HTTP Client** | Axios |
| **Real-time** | Socket.io-client |
| **Date Formatting** | dayjs |
| **Backend** | Node.js, Express.js |
| **WebSocket Server** | Socket.io |
| **Database** | MongoDB with Mongoose |
| **Dev Tools** | nodemon, dotenv, cors |

---

## 📁 Folder Structure

```
chat-app/
├── backend/
│   ├── config/
│   │   └── db.js                # MongoDB connection
│   ├── controllers/
│   │   └── messageController.js # Business logic (send/get)
│   ├── middlewares/
│   │   └── errorHandler.js      # Global error handler
│   ├── models/
│   │   └── Message.js           # Mongoose schema
│   ├── routes/
│   │   └── messageRoutes.js     # API routes
│   ├── socket/
│   │   └── socket.js            # Socket.io server setup
│   ├── app.js                   # Express app configuration
│   ├── server.js                # Entry point
│   ├── package.json
│   ├── .env
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ChatBubble.js     # Message bubble component
│   │   │   ├── Header.js         # App header with online count
│   │   │   ├── MessageInput.js   # Text input + send button
│   │   │   └── TypingIndicator.js # Animated typing display
│   │   ├── constants/
│   │   │   └── index.js          # API URLs, app config
│   │   ├── hooks/
│   │   │   └── useSocket.js      # Socket.io custom hook
│   │   ├── screens/
│   │   │   ├── ChatScreen.js     # Main chat screen
│   │   │   └── LoginScreen.js    # Username entry screen
│   │   ├── services/
│   │   │   ├── api.js            # Axios API layer
│   │   │   └── socket.js         # Socket.io client singleton
│   │   └── styles/
│   │       └── theme.js          # Colors, spacing, typography
│   ├── App.js                    # Root component
│   ├── package.json
│   └── app.json
│
└── README.md
```

---

## 🚀 Installation & Setup

### Prerequisites
- **Node.js** (v18 or higher)
- **npm** (v9 or higher)
- **MongoDB** (local installation or [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) free tier)
- **Expo Go** app on your phone (for mobile testing)

### 1. Clone the Repository

```bash
git clone <repository-url>
cd chat-app
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file (or copy from `.env.example`):

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/chatapp
```

> **Using MongoDB Atlas (recommended for deployment)?** See the [MongoDB Atlas Setup](#-mongodb-atlas-setup) section below.

Start the development server:

```bash
npm run dev
```

The server will start at `http://localhost:5000`.

### 3. Frontend Setup

```bash
cd frontend
npm install
```

**Configure the backend URL** in `src/constants/index.js`:

```javascript
// For Android emulator: use 'http://10.0.2.2:5000'
// For physical device: use your machine's LAN IP 'http://192.168.x.x:5000'
// For iOS simulator / web: 'http://localhost:5000' works
```

Start the Expo dev server:

```bash
npx expo start
```

Then:
- Press `w` to open in web browser
- Press `a` to open in Android emulator
- Scan QR code with Expo Go on your phone

---

## 🌐 Environment Variables

### Backend (`.env`)

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `5000` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/chatapp` |

### Frontend (`src/constants/index.js`)

| Variable | Description | Default |
|----------|-------------|---------|
| `API_BASE_URL` | Backend API URL | `http://localhost:5000/api` |
| `SOCKET_URL` | Socket.io server URL | `http://localhost:5000` |

---

## 🍃 MongoDB Atlas Setup

If you don't have MongoDB installed locally, use **MongoDB Atlas** (free tier):

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and create a free account.
2. Click **"Build a Cluster"** → choose the **free shared tier (M0)**.
3. Under **Database Access**, create a database user with a username and password.
4. Under **Network Access**, click **"Add IP Address"** → select **"Allow Access from Anywhere"** (`0.0.0.0/0`) for development.
5. Go to your cluster → click **"Connect"** → choose **"Connect your application"**.
6. Copy the connection string. It will look like:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/chatapp?retryWrites=true&w=majority
   ```
7. Replace `<username>` and `<password>` with your database user credentials.
8. Paste the connection string into your `.env` file:
   ```env
   MONGODB_URI=mongodb+srv://youruser:yourpassword@cluster0.xxxxx.mongodb.net/chatapp?retryWrites=true&w=majority
   ```

---

## 📡 API Documentation

### `POST /api/messages` — Send a Message

**Request Body:**
```json
{
  "name": "Mukesh",
  "message": "Hello"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Message sent successfully",
  "data": {
    "_id": "...",
    "name": "Mukesh",
    "message": "Hello",
    "createdAt": "2026-07-11T12:00:00.000Z",
    "updatedAt": "2026-07-11T12:00:00.000Z"
  }
}
```

**Error Response (400):**
```json
{
  "success": false,
  "message": "Message is required"
}
```

---

### `GET /api/messages` — Fetch Chat History

**Success Response (200):**
```json
[
  {
    "_id": "...",
    "name": "Mukesh",
    "message": "Hello",
    "createdAt": "2026-07-11T12:00:00.000Z",
    "updatedAt": "2026-07-11T12:00:00.000Z"
  }
]
```

Messages are sorted by `createdAt` (oldest first).

---

### `GET /api/health` — Health Check

**Response (200):**
```json
{
  "status": "ok",
  "timestamp": "2026-07-11T12:00:00.000Z"
}
```

---

## 🔌 Socket Events

### Client → Server

| Event | Payload | Description |
|-------|---------|-------------|
| `join` | `username` (string) | Register user on connect |
| `sendMessage` | message object | Send message via socket |
| `typing` | `username` (string) | Notify others that user is typing |
| `stopTyping` | `username` (string) | Notify others that user stopped typing |
| `messageDelivered` | `messageId` (string) | Mark a message as delivered |
| `messageRead` | `messageId[]` (string array) | Mark messages as read |

### Server → Client

| Event | Payload | Description |
|-------|---------|-------------|
| `receiveMessage` | message object | New message broadcast |
| `userList` | `string[]` | Updated list of online usernames |
| `typing` | `username` (string) | Someone started typing |
| `stopTyping` | `username` (string) | Someone stopped typing |
| `messageStatusUpdate` | `{ messageId, status }` | Message status changed (delivered/read) |

---

## 💡 Design Decisions

1. **REST + Socket.io hybrid**: Messages are **saved via REST API** (guaranteeing persistence) and then **broadcast via Socket.io** (guaranteeing real-time delivery). This ensures no messages are lost even if a socket briefly disconnects.

2. **Singleton socket pattern**: A single socket connection is shared across the app to avoid resource waste from multiple connections.

3. **FlatList over ScrollView**: `FlatList` virtualizes rendering, which means only visible messages are rendered — critical for performance with large chat histories.

4. **Memoized ChatBubble**: The `ChatBubble` component uses `React.memo` to prevent unnecessary re-renders when the messages list updates.

5. **dayjs over date-fns**: dayjs is ~2KB (vs date-fns which requires tree-shaking), making it a better fit for React Native bundle size.

6. **No React Navigation**: Since there are only two screens (Login → Chat), simple conditional rendering avoids the overhead of a navigation library.

7. **KeyboardAvoidingView**: Ensures the input bar stays visible when the keyboard opens on mobile devices.

8. **Auto-reconnect with exponential backoff**: Socket.io client is configured with `reconnection: true` and increasing delays to handle network interruptions gracefully.

---

## 🔮 Assumptions

- Users share a single public chat room (no private messaging or rooms).
- No authentication — usernames are self-reported and not verified.
- MongoDB is running and accessible before starting the backend.
- The app is designed for use on the same local network during development.

---

## 🚀 Future Improvements

- 🔐 **JWT authentication** — proper user registration and login
- 📱 **Push notifications** — notify users of new messages when app is backgrounded
- 🏠 **Chat rooms** — multiple rooms / channels with room selection UI
- 📎 **File sharing** — image and file upload support
- 🗑️ **Message deletion** — ability to delete or edit sent messages
- 📖 **Pagination** — lazy-load messages for better performance with large histories
- 🌐 **i18n** — multi-language support
- 🧪 **Tests** — unit tests with Jest, integration tests with Supertest

---

## 🌍 Deployment

### Backend — Deploy to Render

1. Push your backend code to a GitHub repository.
2. Go to [render.com](https://render.com) and create a new **Web Service**.
3. Connect your GitHub repo, set the root directory to `backend/`.
4. Configure:
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Environment Variables**: Set `PORT` and `MONGODB_URI` (use MongoDB Atlas connection string).
5. Deploy. Your API will be available at `https://your-app.onrender.com`.

> **Live API URL**: `https://mini-support-agent.onrender.com` _(update with your actual Render URL after deployment)_

### Frontend — Build APK

```bash
cd frontend
npx -y eas-cli build --platform android --profile preview
```

Or for a development build:

```bash
npx expo start --android
```

### Update Frontend URLs

After deploying the backend, update `src/constants/index.js`:

```javascript
const getBaseUrl = () => {
  return 'https://your-app.onrender.com'; // Replace with your Render URL
};
```

---

## 📸 Screenshots

> Screenshots will be added after the first successful run.

---

## 📄 License

MIT License. See [LICENSE](LICENSE) for details.
