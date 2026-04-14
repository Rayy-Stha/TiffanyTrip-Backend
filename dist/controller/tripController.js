"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTripRestaurants = exports.deleteTrip = exports.updateTrip = exports.getTripById = exports.getUserTrips = exports.createTrip = void 0;
const index_1 = __importDefault(require("../model/index"));
// Create a trip
const createTrip = async (req, res) => {
    try {
        const user = req.user;
        const { name, destination, budget, startDate, endDate, bookingIds, orderIds } = req.body;
        console.log('🗺️ Create Trip Request:', { user: user.email, name, startDate, endDate });
        if (!name || !startDate || !endDate) {
            return res.status(400).json({
                message: 'Name, start date, and end date are required'
            });
        }
        // Verify bookings belong to user
        if (bookingIds && bookingIds.length > 0) {
            const bookings = await index_1.default.booking.findMany({
                where: {
                    id: { in: bookingIds.map((id) => parseInt(id)) },
                    travellerId: user.id
                }
            });
            if (bookings.length !== bookingIds.length) {
                return res.status(400).json({
                    message: 'Some bookings do not belong to you or do not exist'
                });
            }
        }
        // Verify orders belong to user
        if (orderIds && orderIds.length > 0) {
            const orders = await index_1.default.order.findMany({
                where: {
                    id: { in: orderIds.map((id) => parseInt(id)) },
                    travellerId: user.id
                }
            });
            if (orders.length !== orderIds.length) {
                return res.status(400).json({
                    message: 'Some orders do not belong to you or do not exist'
                });
            }
        }
        const trip = await index_1.default.trip.create({
            data: {
                name,
                destination: destination || "",
                budget: budget ? parseFloat(budget) : 0,
                travellerId: user.id,
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                status: 'PLANNED',
                ...(bookingIds && bookingIds.length > 0 && {
                    bookings: {
                        connect: bookingIds.map((id) => ({ id: parseInt(id) }))
                    }
                }),
                ...(orderIds && orderIds.length > 0 && {
                    orders: {
                        connect: orderIds.map((id) => ({ id: parseInt(id) }))
                    }
                })
            },
            include: {
                bookings: {
                    include: {
                        schedule: {
                            include: {
                                bus: true,
                                route: true
                            }
                        }
                    }
                },
                orders: {
                    include: {
                        restaurant: true
                    }
                }
            }
        });
        console.log('✅ Trip created:', trip.id);
        return res.status(201).json({
            message: 'Trip created successfully',
            trip
        });
    }
    catch (err) {
        console.error('Create Trip Error:', err);
        return res.status(500).json({ message: 'Error creating trip' });
    }
};
exports.createTrip = createTrip;
// Get user's trips
const getUserTrips = async (req, res) => {
    try {
        const user = req.user;
        const trips = await index_1.default.trip.findMany({
            where: { travellerId: user.id },
            include: {
                bookings: {
                    include: {
                        schedule: {
                            include: {
                                bus: true,
                                route: true
                            }
                        }
                    }
                },
                orders: {
                    include: {
                        restaurant: true
                    }
                },
                _count: {
                    select: {
                        bookings: true,
                        orders: true
                    }
                }
            },
            orderBy: {
                startDate: 'desc'
            }
        });
        return res.status(200).json({
            message: 'Trips fetched successfully',
            count: trips.length,
            trips
        });
    }
    catch (err) {
        console.error('Get User Trips Error:', err);
        return res.status(500).json({ message: 'Error fetching trips' });
    }
};
exports.getUserTrips = getUserTrips;
// Get trip by ID
const getTripById = async (req, res) => {
    try {
        const user = req.user;
        const { id } = req.params;
        const tripId = Array.isArray(id) ? id[0] : id;
        const trip = await index_1.default.trip.findUnique({
            where: { id: parseInt(tripId) },
            include: {
                traveller: {
                    select: {
                        id: true,
                        full_name: true,
                        email: true,
                        phone: true
                    }
                },
                bookings: {
                    include: {
                        schedule: {
                            include: {
                                bus: {
                                    include: {
                                        operator: {
                                            select: {
                                                id: true,
                                                full_name: true,
                                                phone: true
                                            }
                                        }
                                    }
                                },
                                route: true
                            }
                        }
                    }
                },
                orders: {
                    include: {
                        restaurant: {
                            include: {
                                owner: {
                                    select: {
                                        id: true,
                                        full_name: true,
                                        phone: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });
        if (!trip) {
            return res.status(404).json({ message: 'Trip not found' });
        }
        // Check ownership
        if (trip.travellerId !== user.id && user.role !== 'ADMIN') {
            return res.status(403).json({ message: 'You can only view your own trips' });
        }
        return res.status(200).json({ trip });
    }
    catch (err) {
        console.error('Get Trip Error:', err);
        return res.status(500).json({ message: 'Error fetching trip' });
    }
};
exports.getTripById = getTripById;
// Update trip
const updateTrip = async (req, res) => {
    try {
        const user = req.user;
        const { id } = req.params;
        const tripId = Array.isArray(id) ? id[0] : id;
        const { name, destination, budget, startDate, endDate, status, bookingIds, orderIds } = req.body;
        const trip = await index_1.default.trip.findUnique({
            where: { id: parseInt(tripId) }
        });
        if (!trip) {
            return res.status(404).json({ message: 'Trip not found' });
        }
        // Check ownership
        if (trip.travellerId !== user.id && user.role !== 'ADMIN') {
            return res.status(403).json({ message: 'You can only update your own trips' });
        }
        const updatedTrip = await index_1.default.trip.update({
            where: { id: parseInt(tripId) },
            data: {
                ...(name && { name }),
                ...(destination && { destination }),
                ...(budget && { budget: parseFloat(budget) }),
                ...(startDate && { startDate: new Date(startDate) }),
                ...(endDate && { endDate: new Date(endDate) }),
                ...(status && { status }),
                ...(bookingIds && {
                    bookings: {
                        set: bookingIds.map((bid) => ({ id: parseInt(bid) }))
                    }
                }),
                ...(orderIds && {
                    orders: {
                        set: orderIds.map((oid) => ({ id: parseInt(oid) }))
                    }
                })
            },
            include: {
                bookings: {
                    include: {
                        schedule: {
                            include: {
                                bus: true,
                                route: true
                            }
                        }
                    }
                },
                orders: {
                    include: {
                        restaurant: true
                    }
                }
            }
        });
        return res.status(200).json({
            message: 'Trip updated successfully',
            trip: updatedTrip
        });
    }
    catch (err) {
        console.error('Update Trip Error:', err);
        return res.status(500).json({ message: 'Error updating trip' });
    }
};
exports.updateTrip = updateTrip;
// Delete trip
const deleteTrip = async (req, res) => {
    try {
        const user = req.user;
        const { id } = req.params;
        const tripId = Array.isArray(id) ? id[0] : id;
        const trip = await index_1.default.trip.findUnique({
            where: { id: parseInt(tripId) }
        });
        if (!trip) {
            return res.status(404).json({ message: 'Trip not found' });
        }
        // Check ownership
        if (trip.travellerId !== user.id && user.role !== 'ADMIN') {
            return res.status(403).json({ message: 'You can only delete your own trips' });
        }
        await index_1.default.trip.delete({
            where: { id: parseInt(tripId) }
        });
        return res.status(200).json({ message: 'Trip deleted successfully' });
    }
    catch (err) {
        console.error('Delete Trip Error:', err);
        return res.status(500).json({ message: 'Error deleting trip' });
    }
};
exports.deleteTrip = deleteTrip;
// Get restaurants along a trip's route
const getTripRestaurants = async (req, res) => {
    try {
        const user = req.user;
        const { id } = req.params;
        const tripId = Array.isArray(id) ? id[0] : id;
        // 1. Fetch trip and its bookings (which have schedules and routes)
        const trip = await index_1.default.trip.findUnique({
            where: { id: parseInt(tripId) },
            include: {
                bookings: {
                    include: {
                        schedule: {
                            include: {
                                route: true
                            }
                        }
                    }
                }
            }
        });
        if (!trip) {
            return res.status(404).json({ message: 'Trip not found' });
        }
        // 2. Extract unique route IDs from the trip's bookings
        const routeIds = [...new Set(trip.bookings.map(b => b.schedule.routeId))];
        if (routeIds.length === 0) {
            return res.status(200).json({
                message: 'No routes found for this trip',
                restaurants: []
            });
        }
        // 3. Fetch all restaurants associated with those routes
        const restaurants = await index_1.default.restaurant.findMany({
            where: {
                routeId: { in: routeIds },
                is_active: true
            },
            include: {
                menuItems: {
                    where: { is_available: true },
                    take: 3 // Include a few items for preview
                }
            }
        });
        return res.status(200).json({
            message: 'Trip restaurants fetched successfully',
            count: restaurants.length,
            restaurants
        });
    }
    catch (err) {
        console.error('Get Trip Restaurants Error:', err);
        return res.status(500).json({ message: 'Error fetching trip restaurants' });
    }
};
exports.getTripRestaurants = getTripRestaurants;
//# sourceMappingURL=tripController.js.map