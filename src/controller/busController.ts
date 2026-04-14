import { Request, Response } from 'express';
import prisma from '../model/index';

// Search buses by route and date
export const searchBuses = async (req: Request, res: Response) => {
    try {
        const { origin, destination, date } = req.query;

        console.log('🔍 Bus Search Request:', { origin, destination, date });

        if (!origin || !destination || !date) {
            return res.status(400).json({
                message: 'Origin, destination, and date are required'
            });
        }

        // Find routes matching origin and destination
        const routes = await prisma.route.findMany({
            where: {
                origin: {
                    contains: origin as string,
                    mode: 'insensitive'
                },
                destination: {
                    contains: destination as string,
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
        const searchDate = new Date(date as string);
        const dayOfWeek = searchDate.toLocaleDateString('en-US', { weekday: 'long' });

        const results = routes.flatMap(route =>
            route.schedules
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
                }))
        );

        console.log(`✅ Found ${results.length} buses`);

        return res.status(200).json({
            message: 'Buses found successfully',
            count: results.length,
            buses: results
        });
    } catch (err) {
        console.error('Bus Search Error:', err);
        return res.status(500).json({ message: 'Error searching buses' });
    }
};

// Get bus details by ID
export const getBusById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const busId = Array.isArray(id) ? id[0] : id;
        const parsedId = parseInt(busId);

        if (isNaN(parsedId)) {
            return res.status(400).json({ message: 'Invalid bus ID' });
        }

        const bus = await prisma.bus.findUnique({
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
    } catch (err) {
        console.error('Get Bus Error:', err);
        return res.status(500).json({ message: 'Error fetching bus details' });
    }
};

// Get all buses (for operators to manage their buses)
export const getAllBuses = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;

        // If user is operator, show only their buses
        const where = user.role === 'BUS_OPERATOR'
            ? { operatorId: user.id }
            : {};

        const buses = await prisma.bus.findMany({
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
    } catch (err) {
        console.error('Get All Buses Error:', err);
        return res.status(500).json({ message: 'Error fetching buses' });
    }
};

// Create a new bus (for operators)
export const createBus = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;

        if (user.role !== 'BUS_OPERATOR' && user.role !== 'ADMIN') {
            return res.status(403).json({ message: 'Only bus operators can create buses' });
        }

        const { name, number, type, capacity, amenities } = req.body;

        if (!name || !number || !type || !capacity) {
            return res.status(400).json({ message: 'Name, number, type, and capacity are required' });
        }

        // Check if bus number already exists
        const existing = await prisma.bus.findUnique({
            where: { number }
        });

        if (existing) {
            return res.status(400).json({ message: 'Bus number already exists' });
        }

        const bus = await prisma.bus.create({
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
    } catch (err) {
        console.error('Create Bus Error:', err);
        return res.status(500).json({ message: 'Error creating bus' });
    }
};

// Update bus
export const updateBus = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        const { id } = req.params;
        const busId = Array.isArray(id) ? id[0] : id;
        const { name, type, capacity, amenities } = req.body;

        const bus = await prisma.bus.findUnique({
            where: { id: parseInt(busId) }
        });

        if (!bus) {
            return res.status(404).json({ message: 'Bus not found' });
        }

        // Check ownership
        if (user.role !== 'ADMIN' && bus.operatorId !== user.id) {
            return res.status(403).json({ message: 'You can only update your own buses' });
        }

        const updatedBus = await prisma.bus.update({
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
    } catch (err) {
        console.error('Update Bus Error:', err);
        return res.status(500).json({ message: 'Error updating bus' });
    }
};

// Delete bus
export const deleteBus = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        const { id } = req.params;
        const busId = Array.isArray(id) ? id[0] : id;

        const bus = await prisma.bus.findUnique({
            where: { id: parseInt(busId) }
        });

        if (!bus) {
            return res.status(404).json({ message: 'Bus not found' });
        }

        // Check ownership
        if (user.role !== 'ADMIN' && bus.operatorId !== user.id) {
            return res.status(403).json({ message: 'You can only delete your own buses' });
        }

        await prisma.bus.delete({
            where: { id: parseInt(busId) }
        });

        return res.status(200).json({ message: 'Bus deleted successfully' });
    } catch (err) {
        console.error('Delete Bus Error:', err);
        return res.status(500).json({ message: 'Error deleting bus' });
    }
};
