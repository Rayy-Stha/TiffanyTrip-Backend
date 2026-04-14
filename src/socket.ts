import { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import prisma from './model/index';

export const initSocket = (server: HttpServer) => {
    const io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"]
        }
    });

    console.log('🔌 Socket.io initialized');

    io.on('connection', (socket) => {
        console.log('👤 User connected:', socket.id);

        // Join a conversation room based on bookingId or orderId
        socket.on('join_room', (roomId: string) => {
            // roomId could be a raw bookingId (old style) or a prefixed one like 'order_123'
            const room = roomId.includes('_') ? roomId : `booking_${roomId}`;
            socket.join(room);
            console.log(`📡 User ${socket.id} joined room: ${room}`);
        });

        // Handle sending messages
        socket.on('send_message', async (data: {
            bookingId?: number,
            orderId?: number,
            senderId: number,
            receiverId: number,
            content: string
        }) => {
            try {
                const { bookingId, orderId, senderId, receiverId, content } = data;

                // 1. Save message to database
                const message = await prisma.message.create({
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

            } catch (error) {
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
