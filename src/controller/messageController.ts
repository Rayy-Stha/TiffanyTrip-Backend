import { Request, Response } from 'express';
import prisma from '../model/index';

// Get message history for a booking
export const getBookingMessages = async (req: Request, res: Response) => {
    try {
        const { bookingId } = req.params;
        const id = Array.isArray(bookingId) ? bookingId[0] : bookingId;
        const parsedBookingId = parseInt(id);

        if (isNaN(parsedBookingId)) {
            return res.status(400).json({ message: 'Invalid booking ID' });
        }

        const user = (req as any).user;

        // Verify user is part of this booking (either traveler or bus operator)
        const booking = await prisma.booking.findUnique({
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

        const messages = await prisma.message.findMany({
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

    } catch (error) {
        console.error('Get Messages Error:', error);
        return res.status(500).json({ message: 'Error fetching messages' });
    }
};

// Get message history for an order
export const getOrderMessages = async (req: Request, res: Response) => {
    try {
        const { orderId } = req.params;
        const id = Array.isArray(orderId) ? orderId[0] : orderId;
        const parsedOrderId = parseInt(id);

        if (isNaN(parsedOrderId)) {
            return res.status(400).json({ message: 'Invalid order ID' });
        }

        const user = (req as any).user;

        // Verify user is part of this order (either traveler or restaurant owner)
        const order = await prisma.order.findUnique({
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

        const messages = await prisma.message.findMany({
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

    } catch (error) {
        console.error('Get Order Messages Error:', error);
        return res.status(500).json({ message: 'Error fetching messages' });
    }
};

// Mark messages as read
export const markAsRead = async (req: Request, res: Response) => {
    try {
        const { bookingId, orderId } = req.params;
        const user = (req as any).user;

        const where: any = {
            receiverId: user.id,
            isRead: false
        };

        if (bookingId) {
            where.bookingId = parseInt(Array.isArray(bookingId) ? bookingId[0] : bookingId);
        } else if (orderId) {
            where.orderId = parseInt(Array.isArray(orderId) ? orderId[0] : orderId);
        } else {
            return res.status(400).json({ message: 'Booking ID or Order ID is required' });
        }

        await prisma.message.updateMany({
            where,
            data: {
                isRead: true
            }
        });

        return res.status(200).json({ message: 'Messages marked as read' });
    } catch (error) {
        console.error('Mark as Read Error:', error);
        return res.status(500).json({ message: 'Error marking messages as read' });
    }
};
