const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');
const cron = require('node-cron');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Global message store for cron
let latestMessage = null;

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  // Initialize Socket.IO
  const io = new Server(httpServer, {
    path: '/api/socket/io',
    addTrailingSlash: false,
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  // Store io globally for cron access
  global.io = io;

  // Track online users
  const onlineUsers = new Set();

  // Cron job is now handled by API route - disabled here to prevent duplicates
  console.log("Original cron job disabled - using API route instead");

  io.on('connection', (socket) => {
    console.log(`✅ User connected: ${socket.id}`);

    // Add user to online users
    onlineUsers.add(socket.id);

    // Broadcast updated online count
    io.emit('onlineUsers', Array.from(onlineUsers));
    io.emit('usersOnline', onlineUsers.size);

    // Send welcome message
    socket.emit('receiveMessage', {
      id: Date.now(),
      text: 'Welcome! Socket connection is working.',
      sender: 'System',
      timestamp: new Date().toISOString(),
      type: 'cron'
    });

    socket.on('sendMessage', (data) => {
      console.log('📨 Received message data:', data);
      const message = {
        id: Date.now(),
        text: data.message || data.text || 'No message text',
        sender: data.sender || 'Anonymous',
        timestamp: new Date().toISOString(),
        type: 'user'
      };

      console.log('📨 Broadcasting message:', message);
      io.emit('receiveMessage', message);
    });

    socket.on('disconnect', (reason) => {
      console.log(`❌ User disconnected: ${socket.id}. Reason: ${reason}`);

      // Remove user from online users
      onlineUsers.delete(socket.id);

      // Broadcast updated online count
      io.emit('onlineUsers', Array.from(onlineUsers));
      io.emit('usersOnline', onlineUsers.size);
    });
  });

  console.log('🔌 Socket server initialized successfully');

  httpServer.once('error', (err) => {
    console.error(err);
    process.exit(1);
  });

  httpServer.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
