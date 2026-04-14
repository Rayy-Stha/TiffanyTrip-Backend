"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initSocket = void 0;
const socket_io_1 = require("socket.io");
const index_1 = __importDefault(require("./model/index"));
const initSocket = (server) => {
    const io = new socket_io_1.Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"]
        }
    });
    console.log('🔌 Socket.io initialized');
    io.on('connection', (socket) => {
        console.log('👤 User connected:', socket.id);
        // Join a conversation room based on bookingId or orderId
        socket.on('join_room', (roomId) => {
            // roomId could be a raw bookingId (old style) or a prefixed one like 'order_123'
            const room = roomId.includes('_') ? roomId : `booking_${roomId}`;
            socket.join(room);
            console.log(`📡 User ${socket.id} joined room: ${room}`);
        });
        // Handle sending messages
        socket.on('send_message', async (data) => {
            try {
                const { bookingId, orderId, senderId, receiverId, content } = data;
                // 1. Save message to database
                const message = await index_1.default.message.create({
                    data: {
                        bookingId: bookingId || null,
                        orderId: orderId || null,
                        senderId,
                        receiverId,
                        content,
                    },
                    include: {
                        sender: {
                            select: {
                                id: true,
                                full_name: true,
                                avatar_url: true
                            }
                        }
                    }
                });
                // 2. Broadcast to the room
                const room = orderId ? `order_${orderId}` : `booking_${bookingId}`;
                io.to(room).emit('receive_message', message);
                console.log(`✉️ Message sent in room ${room}`);
            }
            catch (error) {
                console.error('❌ Error sending message:', error);
                socket.emit('error', { message: 'Failed to send message' });
            }
        });
        socket.on('disconnect', () => {
            console.log('👤 User disconnected:', socket.id);
        });
    });
    return io;
};
exports.initSocket = initSocket;
//# sourceMappingURL=socket.js.map