import { Request, Response } from 'express';
import prisma from '../model/index';

// Get all routes
export const getAllRoutes = async (req: Request, res: Response) => {
    try {
        const routes = await prisma.route.findMany({
            orderBy: {
                name: 'asc'
            }
        });

        return res.status(200).json({
            message: 'Routes fetched successfully',
            count: routes.length,
            routes
        });
    } catch (err) {
        console.error('Get All Routes Error:', err);
        return res.status(500).json({ message: 'Error fetching routes' });
    }
};

// Get operator specific routes (Global + Own)
export const getOperatorRoutes = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;

        const routes = await prisma.route.findMany({
            where: {
                OR: [
                    { operatorId: null },
                    { operatorId: user.id }
                ]
            },
            orderBy: {
                name: 'asc'
            }
        });

        return res.status(200).json({
            message: 'Routes fetched successfully',
            count: routes.length,
            routes
        });
    } catch (err) {
        console.error('Get Operator Routes Error:', err);
        return res.status(500).json({ message: 'Error fetching routes' });
    }
};

// Create a custom route for operator
export const createRoute = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        const { name, origin, destination, distance, duration, stops } = req.body;

        if (!name || !origin || !destination || !distance || !duration || !stops) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // Validate stops structure
        if (Array.isArray(stops)) {
            for (const stop of stops) {
                if (!stop.name || stop.arrivalTime === undefined) {
                    return res.status(400).json({ message: 'Each stop must have a name and an arrivalTime offset' });
                }
            }
        }

        const route = await prisma.route.create({
            data: {
                name,
                origin,
                destination,
                distance: parseFloat(distance),
                duration: parseInt(duration),
                stops,
                operatorId: user.id
            }
        });

        return res.status(201).json({ message: 'Route created successfully', route });
    } catch (err) {
        console.error('Create Route Error:', err);
        return res.status(500).json({ message: 'Error creating route' });
    }
};

// Update an operator's route
export const updateRoute = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        const { id } = req.params;
        const { name, origin, destination, distance, duration, stops } = req.body;

        const existingRoute = await prisma.route.findUnique({
            where: { id: parseInt(id as string) }
        });

        if (!existingRoute) {
            return res.status(404).json({ message: 'Route not found' });
        }

        if (existingRoute.operatorId !== user.id && user.role !== 'ADMIN') {
            return res.status(403).json({ message: 'You can only edit your own routes' });
        }

        if (stops && Array.isArray(stops)) {
            for (const stop of stops) {
                if (!stop.name || stop.arrivalTime === undefined) {
                    return res.status(400).json({ message: 'Each stop must have a name and an arrivalTime offset' });
                }
            }
        }

        const updatedRoute = await prisma.route.update({
            where: { id: parseInt(id as string) },
            data: {
                name: name || existingRoute.name,
                origin: origin || existingRoute.origin,
                destination: destination || existingRoute.destination,
                distance: distance ? parseFloat(distance) : existingRoute.distance,
                duration: duration ? parseInt(duration) : existingRoute.duration,
                stops: stops || existingRoute.stops
            }
        });

        return res.status(200).json({ message: 'Route updated successfully', route: updatedRoute });
    } catch (err) {
        console.error('Update Route Error:', err);
        return res.status(500).json({ message: 'Error updating route' });
    }
};

// Delete an operator's route
export const deleteRoute = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        const { id } = req.params;

        const existingRoute = await prisma.route.findUnique({
            where: { id: parseInt(id as string) }
        });

        if (!existingRoute) {
            return res.status(404).json({ message: 'Route not found' });
        }

        if (existingRoute.operatorId !== user.id && user.role !== 'ADMIN') {
            return res.status(403).json({ message: 'You can only delete your own routes' });
        }

        await prisma.route.delete({
            where: { id: parseInt(id as string) }
        });

        return res.status(200).json({ message: 'Route deleted successfully' });
    } catch (err) {
        console.error('Delete Route Error:', err);
        return res.status(500).json({ message: 'Error deleting route' });
    }
};

// Seed routes (Temporary helper)
export const seedRoutes = async (req: Request, res: Response) => {
    try {
        const routes = [
            {
                name: 'KTM-PKR',
                origin: 'Kathmandu',
                destination: 'Pokhara',
                distance: 200,
                duration: 480,
                stops: [
                    { name: 'Kathmandu', lat: 27.7172, lng: 85.3240, arrivalTime: '0' },
                    { name: 'Mugling', lat: 27.8546, lng: 84.5574, arrivalTime: '180' },
                    { name: 'Dumre', lat: 27.9702, lng: 84.4170, arrivalTime: '240' },
                    { name: 'Pokhara', lat: 28.2096, lng: 83.9856, arrivalTime: '480' }
                ]
            },
            {
                name: 'KTM-CIT',
                origin: 'Kathmandu',
                destination: 'Chitwan',
                distance: 175,
                duration: 360,
                stops: [
                    { name: 'Kathmandu', lat: 27.7172, lng: 85.3240, arrivalTime: '0' },
                    { name: 'Mugling', lat: 27.8546, lng: 84.5574, arrivalTime: '180' },
                    { name: 'Narayanghat', lat: 27.6961, lng: 84.4334, arrivalTime: '300' },
                    { name: 'Chitwan', lat: 27.5255, lng: 84.4357, arrivalTime: '360' }
                ]
            },
            {
                name: 'PKR-KTM',
                origin: 'Pokhara',
                destination: 'Kathmandu',
                distance: 200,
                duration: 480,
                stops: [
                    { name: 'Pokhara', lat: 28.2096, lng: 83.9856, arrivalTime: '0' },
                    { name: 'Dumre', lat: 27.9702, lng: 84.4170, arrivalTime: '240' },
                    { name: 'Mugling', lat: 27.8546, lng: 84.5574, arrivalTime: '300' },
                    { name: 'Kathmandu', lat: 27.7172, lng: 85.3240, arrivalTime: '480' }
                ]
            }
        ];

        let createdCount = 0;
        for (const route of routes) {
            const exists = await prisma.route.findFirst({
                where: { name: route.name }
            });
            if (!exists) {
                await prisma.route.create({ data: route });
                createdCount++;
            }
        }

        return res.status(200).json({ message: 'Seeding complete', created: createdCount });
    } catch (err) {
        console.error('Seed Routes Error:', err);
        return res.status(500).json({ message: 'Error seeding routes' });
    }
};
