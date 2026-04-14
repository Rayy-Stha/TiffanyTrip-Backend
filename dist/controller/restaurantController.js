"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteMenuItem = exports.updateMenuItem = exports.createMenuItem = exports.deleteRestaurant = exports.updateRestaurant = exports.createRestaurant = exports.getMenu = exports.getMyRestaurant = exports.getRestaurantById = exports.getRestaurantsByRoute = void 0;
const index_1 = __importDefault(require("../model/index"));
// Get restaurants by route
const getRestaurantsByRoute = async (req, res) => {
    try {
        const { routeId, busStop } = req.query;
        console.log('🍽️ Restaurant Search:', { routeId, busStop });
        const where = {};
        if (routeId)
            where.routeId = parseInt(routeId);
        if (busStop)
            where.busStop = { equals: busStop, mode: 'insensitive' };
        const restaurants = await index_1.default.restaurant.findMany({
            where,
            include: {
                owner: {
                    select: {
                        id: true,
                        full_name: true,
                        email: true,
                        phone: true
                    }
                },
                route: {
                    select: {
                        id: true,
                        origin: true,
                        destination: true
                    }
                },
                _count: {
                    select: {
                        menuItems: true,
                        orders: true
                    }
                }
            },
            orderBy: {
                rating: 'desc'
            }
        });
        console.log(`✅ Found ${restaurants.length} restaurants`);
        return res.status(200).json({
            message: 'Restaurants fetched successfully',
            count: restaurants.length,
            restaurants
        });
    }
    catch (err) {
        console.error('Get Restaurants Error:', err);
        return res.status(500).json({ message: 'Error fetching restaurants' });
    }
};
exports.getRestaurantsByRoute = getRestaurantsByRoute;
// Get restaurant by ID
const getRestaurantById = async (req, res) => {
    try {
        const { id } = req.params;
        const restaurant = await index_1.default.restaurant.findUnique({
            where: { id: parseInt(id) },
            include: {
                owner: {
                    select: {
                        id: true,
                        full_name: true,
                        email: true,
                        phone: true
                    }
                },
                route: true,
                menuItems: {
                    where: {
                        is_available: true
                    },
                    orderBy: {
                        category: 'asc'
                    }
                }
            }
        });
        if (!restaurant) {
            return res.status(404).json({ message: 'Restaurant not found' });
        }
        return res.status(200).json({ restaurant });
    }
    catch (err) {
        console.error('Get Restaurant Error:', err);
        return res.status(500).json({ message: 'Error fetching restaurant' });
    }
};
exports.getRestaurantById = getRestaurantById;
// Get current user's restaurant
const getMyRestaurant = async (req, res) => {
    try {
        const user = req.user;
        const restaurant = await index_1.default.restaurant.findFirst({
            where: { ownerId: user.id },
            include: {
                owner: {
                    select: {
                        id: true,
                        full_name: true,
                        email: true,
                        phone: true
                    }
                },
                route: true,
                menuItems: {
                    where: {
                        is_available: true
                    },
                    orderBy: {
                        category: 'asc'
                    }
                }
            }
        });
        if (!restaurant) {
            return res.status(404).json({ message: 'Restaurant not found for this user' });
        }
        return res.status(200).json({ restaurant });
    }
    catch (err) {
        console.error('Get My Restaurant Error:', err);
        return res.status(500).json({ message: 'Error fetching your restaurant' });
    }
};
exports.getMyRestaurant = getMyRestaurant;
// Get menu items for a restaurant
const getMenu = async (req, res) => {
    try {
        const { id } = req.params;
        const menuItems = await index_1.default.menuItem.findMany({
            where: {
                restaurantId: parseInt(id),
                is_available: true
            },
            orderBy: [
                { category: 'asc' },
                { name: 'asc' }
            ]
        });
        return res.status(200).json({
            message: 'Menu fetched successfully',
            count: menuItems.length,
            menuItems
        });
    }
    catch (err) {
        console.error('Get Menu Error:', err);
        return res.status(500).json({ message: 'Error fetching menu' });
    }
};
exports.getMenu = getMenu;
// Create restaurant (for restaurant owners)
const createRestaurant = async (req, res) => {
    try {
        const user = req.user;
        if (user.role !== 'RESTAURANT' && user.role !== 'ADMIN') {
            return res.status(403).json({ message: 'Only restaurant owners can create restaurants' });
        }
        const { name, location, cuisine, routeId, rating, latitude, longitude, busStop, description } = req.body;
        if (!name || !location || !cuisine || !routeId) {
            return res.status(400).json({
                message: 'Name, location, cuisine, and route ID are required'
            });
        }
        const restaurant = await index_1.default.restaurant.create({
            data: {
                name,
                location,
                busStop: busStop || null,
                description: description || null,
                cuisine: Array.isArray(cuisine) ? cuisine : [cuisine],
                routeId: parseInt(routeId),
                ownerId: user.id,
                rating: rating ? parseFloat(rating) : 0,
                latitude: latitude ? parseFloat(latitude) : null,
                longitude: longitude ? parseFloat(longitude) : null
            },
            include: {
                owner: {
                    select: {
                        id: true,
                        full_name: true,
                        email: true
                    }
                },
                route: true
            }
        });
        console.log('✅ Restaurant created:', restaurant.name);
        return res.status(201).json({
            message: 'Restaurant created successfully',
            restaurant
        });
    }
    catch (err) {
        console.error('Create Restaurant Error:', err);
        return res.status(500).json({ message: 'Error creating restaurant' });
    }
};
exports.createRestaurant = createRestaurant;
// Update restaurant
const updateRestaurant = async (req, res) => {
    try {
        const user = req.user;
        const { id } = req.params;
        const { name, location, cuisine, rating, latitude, longitude } = req.body;
        const restaurant = await index_1.default.restaurant.findUnique({
            where: { id: parseInt(id) }
        });
        if (!restaurant) {
            return res.status(404).json({ message: 'Restaurant not found' });
        }
        // Check ownership
        if (user.role !== 'ADMIN' && restaurant.ownerId !== user.id) {
            return res.status(403).json({ message: 'You can only update your own restaurant' });
        }
        const updatedRestaurant = await index_1.default.restaurant.update({
            where: { id: parseInt(id) },
            data: {
                ...(name && { name }),
                ...(location && { location }),
                ...(cuisine && { cuisine: Array.isArray(cuisine) ? cuisine : [cuisine] }),
                ...(rating && { rating: parseFloat(rating) }),
                ...(latitude && { latitude: parseFloat(latitude) }),
                ...(longitude && { longitude: parseFloat(longitude) })
            },
            include: {
                owner: {
                    select: {
                        id: true,
                        full_name: true,
                        email: true
                    }
                },
                route: true
            }
        });
        return res.status(200).json({
            message: 'Restaurant updated successfully',
            restaurant: updatedRestaurant
        });
    }
    catch (err) {
        console.error('Update Restaurant Error:', err);
        return res.status(500).json({ message: 'Error updating restaurant' });
    }
};
exports.updateRestaurant = updateRestaurant;
// Delete restaurant
const deleteRestaurant = async (req, res) => {
    try {
        const user = req.user;
        const { id } = req.params;
        const restaurant = await index_1.default.restaurant.findUnique({
            where: { id: parseInt(id) }
        });
        if (!restaurant) {
            return res.status(404).json({ message: 'Restaurant not found' });
        }
        // Check ownership
        if (user.role !== 'ADMIN' && restaurant.ownerId !== user.id) {
            return res.status(403).json({ message: 'You can only delete your own restaurant' });
        }
        await index_1.default.restaurant.delete({
            where: { id: parseInt(id) }
        });
        return res.status(200).json({ message: 'Restaurant deleted successfully' });
    }
    catch (err) {
        console.error('Delete Restaurant Error:', err);
        return res.status(500).json({ message: 'Error deleting restaurant' });
    }
};
exports.deleteRestaurant = deleteRestaurant;
// Create menu item
const createMenuItem = async (req, res) => {
    try {
        const user = req.user;
        const { restaurantId, name, description, price, category, available } = req.body;
        if (!restaurantId || !name || !price || !category) {
            return res.status(400).json({
                message: 'Restaurant ID, name, price, and category are required'
            });
        }
        // Verify restaurant ownership
        const restaurant = await index_1.default.restaurant.findUnique({
            where: { id: parseInt(restaurantId) }
        });
        if (!restaurant) {
            return res.status(404).json({ message: 'Restaurant not found' });
        }
        if (user.role !== 'ADMIN' && restaurant.ownerId !== user.id) {
            return res.status(403).json({ message: 'You can only add items to your own restaurant' });
        }
        const menuItem = await index_1.default.menuItem.create({
            data: {
                restaurantId: parseInt(restaurantId),
                name,
                description: description || '',
                price: parseFloat(price),
                category,
                is_available: available !== undefined ? available : true
            }
        });
        console.log('✅ Menu item created:', menuItem.name);
        return res.status(201).json({
            message: 'Menu item created successfully',
            menuItem
        });
    }
    catch (err) {
        console.error('Create Menu Item Error:', err);
        return res.status(500).json({ message: 'Error creating menu item' });
    }
};
exports.createMenuItem = createMenuItem;
// Update menu item
const updateMenuItem = async (req, res) => {
    try {
        const user = req.user;
        const { id } = req.params;
        const { name, description, price, category, available } = req.body;
        const menuItem = await index_1.default.menuItem.findUnique({
            where: { id: parseInt(id) },
            include: {
                restaurant: true
            }
        });
        if (!menuItem) {
            return res.status(404).json({ message: 'Menu item not found' });
        }
        // Check ownership
        if (user.role !== 'ADMIN' && menuItem.restaurant.ownerId !== user.id) {
            return res.status(403).json({ message: 'You can only update items in your own restaurant' });
        }
        const updatedMenuItem = await index_1.default.menuItem.update({
            where: { id: parseInt(id) },
            data: {
                ...(name && { name }),
                ...(description !== undefined && { description }),
                ...(price && { price: parseFloat(price) }),
                ...(category && { category }),
                ...(available !== undefined && { is_available: available })
            }
        });
        return res.status(200).json({
            message: 'Menu item updated successfully',
            menuItem: updatedMenuItem
        });
    }
    catch (err) {
        console.error('Update Menu Item Error:', err);
        return res.status(500).json({ message: 'Error updating menu item' });
    }
};
exports.updateMenuItem = updateMenuItem;
// Delete menu item
const deleteMenuItem = async (req, res) => {
    try {
        const user = req.user;
        const { id } = req.params;
        const menuItem = await index_1.default.menuItem.findUnique({
            where: { id: parseInt(id) },
            include: {
                restaurant: true
            }
        });
        if (!menuItem) {
            return res.status(404).json({ message: 'Menu item not found' });
        }
        // Check ownership
        if (user.role !== 'ADMIN' && menuItem.restaurant.ownerId !== user.id) {
            return res.status(403).json({ message: 'You can only delete items from your own restaurant' });
        }
        await index_1.default.menuItem.delete({
            where: { id: parseInt(id) }
        });
        return res.status(200).json({ message: 'Menu item deleted successfully' });
    }
    catch (err) {
        console.error('Delete Menu Item Error:', err);
        return res.status(500).json({ message: 'Error deleting menu item' });
    }
};
exports.deleteMenuItem = deleteMenuItem;
//# sourceMappingURL=restaurantController.js.map