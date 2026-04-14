"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.markAsRead = exports.getOrderMessages = exports.getBookingMessages = void 0;
const index_1 = __importDefault(require("../model/index"));
// Get message history for a booking
const getBookingMessages = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const id = Array.isArray(bookingId) ? bookingId[0] : bookingId;
        const parsedBookingId = parseInt(id);
        if (isNaN(parsedBookingId)) {
            return res.status(400).json({ message: 'Invalid booking ID' });
        }
        const user = req.user;
        // Verify user is part of this booking (either traveler or bus operator)
        const booking = await index_1.default.booking.findUnique({
            where: { id: parsedBookingId },
            include: {
                schedule: {
                    include: {
                        bus: true
                    }
                }
            }
        });
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }
        const isTraveler = booking.travellerId === user.id;
        const isOperator = booking.schedule.bus.operatorId === user.id;
        if (!isTraveler && !isOperator && user.role !== 'ADMIN') {
            return res.status(403).json({ message: 'You are not authorized to view these messages' });
        }
        const messages = await index_1.default.message.findMany({
            where: { bookingId: parsedBookingId },
            include: {
                sender: {
                    select: {
                        id: true,
                        full_name: true,
                        avatar_url: true
                    }
                }
            },
            orderBy: {
                createdAt: 'asc'
            }
        });
        return res.status(200).json({
            message: 'Messages fetched successfully',
            count: messages.length,
            messages
        });
    }
    catch (error) {
        console.error('Get Messages Error:', error);
        return res.status(500).json({ message: 'Error fetching messages' });
    }
};
exports.getBookingMessages = getBookingMessages;
// Get message history for an order
const getOrderMessages = async (req, res) => {
    try {
        const { orderId } = req.params;
        const id = Array.isArray(orderId) ? orderId[0] : orderId;
        const parsedOrderId = parseInt(id);
        if (isNaN(parsedOrderId)) {
            return res.status(400).json({ message: 'Invalid order ID' });
        }
        const user = req.user;
        // Verify user is part of this order (either traveler or restaurant owner)
        const order = await index_1.default.order.findUnique({
            where: { id: parsedOrderId },
            include: {
                restaurant: true
            }
        });
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }
        const isTraveler = order.travellerId === user.id;
        const isRestaurantOwner = order.restaurant.ownerId === user.id;
        if (!isTraveler && !isRestaurantOwner && user.role !== 'ADMIN') {
            return res.status(403).json({ message: 'You are not authorized to view these messages' });
        }
        const messages = await index_1.default.message.findMany({
            where: { orderId: parsedOrderId },
            include: {
                sender: {
                    select: {
                        id: true,
                        full_name: true,
                        avatar_url: true
                    }
                }
            },
            orderBy: {
                createdAt: 'asc'
            }
        });
        return res.status(200).json({
            message: 'Messages fetched successfully',
            count: messages.length,
            messages
        });
    }
    catch (error) {
        console.error('Get Order Messages Error:', error);
        return res.status(500).json({ message: 'Error fetching messages' });
    }
};
exports.getOrderMessages = getOrderMessages;
// Mark messages as read
const markAsRead = async (req, res) => {
    try {
        const { bookingId, orderId } = req.params;
        const user = req.user;
        const where = {
            receiverId: user.id,
            isRead: false
        };
        if (bookingId) {
            where.bookingId = parseInt(Array.isArray(bookingId) ? bookingId[0] : bookingId);
        }
        else if (orderId) {
            where.orderId = parseInt(Array.isArray(orderId) ? orderId[0] : orderId);
        }
        else {
            return res.status(400).json({ message: 'Booking ID or Order ID is required' });
        }
        await index_1.default.message.updateMany({
            where,
            data: {
                isRead: true
            }
        });
        return res.status(200).json({ message: 'Messages marked as read' });
    }
    catch (error) {
        console.error('Mark as Read Error:', error);
        return res.status(500).json({ message: 'Error marking messages as read' });
    }
};
exports.markAsRead = markAsRead;
//# sourceMappingURL=messageController.js.map