import { Request, Response } from 'express';
import prisma from '../model/index';

// Get restaurants by route
export const getRestaurantsByRoute = async (req: Request, res: Response) => {
    try {
        const { routeId, busStop } = req.query;

        console.log('🍽️ Restaurant Search:', { routeId, busStop });

        const where: any = {};
        if (routeId) where.routeId = parseInt(routeId as string);
        if (busStop) where.busStop = { equals: busStop as string, mode: 'insensitive' };

        const restaurants = await prisma.restaurant.findMany({
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
    } catch (err) {
        console.error('Get Restaurants Error:', err);
        return res.status(500).json({ message: 'Error fetching restaurants' });
    }
};

// Get restaurant by ID
export const getRestaurantById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const restaurant = await prisma.restaurant.findUnique({
            where: { id: parseInt(id as string) },
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
    } catch (err) {
        console.error('Get Restaurant Error:', err);
        return res.status(500).json({ message: 'Error fetching restaurant' });
    }
};

// Get current user's restaurant
export const getMyRestaurant = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;

        const restaurant = await prisma.restaurant.findFirst({
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
    } catch (err) {
        console.error('Get My Restaurant Error:', err);
        return res.status(500).json({ message: 'Error fetching your restaurant' });
    }
};

// Get menu items for a restaurant
export const getMenu = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const menuItems = await prisma.menuItem.findMany({
            where: {
                restaurantId: parseInt(id as string),
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
    } catch (err) {
        console.error('Get Menu Error:', err);
        return res.status(500).json({ message: 'Error fetching menu' });
    }
};

// Create restaurant (for restaurant owners)
export const createRestaurant = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;

        if (user.role !== 'RESTAURANT' && user.role !== 'ADMIN') {
            return res.status(403).json({ message: 'Only restaurant owners can create restaurants' });
        }

        const { name, location, cuisine, routeId, rating, latitude, longitude, busStop, description } = req.body;

        if (!name || !location || !cuisine || !routeId) {
            return res.status(400).json({
                message: 'Name, location, cuisine, and route ID are required'
            });
        }

        const restaurant = await prisma.restaurant.create({
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
            } as any,
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
    } catch (err) {
        console.error('Create Restaurant Error:', err);
        return res.status(500).json({ message: 'Error creating restaurant' });
    }
};

// Update restaurant
export const updateRestaurant = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        const { id } = req.params;
        const { name, location, cuisine, rating, latitude, longitude } = req.body;

        const restaurant = await prisma.restaurant.findUnique({
            where: { id: parseInt(id as string) }
        });

        if (!restaurant) {
            return res.status(404).json({ message: 'Restaurant not found' });
        }

        // Check ownership
        if (user.role !== 'ADMIN' && restaurant.ownerId !== user.id) {
            return res.status(403).json({ message: 'You can only update your own restaurant' });
        }

        const updatedRestaurant = await prisma.restaurant.update({
            where: { id: parseInt(id as string) },
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
    } catch (err) {
        console.error('Update Restaurant Error:', err);
        return res.status(500).json({ message: 'Error updating restaurant' });
    }
};

// Delete restaurant
export const deleteRestaurant = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        const { id } = req.params;

        const restaurant = await prisma.restaurant.findUnique({
            where: { id: parseInt(id as string) }
        });

        if (!restaurant) {
            return res.status(404).json({ message: 'Restaurant not found' });
        }

        // Check ownership
        if (user.role !== 'ADMIN' && restaurant.ownerId !== user.id) {
            return res.status(403).json({ message: 'You can only delete your own restaurant' });
        }

        await prisma.restaurant.delete({
            where: { id: parseInt(id as string) }
        });

        return res.status(200).json({ message: 'Restaurant deleted successfully' });
    } catch (err) {
        console.error('Delete Restaurant Error:', err);
        return res.status(500).json({ message: 'Error deleting restaurant' });
    }
};

// Create menu item
export const createMenuItem = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        const { restaurantId, name, description, price, category, available } = req.body;

        if (!restaurantId || !name || !price || !category) {
            return res.status(400).json({
                message: 'Restaurant ID, name, price, and category are required'
            });
        }

        // Verify restaurant ownership
        const restaurant = await prisma.restaurant.findUnique({
            where: { id: parseInt(restaurantId) }
        });

        if (!restaurant) {
            return res.status(404).json({ message: 'Restaurant not found' });
        }

        if (user.role !== 'ADMIN' && restaurant.ownerId !== user.id) {
            return res.status(403).json({ message: 'You can only add items to your own restaurant' });
        }

        const menuItem = await prisma.menuItem.create({
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
    } catch (err) {
        console.error('Create Menu Item Error:', err);
        return res.status(500).json({ message: 'Error creating menu item' });
    }
};

// Update menu item
export const updateMenuItem = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        const { id } = req.params;
        const { name, description, price, category, available } = req.body;

        const menuItem = await prisma.menuItem.findUnique({
            where: { id: parseInt(id as string) },
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

        const updatedMenuItem = await prisma.menuItem.update({
            where: { id: parseInt(id as string) },
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
    } catch (err) {
        console.error('Update Menu Item Error:', err);
        return res.status(500).json({ message: 'Error updating menu item' });
    }
};

// Delete menu item
export const deleteMenuItem = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        const { id } = req.params;

        const menuItem = await prisma.menuItem.findUnique({
            where: { id: parseInt(id as string) },
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

        await prisma.menuItem.delete({
            where: { id: parseInt(id as string) }
        });

        return res.status(200).json({ message: 'Menu item deleted successfully' });
    } catch (err) {
        console.error('Delete Menu Item Error:', err);
        return res.status(500).json({ message: 'Error deleting menu item' });
    }
};
