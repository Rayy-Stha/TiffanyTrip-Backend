import { Request, Response } from 'express';
import prisma from '../model/index';

// Get schedule by ID with seat availability
export const getScheduleById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const scheduleId = Array.isArray(id) ? id[0] : id;

        const schedule = await prisma.schedule.findUnique({
            where: { id: parseInt(scheduleId) },
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
                route: true,
                bookings: {
                    where: {
                        status: {
                            in: ['PENDING', 'CONFIRMED']
                        }
                    },
                    select: {
                        seatNumbers: true
                    }
                }
            }
        });

        if (!schedule) {
            return res.status(404).json({ message: 'Schedule not found' });
        }

        // Calculate booked seats
        const bookedSeats = schedule.bookings.flatMap(b => b.seatNumbers);

        return res.status(200).json({
            schedule,
            bookedSeats,
            availableSeats: schedule.availableSeats
        });
    } catch (err) {
        console.error('Get Schedule Error:', err);
        return res.status(500).json({ message: 'Error fetching schedule' });
    }
};

// Get seat availability for a schedule
export const getSeats = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const scheduleId = Array.isArray(id) ? id[0] : id;

        const schedule = await prisma.schedule.findUnique({
            where: { id: parseInt(scheduleId) },
            include: {
                bus: {
                    select: {
                        capacity: true
                    }
                },
                bookings: {
                    where: {
                        status: {
                            in: ['PENDING', 'CONFIRMED']
                        }
                    },
                    select: {
                        seatNumbers: true
                    }
                }
            }
        });

        if (!schedule) {
            return res.status(404).json({ message: 'Schedule not found' });
        }

        const bookedSeats = schedule.bookings.flatMap(b => b.seatNumbers);
        const totalSeats = schedule.bus.capacity;

        return res.status(200).json({
            totalSeats,
            availableSeats: schedule.availableSeats,
            bookedSeats
        });
    } catch (err) {
        console.error('Get Seats Error:', err);
        return res.status(500).json({ message: 'Error fetching seat information' });
    }
};

// Create schedule (for operators)
export const createSchedule = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;

        if (user.role !== 'BUS_OPERATOR' && user.role !== 'ADMIN') {
            return res.status(403).json({ message: 'Only bus operators can create schedules' });
        }

        const { busId, routeId, departureTime, arrivalTime, daysOfWeek, fare } = req.body;

        if (!busId || !routeId || !departureTime || !arrivalTime || !daysOfWeek || !fare) {
            return res.status(400).json({
                message: 'Bus ID, route ID, departure time, arrival time, days of week, and fare are required'
            });
        }

        // Verify bus ownership
        const bus = await prisma.bus.findUnique({
            where: { id: parseInt(busId) }
        });

        if (!bus) {
            return res.status(404).json({ message: 'Bus not found' });
        }

        if (user.role !== 'ADMIN' && bus.operatorId !== user.id) {
            return res.status(403).json({ message: 'You can only create schedules for your own buses' });
        }

        const schedule = await prisma.schedule.create({
            data: {
                busId: parseInt(busId),
                routeId: parseInt(routeId),
                departureTime: new Date(departureTime),
                arrivalTime: new Date(arrivalTime),
                daysOfWeek: Array.isArray(daysOfWeek) ? daysOfWeek : [daysOfWeek],
                fare: parseFloat(fare),
                availableSeats: bus.capacity
            },
            include: {
                bus: true,
                route: true
            }
        });

        console.log('✅ Schedule created:', schedule.id);

        return res.status(201).json({
            message: 'Schedule created successfully',
            schedule
        });
    } catch (err) {
        console.error('Create Schedule Error:', err);
        return res.status(500).json({ message: 'Error creating schedule' });
    }
};

// Update schedule
export const updateSchedule = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        const { id } = req.params;
        const scheduleId = Array.isArray(id) ? id[0] : id;
        const { departureTime, arrivalTime, daysOfWeek, fare, availableSeats } = req.body;

        const schedule = await prisma.schedule.findUnique({
            where: { id: parseInt(scheduleId) },
            include: {
                bus: true
            }
        });

        if (!schedule) {
            return res.status(404).json({ message: 'Schedule not found' });
        }

        // Check ownership
        if (user.role !== 'ADMIN' && schedule.bus.operatorId !== user.id) {
            return res.status(403).json({ message: 'You can only update your own schedules' });
        }

        const updatedSchedule = await prisma.schedule.update({
            where: { id: parseInt(scheduleId) },
            data: {
                ...(departureTime && { departureTime: new Date(departureTime) }),
                ...(arrivalTime && { arrivalTime: new Date(arrivalTime) }),
                ...(daysOfWeek && { daysOfWeek: Array.isArray(daysOfWeek) ? daysOfWeek : [daysOfWeek] }),
                ...(fare && { fare: parseFloat(fare) }),
                ...(availableSeats !== undefined && { availableSeats: parseInt(availableSeats) })
            },
            include: {
                bus: true,
                route: true
            }
        });

        return res.status(200).json({
            message: 'Schedule updated successfully',
            schedule: updatedSchedule
        });
    } catch (err) {
        console.error('Update Schedule Error:', err);
        return res.status(500).json({ message: 'Error updating schedule' });
    }
};

// Delete schedule
export const deleteSchedule = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        const { id } = req.params;
        const scheduleId = Array.isArray(id) ? id[0] : id;

        const schedule = await prisma.schedule.findUnique({
            where: { id: parseInt(scheduleId) },
            include: {
                bus: true
            }
        });

        if (!schedule) {
            return res.status(404).json({ message: 'Schedule not found' });
        }

        // Check ownership
        if (user.role !== 'ADMIN' && schedule.bus.operatorId !== user.id) {
            return res.status(403).json({ message: 'You can only delete your own schedules' });
        }

        await prisma.schedule.delete({
            where: { id: parseInt(scheduleId) }
        });

        return res.status(200).json({ message: 'Schedule deleted successfully' });
    } catch (err) {
        console.error('Delete Schedule Error:', err);
        return res.status(500).json({ message: 'Error deleting schedule' });
    }
};

// Get all schedules for a bus
export const getSchedulesByBus = async (req: Request, res: Response) => {
    try {
        const { busId } = req.params;
        const id = Array.isArray(busId) ? busId[0] : busId;

        const schedules = await prisma.schedule.findMany({
            where: { busId: parseInt(id) },
            include: {
                route: true,
                bus: {
                    include: {
                        operator: {
                            select: {
                                id: true,
                                full_name: true
                            }
                        }
                    }
                }
            }
        });

        return res.status(200).json({
            message: 'Schedules fetched successfully',
            count: schedules.length,
            schedules
        });
    } catch (err) {
        console.error('Get Schedules By Bus Error:', err);
        return res.status(500).json({ message: 'Error fetching schedules' });
    }
};
// Get all schedules for the logged-in operator
export const getOperatorSchedules = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;

        if (user.role !== 'BUS_OPERATOR' && user.role !== 'ADMIN') {
            return res.status(403).json({ message: 'Only bus operators can view their schedules' });
        }

        const schedules = await prisma.schedule.findMany({
            where: {
                bus: {
                    operatorId: user.id
                }
            },
            include: {
                route: true,
                bus: true
            },
            orderBy: {
                departureTime: 'asc'
            }
        });

        return res.status(200).json({
            message: 'Operator schedules fetched successfully',
            count: schedules.length,
            schedules
        });
    } catch (err) {
        console.error('Get Operator Schedules Error:', err);
        return res.status(500).json({ message: 'Error fetching operator schedules' });
    }
};
