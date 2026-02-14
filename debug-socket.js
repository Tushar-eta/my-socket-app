// Simple socket connection test
// Run this in browser console on http://localhost:3000

console.log("🔧 Testing socket connection...");

// Try to connect to socket
const socket = io("http://localhost:3000", {
  path: "/api/socket/io",
  addTrailingSlash: false,
  transports: ['polling']
});

socket.on("connect", () => {
  console.log("✅ Connected to socket server with ID:", socket.id);
});

socket.on("disconnect", (reason) => {
  console.log("❌ Disconnected from socket server. Reason:", reason);
});

socket.on("connect_error", (error) => {
  console.log("🔴 Socket connection error:", error.message);
  console.log("🔴 Full error:", error);
});

socket.on("receiveMessage", (message) => {
  console.log("📨 Received message:", message);
});

// Test sending a message after 3 seconds
setTimeout(() => {
  if (socket.connected) {
    console.log("📤 Sending test message...");
    socket.emit("sendMessage", {
      text: "Test message from debug script",
      sender: "DebugUser"
    });
  } else {
    console.log("❌ Cannot send message - socket not connected");
  }
}, 3000);
