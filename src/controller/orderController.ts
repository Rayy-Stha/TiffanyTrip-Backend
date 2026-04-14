import { Request, Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import prisma from '../model/index';

// Create an order
export const createOrder = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        const { restaurantId, items, deliveryLocation, deliveryLat, deliveryLng, deliveryAddress, bookingId, tripId, deliveryTime, notes } = req.body;

        console.log('🛒 Order Request Body:', JSON.stringify(req.body, null, 2));

        if (!restaurantId || !items || !Array.isArray(items) || items.length === 0) {
            console.log('❌ Validation Failed: Missing restaurantId or items');
            return res.status(400).json({
                message: 'Restaurant ID and items array are required'
            });
        }

        // Parse restaurantId (handle both string and number)
        const parsedRestaurantId = typeof restaurantId === 'string' ? parseInt(restaurantId) : parseInt(restaurantId);

        if (isNaN(parsedRestaurantId)) {
            console.log('❌ Invalid restaurantId:', restaurantId);
            return res.status(400).json({ message: 'Invalid restaurant ID' });
        }

        // Verify restaurant exists
        const restaurant = await prisma.restaurant.findUnique({
            where: { id: parsedRestaurantId }
        });

        if (!restaurant) {
            console.log('❌ Restaurant not found:', parsedRestaurantId);
            return res.status(404).json({ message: 'Restaurant not found' });
        }

        // Verify all menu items exist and calculate total
        let totalAmount = 0;
        const orderItems = [];

        for (const [index, item] of items.entries()) {
            const rawId = item.menuItemId;
            const parsedMenuItemId = typeof rawId === 'string' ? parseInt(rawId) : rawId;

            if (isNaN(parsedMenuItemId)) {
                console.log(`❌ Invalid menuItemId at index ${index}:`, rawId);
                return res.status(400).json({ message: `Invalid menu item ID at index ${index}` });
            }

            const menuItem = await prisma.menuItem.findUnique({
                where: { id: parsedMenuItemId }
            });

            if (!menuItem) {
                console.log(`❌ Menu item not found: ${parsedMenuItemId}`);
                return res.status(404).json({
                    message: `Menu item with ID ${parsedMenuItemId} not found`
                });
            }

            if (!menuItem.is_available) {
                return res.status(400).json({
                    message: `${menuItem.name} is currently unavailable`
                });
            }

            const quantity = parseInt(item.quantity);
            if (isNaN(quantity) || quantity <= 0) {
                return res.status(400).json({ message: `Invalid quantity for item ${menuItem.name}` });
            }

            totalAmount += menuItem.price * quantity;

            orderItems.push({
                menuItemId: menuItem.id,
                name: menuItem.name,
                price: menuItem.price,
                quantity
            });
        }

        let finalDeliveryTime = deliveryTime ? new Date(deliveryTime) : null;

        // If bookingId is provided but no deliveryTime was sent, try to calculate it
        if (bookingId && deliveryLocation && !finalDeliveryTime) {
            try {
                const booking = await prisma.booking.findUnique({
                    where: { id: typeof bookingId === 'string' ? parseInt(bookingId) : bookingId },
                    include: {
                        schedule: {
                            include: {
                                route: true
                            }
                        }
                    }
                });

                if (booking && booking.schedule && booking.schedule.route) {
                    const stops = booking.schedule.route.stops as any[];
                    const matchingStop = stops.find((s: any) => s.name === deliveryLocation);

                    if (matchingStop && matchingStop.arrivalTime) {
                        const departure = new Date(booking.schedule.departureTime);
                        const offsetMins = parseInt(matchingStop.arrivalTime);
                        finalDeliveryTime = new Date(departure.getTime() + offsetMins * 60000);
                        console.log(`✅ Calculated Backend Delivery Time: ${finalDeliveryTime.toISOString()} based on stop offset: ${offsetMins}`);
                    }
                }
            } catch (err) {
                console.error('Error auto-calculating delivery time:', err);
            }
        }

        const safeParseFloat = (val: any) => {
            if (val === null || val === undefined) return null;
            const parsed = parseFloat(val);
            return isNaN(parsed) ? null : parsed;
        };

        const prismaData: any = {
            travellerId: user.id,
            restaurantId: parsedRestaurantId,
            items: orderItems,
            totalAmount: isNaN(totalAmount) ? 0 : totalAmount,
            deliveryLocation: deliveryLocation || deliveryAddress || 'Not specified',
            deliveryLat: safeParseFloat(deliveryLat),
            deliveryLng: safeParseFloat(deliveryLng),
            deliveryTime: (finalDeliveryTime && !isNaN(finalDeliveryTime.getTime())) ? finalDeliveryTime : null,
            specialInstructions: notes || '',
            status: 'PENDING',
        };

        if (bookingId) {
            const bId = typeof bookingId === 'string' ? parseInt(bookingId) : bookingId;
            if (!isNaN(bId)) {
                prismaData.bookingId = bId;
            } else {
                console.log('⚠️ Warning: bookingId is NaN, skipping attachment:', bookingId);
            }
        }

        if (tripId) {
            const tId = typeof tripId === 'string' ? parseInt(tripId) : tripId;
            if (!isNaN(tId)) {
                prismaData.tripId = tId;
            } else {
                console.log('⚠️ Warning: tripId is NaN, skipping attachment:', tripId);
            }
        }

        if (isNaN(prismaData.totalAmount) || prismaData.totalAmount <= 0) {
            console.log('❌ Error: Total amount is invalid:', totalAmount);
            return res.status(400).json({ message: 'Total amount must be greater than zero' });
        }

        if (!user || !user.id) {
            console.log('❌ Error: User ID not found in token payload');
            return res.status(401).json({ message: 'Authentication failed: User ID missing' });
        }

        console.log(`🚀 Creating Prisma Order for User ${user.id} with data:`, JSON.stringify(prismaData, null, 2));

        // Create order with specific error logging
        try {
            const order = await prisma.order.create({
                data: prismaData,
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
                    },
                    traveller: {
                        select: {
                            id: true,
                            full_name: true,
                            phone: true,
                            email: true
                        }
                    },
                    booking: {
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

            console.log('✅ Order created successfully:', order.id);

            return res.status(201).json({
                message: 'Order created successfully',
                order
            });
        } catch (prismaErr: any) {
            console.error('❌ Prisma Create Error Detail:', JSON.stringify(prismaErr, null, 2));
            console.error('❌ Prisma Error Message:', prismaErr.message);

            // Write to a separate file for easier debugging (UTF-8)
            try {
                const logPath = path.join(process.cwd(), 'prisma_debug.log');
                const logContent = `[${new Date().toISOString()}] Prisma Error:\n${JSON.stringify(prismaErr, null, 2)}\n\nData:\n${JSON.stringify(prismaData, null, 2)}\n\n`;
                fs.appendFileSync(logPath, logContent);
            } catch (fsErr) {
                console.error('Failed to write to prisma_debug.log:', fsErr);
            }

            return res.status(500).json({
                message: 'Database error creating order',
                error: prismaErr.message,
                code: prismaErr.code
            });
        }
    } catch (err: any) {
        console.error('❌ Global Create Order Error, type:', typeof err, ', keys:', Object.keys(err || {}));
        console.error('❌ err.message:', err?.message);
        console.error('❌ err.code:', err?.code);
        console.error('❌ err.meta:', JSON.stringify(err?.meta));
        console.error('❌ Full error:', JSON.stringify(err, null, 2));

        const errorDetail = err?.message || JSON.stringify(err) || 'Unknown error';
        const errorCode = err?.code || 'UNKNOWN';
        const errorMeta = err?.meta ? JSON.stringify(err.meta) : '';

        try {
            const logPath = path.join(process.cwd(), 'prisma_debug.log');
            const logContent = `[${new Date().toISOString()}] GLOBAL ERROR:\nMessage: ${errorDetail}\nCode: ${errorCode}\nMeta: ${errorMeta}\nStack: ${err?.stack || 'no stack'}\n\n`;
            fs.appendFileSync(logPath, logContent);
        } catch (fsErr) {
            console.error('Failed to write to prisma_debug.log:', fsErr);
        }

        return res.status(500).json({
            message: `Order failed: ${errorDetail}`,
            code: errorCode,
            meta: errorMeta,
        });
    }
};

// Get user's orders
export const getUserOrders = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;

        const orders = await prisma.order.findMany({
            where: { travellerId: user.id },
            include: {
                restaurant: {
                    select: {
                        id: true,
                        name: true,
                        location: true,
                        ownerId: true
                    }
                },
                booking: {
                    include: {
                        schedule: {
                            include: {
                                route: {
                                    select: {
                                        origin: true,
                                        destination: true
                                    }
                                }
                            }
                        }
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return res.status(200).json({
            message: 'Orders fetched successfully',
            count: orders.length,
            orders
        });
    } catch (err) {
        console.error('Get User Orders Error:', err);
        return res.status(500).json({ message: 'Error fetching orders' });
    }
};

// Get restaurant's orders (for restaurant owners)
export const getRestaurantOrders = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        const { restaurantId } = req.params;

        // Verify restaurant ownership
        const restaurant = await prisma.restaurant.findUnique({
            where: { id: parseInt(restaurantId as string) }
        });

        if (!restaurant) {
            return res.status(404).json({ message: 'Restaurant not found' });
        }

        if (user.role !== 'ADMIN' && restaurant.ownerId !== user.id) {
            return res.status(403).json({ message: 'You can only view orders for your own restaurant' });
        }

        const orders = await prisma.order.findMany({
            where: { restaurantId: parseInt(restaurantId as string) },
            include: {
                traveller: {
                    select: {
                        id: true,
                        full_name: true,
                        phone: true,
                        email: true
                    }
                },
                booking: {
                    include: {
                        schedule: {
                            include: {
                                route: true,
                                bus: true
                            }
                        }
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return res.status(200).json({
            message: 'Orders fetched successfully',
            count: orders.length,
            orders
        });
    } catch (err) {
        console.error('Get Restaurant Orders Error:', err);
        return res.status(500).json({ message: 'Error fetching restaurant orders' });
    }
};

// Get order by ID
export const getOrderById = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        const { id } = req.params;

        const order = await prisma.order.findUnique({
            where: { id: parseInt(id as string) },
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
                },
                traveller: {
                    select: {
                        id: true,
                        full_name: true,
                        phone: true,
                        email: true
                    }
                },
                booking: {
                    include: {
                        schedule: {
                            include: {
                                route: true,
                                bus: true
                            }
                        }
                    }
                }
            }
        });

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Check if user owns this order or is the restaurant owner
        if (order.travellerId !== user.id &&
            order.restaurant.ownerId !== user.id &&
            user.role !== 'ADMIN') {
            return res.status(403).json({ message: 'You can only view your own orders' });
        }

        return res.status(200).json({ order });
    } catch (err) {
        console.error('Get Order Error:', err);
        return res.status(500).json({ message: 'Error fetching order' });
    }
};

// Update order status (for restaurant owners)
export const updateOrderStatus = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        const { id } = req.params;
        const { status } = req.body;

        if (!status) {
            return res.status(400).json({ message: 'Status is required' });
        }

        const validStatuses = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'DELIVERED', 'CANCELLED'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                message: 'Invalid status',
                validStatuses
            });
        }

        const order = await prisma.order.findUnique({
            where: { id: parseInt(id as string) },
            include: {
                restaurant: true
            }
        });

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Restaurant owners can update status, travellers can only cancel
        if (user.role !== 'ADMIN') {
            if (order.restaurant.ownerId === user.id) {
                // Restaurant owner can update to any status
            } else if (order.travellerId === user.id && status === 'CANCELLED') {
                // Traveller can only cancel
            } else {
                return res.status(403).json({ message: 'You do not have permission to update this order' });
            }
        }

        const updatedOrder = await prisma.order.update({
            where: { id: parseInt(id as string) },
            data: { status },
            include: {
                restaurant: {
                    select: {
                        id: true,
                        name: true,
                        location: true
                    }
                },
                traveller: {
                    select: {
                        id: true,
                        full_name: true,
                        phone: true
                    }
                }
            }
        });

        console.log('✅ Order status updated:', id, status);

        return res.status(200).json({
            message: 'Order status updated successfully',
            order: updatedOrder
        });
    } catch (err) {
        console.error('Update Order Status Error:', err);
        return res.status(500).json({ message: 'Error updating order status' });
    }
};
