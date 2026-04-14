"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedRoutes = exports.deleteRoute = exports.updateRoute = exports.createRoute = exports.getOperatorRoutes = exports.getAllRoutes = void 0;
const index_1 = __importDefault(require("../model/index"));
// Get all routes
const getAllRoutes = async (req, res) => {
    try {
        const routes = await index_1.default.route.findMany({
            orderBy: {
                name: 'asc'
            }
        });
        return res.status(200).json({
            message: 'Routes fetched successfully',
            count: routes.length,
            routes
        });
    }
    catch (err) {
        console.error('Get All Routes Error:', err);
        return res.status(500).json({ message: 'Error fetching routes' });
    }
};
exports.getAllRoutes = getAllRoutes;
// Get operator specific routes (Global + Own)
const getOperatorRoutes = async (req, res) => {
    try {
        const user = req.user;
        const routes = await index_1.default.route.findMany({
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
    }
    catch (err) {
        console.error('Get Operator Routes Error:', err);
        return res.status(500).json({ message: 'Error fetching routes' });
    }
};
exports.getOperatorRoutes = getOperatorRoutes;
// Create a custom route for operator
const createRoute = async (req, res) => {
    try {
        const user = req.user;
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
        const route = await index_1.default.route.create({
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
    }
    catch (err) {
        console.error('Create Route Error:', err);
        return res.status(500).json({ message: 'Error creating route' });
    }
};
exports.createRoute = createRoute;
// Update an operator's route
const updateRoute = async (req, res) => {
    try {
        const user = req.user;
        const { id } = req.params;
        const { name, origin, destination, distance, duration, stops } = req.body;
        const existingRoute = await index_1.default.route.findUnique({
            where: { id: parseInt(id) }
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
        const updatedRoute = await index_1.default.route.update({
            where: { id: parseInt(id) },
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
    }
    catch (err) {
        console.error('Update Route Error:', err);
        return res.status(500).json({ message: 'Error updating route' });
    }
};
exports.updateRoute = updateRoute;
// Delete an operator's route
const deleteRoute = async (req, res) => {
    try {
        const user = req.user;
        const { id } = req.params;
        const existingRoute = await index_1.default.route.findUnique({
            where: { id: parseInt(id) }
        });
        if (!existingRoute) {
            return res.status(404).json({ message: 'Route not found' });
        }
        if (existingRoute.operatorId !== user.id && user.role !== 'ADMIN') {
            return res.status(403).json({ message: 'You can only delete your own routes' });
        }
        await index_1.default.route.delete({
            where: { id: parseInt(id) }
        });
        return res.status(200).json({ message: 'Route deleted successfully' });
    }
    catch (err) {
        console.error('Delete Route Error:', err);
        return res.status(500).json({ message: 'Error deleting route' });
    }
};
exports.deleteRoute = deleteRoute;
// Seed routes (Temporary helper)
const seedRoutes = async (req, res) => {
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
            const exists = await index_1.default.route.findFirst({
                where: { name: route.name }
            });
            if (!exists) {
                await index_1.default.route.create({ data: route });
                createdCount++;
            }
        }
        return res.status(200).json({ message: 'Seeding complete', created: createdCount });
    }
    catch (err) {
        console.error('Seed Routes Error:', err);
        return res.status(500).json({ message: 'Error seeding routes' });
    }
};
exports.seedRoutes = seedRoutes;
//# sourceMappingURL=routeController.js.map