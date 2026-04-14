"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteBus = exports.updateBus = exports.createBus = exports.getAllBuses = exports.getBusById = exports.searchBuses = void 0;
const index_1 = __importDefault(require("../model/index"));
// Search buses by route and date
const searchBuses = async (req, res) => {
    try {
        const { origin, destination, date } = req.query;
        console.log('🔍 Bus Search Request:', { origin, destination, date });
        if (!origin || !destination || !date) {
            return res.status(400).json({
                message: 'Origin, destination, and date are required'
            });
        }
        // Find routes matching origin and destination
        const routes = await index_1.default.route.findMany({
            where: {
                origin: {
                    contains: origin,
                    mode: 'insensitive'
                },
                destination: {
                    contains: destination,
                    mode: 'insensitive'
                }
            },
            include: {
                schedules: {
                    include: {
                        bus: {
                            include: {
                                operator: {
                                    select: {
                                        id: true,
                                        full_name: true,
                                        email: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });
        // Filter schedules by date and format response
        const searchDate = new Date(date);
        const dayOfWeek = searchDate.toLocaleDateString('en-US', { weekday: 'long' });
        const results = routes.flatMap(route => route.schedules
            .filter(schedule => schedule.daysOfWeek.includes(dayOfWeek))
            .map(schedule => ({
            id: schedule.id.toString(),
            busId: schedule.bus.id.toString(),
            routeId: route.id.toString(),
            departureTime: schedule.departureTime.toISOString(),
            arrivalTime: schedule.arrivalTime.toISOString(),
            fare: schedule.fare,
            daysOfWeek: schedule.daysOfWeek,
            availableSeats: schedule.availableSeats,
            status: 'active',
            createdAt: schedule.createdAt.toISOString(),
            updatedAt: schedule.updatedAt.toISOString(),
            bus: {
                id: schedule.bus.id.toString(),
                name: schedule.bus.name,
                number: schedule.bus.number,
                type: schedule.bus.type,
                capacity: schedule.bus.capacity,
                amenities: schedule.bus.amenities,
                operator: schedule.bus.operator.full_name,
                createdAt: schedule.bus.createdAt.toISOString(),
                updatedAt: schedule.bus.updatedAt.toISOString()
            },
            route: {
                id: route.id.toString(),
                origin: route.origin,
                destination: route.destination,
                distance: route.distance,
                duration: route.duration,
                stops: route.stops
            }
        })));
        console.log(`✅ Found ${results.length} buses`);
        return res.status(200).json({
            message: 'Buses found successfully',
            count: results.length,
            buses: results
        });
    }
    catch (err) {
        console.error('Bus Search Error:', err);
        return res.status(500).json({ message: 'Error searching buses' });
    }
};
exports.searchBuses = searchBuses;
// Get bus details by ID
const getBusById = async (req, res) => {
    try {
        const { id } = req.params;
        const busId = Array.isArray(id) ? id[0] : id;
        const parsedId = parseInt(busId);
        if (isNaN(parsedId)) {
            return res.status(400).json({ message: 'Invalid bus ID' });
        }
        const bus = await index_1.default.bus.findUnique({
            where: { id: parsedId },
            include: {
                operator: {
                    select: {
                        id: true,
                        full_name: true,
                        email: true,
                        phone: true
                    }
                },
                schedules: {
                    include: {
                        route: true
                    }
                }
            }
        });
        if (!bus) {
            return res.status(404).json({ message: 'Bus not found' });
        }
        return res.status(200).json({ bus });
    }
    catch (err) {
        console.error('Get Bus Error:', err);
        return res.status(500).json({ message: 'Error fetching bus details' });
    }
};
exports.getBusById = getBusById;
// Get all buses (for operators to manage their buses)
const getAllBuses = async (req, res) => {
    try {
        const user = req.user;
        // If user is operator, show only their buses
        const where = user.role === 'BUS_OPERATOR'
            ? { operatorId: user.id }
            : {};
        const buses = await index_1.default.bus.findMany({
            where,
            include: {
                operator: {
                    select: {
                        id: true,
                        full_name: true,
                        email: true
                    }
                },
                _count: {
                    select: {
                        schedules: true
                    }
                }
            }
        });
        return res.status(200).json({
            message: 'Buses fetched successfully',
            count: buses.length,
            buses
        });
    }
    catch (err) {
        console.error('Get All Buses Error:', err);
        return res.status(500).json({ message: 'Error fetching buses' });
    }
};
exports.getAllBuses = getAllBuses;
// Create a new bus (for operators)
const createBus = async (req, res) => {
    try {
        const user = req.user;
        if (user.role !== 'BUS_OPERATOR' && user.role !== 'ADMIN') {
            return res.status(403).json({ message: 'Only bus operators can create buses' });
        }
        const { name, number, type, capacity, amenities } = req.body;
        if (!name || !number || !type || !capacity) {
            return res.status(400).json({ message: 'Name, number, type, and capacity are required' });
        }
        // Check if bus number already exists
        const existing = await index_1.default.bus.findUnique({
            where: { number }
        });
        if (existing) {
            return res.status(400).json({ message: 'Bus number already exists' });
        }
        const bus = await index_1.default.bus.create({
            data: {
                name,
                number,
                type,
                capacity: parseInt(capacity),
                amenities: amenities || [],
                operatorId: user.id
            },
            include: {
                operator: {
                    select: {
                        id: true,
                        full_name: true,
                        email: true
                    }
                }
            }
        });
        console.log('✅ Bus created:', bus.number);
        return res.status(201).json({
            message: 'Bus created successfully',
            bus
        });
    }
    catch (err) {
        console.error('Create Bus Error:', err);
        return res.status(500).json({ message: 'Error creating bus' });
    }
};
exports.createBus = createBus;
// Update bus
const updateBus = async (req, res) => {
    try {
        const user = req.user;
        const { id } = req.params;
        const busId = Array.isArray(id) ? id[0] : id;
        const { name, type, capacity, amenities } = req.body;
        const bus = await index_1.default.bus.findUnique({
            where: { id: parseInt(busId) }
        });
        if (!bus) {
            return res.status(404).json({ message: 'Bus not found' });
        }
        // Check ownership
        if (user.role !== 'ADMIN' && bus.operatorId !== user.id) {
            return res.status(403).json({ message: 'You can only update your own buses' });
        }
        const updatedBus = await index_1.default.bus.update({
            where: { id: parseInt(busId) },
            data: {
                ...(name && { name }),
                ...(type && { type }),
                ...(capacity && { capacity: parseInt(capacity) }),
                ...(amenities && { amenities })
            },
            include: {
                operator: {
                    select: {
                        id: true,
                        full_name: true,
                        email: true
                    }
                }
            }
        });
        return res.status(200).json({
            message: 'Bus updated successfully',
            bus: updatedBus
        });
    }
    catch (err) {
        console.error('Update Bus Error:', err);
        return res.status(500).json({ message: 'Error updating bus' });
    }
};
exports.updateBus = updateBus;
// Delete bus
const deleteBus = async (req, res) => {
    try {
        const user = req.user;
        const { id } = req.params;
        const busId = Array.isArray(id) ? id[0] : id;
        const bus = await index_1.default.bus.findUnique({
            where: { id: parseInt(busId) }
        });
        if (!bus) {
            return res.status(404).json({ message: 'Bus not found' });
        }
        // Check ownership
        if (user.role !== 'ADMIN' && bus.operatorId !== user.id) {
            return res.status(403).json({ message: 'You can only delete your own buses' });
        }
        await index_1.default.bus.delete({
            where: { id: parseInt(busId) }
        });
        return res.status(200).json({ message: 'Bus deleted successfully' });
    }
    catch (err) {
        console.error('Delete Bus Error:', err);
        return res.status(500).json({ message: 'Error deleting bus' });
    }
};
exports.deleteBus = deleteBus;
//# sourceMappingURL=busController.js.map