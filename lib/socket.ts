import { Server as NetServer } from "http";
import { NextApiRequest, NextApiResponse } from "next";
import { Server as ServerIO } from "socket.io";

declare global {
  var io: any;
}

export const config = {
  api: {
    bodyParser: false,
  },
};

// Track online users and typing users
const onlineUsers = new Set<string>();
const typingUsers = new Map<string, NodeJS.Timeout>();

const SocketHandler = (req: NextApiRequest, res: NextApiResponse & { socket: any }) => {
  console.log("🔧 Socket handler called");

  if (res.socket.server.io) {
    console.log("Socket is already running");
  } else {
    console.log("Socket is initializing");
    const httpServer: NetServer = res.socket.server as any;
    const io = new ServerIO(httpServer, {
      path: "/api/socket/io",
      addTrailingSlash: false,
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });

    res.socket.server.io = io;
    global.io = io; // Store globally for cron access

    io.on("connection", (socket) => {
      console.log(`✅ User connected: ${socket.id}`);

      // Send welcome message immediately
      socket.emit("receiveMessage", {
        id: Date.now(),
        text: "Welcome! Socket connection is working.",
        sender: "System",
        timestamp: new Date().toISOString(),
        type: "cron"
      });

      socket.on("sendMessage", (data) => {
        console.log("� Received message data:", data);
        const message = {
          id: Date.now(),
          text: data.message || data.text || "No message text",
          sender: data.sender || "Anonymous",
          timestamp: new Date().toISOString(),
          type: "user"
        };

        console.log("📨 Broadcasting message:", message);
        io.emit("receiveMessage", message);
      });

      socket.on("disconnect", (reason) => {
        console.log(`❌ User disconnected: ${socket.id}. Reason: ${reason}`);
      });
    });

    console.log("🔌 Socket server initialized successfully");
  }
  res.end();
};

export default SocketHandler;
