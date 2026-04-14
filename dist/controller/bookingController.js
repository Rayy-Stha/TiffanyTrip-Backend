"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.confirmBooking = exports.cancelBooking = exports.getBookingById = exports.getOperatorBookings = exports.getUserBookings = exports.createBooking = void 0;
const index_1 = __importDefault(require("../model/index"));
// Create a booking
const createBooking = async (req, res) => {
    try {
        const user = req.user;
        const { scheduleId, seatNumbers, travelDate } = req.body;
        console.log('🎫 Booking Request:', { user: user.email, scheduleId, seatNumbers, travelDate });
        if (!scheduleId || !seatNumbers || !Array.isArray(seatNumbers) || seatNumbers.length === 0 || !travelDate) {
            return res.status(400).json({
                message: 'Schedule ID, seat numbers (array), and travel date are required'
            });
        }
        // Get schedule with current bookings
        const schedule = await index_1.default.schedule.findUnique({
            where: { id: parseInt(scheduleId) },
            include: {
                bus: true,
                route: true,
                bookings: {
                    where: {
                        status: {
                            in: ['PENDING', 'CONFIRMED']
                        },
                        travelDate: new Date(travelDate)
                    }
                }
            }
        });
        if (!schedule) {
            return res.status(404).json({ message: 'Schedule not found' });
        }
        // Check if seats are already booked
        const bookedSeats = schedule.bookings.flatMap(b => b.seatNumbers);
        const conflictingSeats = seatNumbers.filter(seat => bookedSeats.includes(seat));
        if (conflictingSeats.length > 0) {
            return res.status(400).json({
                message: 'Some seats are already booked',
                conflictingSeats
            });
        }
        // Check if enough seats available
        if (seatNumbers.length > schedule.availableSeats) {
            return res.status(400).json({
                message: 'Not enough seats available',
                requested: seatNumbers.length,
                available: schedule.availableSeats
            });
        }
        // Calculate total fare
        const totalFare = schedule.fare * seatNumbers.length;
        // Create booking
        const booking = await index_1.default.booking.create({
            data: {
                travellerId: user.id,
                scheduleId: parseInt(scheduleId),
                seatNumbers,
                totalFare,
                travelDate: new Date(travelDate),
                status: 'PENDING'
            },
            include: {
                schedule: {
                    include: {
                        bus: true,
                        route: true
                    }
                },
                traveller: {
                    select: {
                        id: true,
                        full_name: true,
                        email: true,
                        phone: true
                    }
                }
            }
        });
        // Update available seats
        await index_1.default.schedule.update({
            where: { id: parseInt(scheduleId) },
            data: {
                availableSeats: schedule.availableSeats - seatNumbers.length
            }
        });
        console.log('✅ Booking created:', booking.id);
        return res.status(201).json({
            message: 'Booking created successfully',
            booking
        });
    }
    catch (err) {
        console.error('Create Booking Error:', err);
        return res.status(500).json({ message: 'Error creating booking' });
    }
};
exports.createBooking = createBooking;
// Get user's bookings
const getUserBookings = async (req, res) => {
    try {
        const user = req.user;
        const bookings = await index_1.default.booking.findMany({
            where: { travellerId: user.id },
            include: {
                schedule: {
                    include: {
                        bus: true,
                        route: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        // Map totalFare to totalPrice for frontend compatibility
        const bookingsWithPrice = bookings.map(b => ({
            ...b,
            totalPrice: b.totalFare
        }));
        return res.status(200).json({
            message: 'Bookings fetched successfully',
            count: bookings.length,
            bookings: bookingsWithPrice
        });
    }
    catch (err) {
        console.error('Get User Bookings Error:', err);
        return res.status(500).json({ message: 'Error fetching bookings' });
    }
};
exports.getUserBookings = getUserBookings;
// Get all bookings for an operator (via their buses/schedules)
const getOperatorBookings = async (req, res) => {
    try {
        const user = req.user;
        if (user.role !== 'BUS_OPERATOR' && user.role !== 'ADMIN') {
            return res.status(403).json({ message: 'Only bus operators can view these bookings' });
        }
        const bookings = await index_1.default.booking.findMany({
            where: {
                schedule: {
                    bus: {
                        operatorId: user.id
                    }
                }
            },
            include: {
                schedule: {
                    include: {
                        bus: true,
                        route: true
                    }
                },
                traveller: {
                    select: {
                        id: true,
                        full_name: true,
                        phone: true,
                        email: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        // Map totalFare to totalPrice for frontend compatibility
        const bookingsWithPrice = bookings.map(b => ({
            ...b,
            totalPrice: b.totalFare
        }));
        return res.status(200).json({
            message: 'Operator bookings fetched successfully',
            count: bookings.length,
            bookings: bookingsWithPrice
        });
    }
    catch (err) {
        console.error('Get Operator Bookings Error:', err);
        return res.status(500).json({ message: 'Error fetching operator bookings' });
    }
};
exports.getOperatorBookings = getOperatorBookings;
// Get booking by ID
const getBookingById = async (req, res) => {
    try {
        const user = req.user;
        const { id } = req.params;
        const bookingId = Array.isArray(id) ? id[0] : id;
        const booking = await index_1.default.booking.findUnique({
            where: { id: parseInt(bookingId) },
            include: {
                schedule: {
                    include: {
                        bus: {
                            include: {
                                operator: {
                                    select: {
                                        id: true,
                                        full_name: true,
                                        phone: true,
                                        email: true
                                    }
                                }
                            }
                        },
                        route: true
                    }
                },
                traveller: {
                    select: {
                        id: true,
                        full_name: true,
                        email: true,
                        phone: true
                    }
                }
            }
        });
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }
        // Check if user owns this booking
        if (booking.travellerId !== user.id && user.role !== 'ADMIN') {
            return res.status(403).json({ message: 'You can only view your own bookings' });
        }
        const bookingWithPrice = {
            ...booking,
            totalPrice: booking.totalFare
        };
        return res.status(200).json({ booking: bookingWithPrice });
    }
    catch (err) {
        console.error('Get Booking Error:', err);
        return res.status(500).json({ message: 'Error fetching booking' });
    }
};
exports.getBookingById = getBookingById;
// Cancel booking
const cancelBooking = async (req, res) => {
    try {
        const user = req.user;
        const { id } = req.params;
        const bookingId = Array.isArray(id) ? id[0] : id;
        const booking = await index_1.default.booking.findUnique({
            where: { id: parseInt(bookingId) },
            include: {
                schedule: true
            }
        });
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }
        // Check ownership
        if (booking.travellerId !== user.id && user.role !== 'ADMIN') {
            return res.status(403).json({ message: 'You can only cancel your own bookings' });
        }
        // Check if already cancelled
        if (booking.status === 'CANCELLED') {
            return res.status(400).json({ message: 'Booking is already cancelled' });
        }
        // Update booking status
        const updatedBooking = await index_1.default.booking.update({
            where: { id: parseInt(bookingId) },
            data: { status: 'CANCELLED' }
        });
        // Restore available seats
        await index_1.default.schedule.update({
            where: { id: booking.scheduleId },
            data: {
                availableSeats: booking.schedule.availableSeats + booking.seatNumbers.length
            }
        });
        console.log('✅ Booking cancelled:', id);
        return res.status(200).json({
            message: 'Booking cancelled successfully',
            booking: updatedBooking
        });
    }
    catch (err) {
        console.error('Cancel Booking Error:', err);
        return res.status(500).json({ message: 'Error cancelling booking' });
    }
};
exports.cancelBooking = cancelBooking;
// Confirm booking (payment confirmation)
const confirmBooking = async (req, res) => {
    try {
        const user = req.user;
        const { id } = req.params;
        const bookingId = Array.isArray(id) ? id[0] : id;
        const booking = await index_1.default.booking.findUnique({
            where: { id: parseInt(bookingId) }
        });
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }
        // Check ownership
        if (booking.travellerId !== user.id && user.role !== 'ADMIN') {
            return res.status(403).json({ message: 'You can only confirm your own bookings' });
        }
        // Update booking status
        const updatedBooking = await index_1.default.booking.update({
            where: { id: parseInt(bookingId) },
            data: { status: 'CONFIRMED' },
            include: {
                schedule: {
                    include: {
                        bus: true,
                        route: true
                    }
                }
            }
        });
        console.log('✅ Booking confirmed:', id);
        return res.status(200).json({
            message: 'Booking confirmed successfully',
            booking: updatedBooking
        });
    }
    catch (err) {
        console.error('Confirm Booking Error:', err);
        return res.status(500).json({ message: 'Error confirming booking' });
    }
};
exports.confirmBooking = confirmBooking;
//# sourceMappingURL=bookingController.js.map