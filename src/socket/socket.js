import { Server } from "socket.io";

let io;

export function setupSocketIO(server) {
  io = new Server(server, {
    cors: {
      origin: process.env.CORS_URI&& process.env.CORS_URI.split(',').filter(Boolean), // Set the allowed origin directly
      credentials: true, 
      methods: ["GET", "POST"]
    }
  });

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Emit the 'start-socket' event when a new connection is established
    socket.emit('start-socket', 'Hello from the  customer websocket connected!');

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
}

export function attachSocketIO(req, res, next) {
    req.io = io;
    next();
}
