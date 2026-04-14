import { Request, Response } from 'express';
import prisma from '../model/index';

// Get upcoming trips for dashboard
export const getUpcomingTrips = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;

        const now = new Date();

        const trips = await prisma.trip.findMany({
            where: {
                travellerId: user.id,
                startDate: {
                    gte: now
                },
                status: {
                    in: ['PLANNED', 'ONGOING']
                }
            },
            include: {
                bookings: {
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
                },
                _count: {
                    select: {
                        bookings: true,
                        orders: true
                    }
                }
            },
            orderBy: {
                startDate: 'asc'
            },
            take: 5
        });

        return res.status(200).json({
            message: 'Upcoming trips fetched successfully',
            trips
        });
    } catch (err) {
        console.error('Get Upcoming Trips Error:', err);
        return res.status(500).json({ message: 'Error fetching upcoming trips' });
    }
};

// Get recommended destinations (mock for now, can be enhanced with ML later)
export const getRecommendations = async (req: Request, res: Response) => {
    try {
        // Get popular routes based on booking count
        const popularRoutes = await prisma.route.findMany({
            include: {
                schedules: {
                    include: {
                        _count: {
                            select: {
                                bookings: true
                            }
                        }
                    }
                },
                restaurants: {
                    select: {
                        id: true,
                        name: true,
                        rating: true
                    }
                }
            },
            take: 10
        });

        // Calculate popularity score
        const recommendations = popularRoutes.map(route => {
            const totalBookings = route.schedules.reduce(
                (sum, schedule) => sum + schedule._count.bookings,
                0
            );
            const avgRestaurantRating = route.restaurants.length > 0
                ? route.restaurants.reduce((sum, r) => sum + r.rating, 0) / route.restaurants.length
                : 0;

            return {
                id: route.id,
                destination: route.destination,
                origin: route.origin,
                distance: route.distance,
                duration: route.duration,
                popularity: totalBookings,
                rating: avgRestaurantRating,
                restaurantCount: route.restaurants.length
            };
        }).sort((a, b) => b.popularity - a.popularity);

        return res.status(200).json({
            message: 'Recommendations fetched successfully',
            recommendations: recommendations.slice(0, 6)
        });
    } catch (err) {
        console.error('Get Recommendations Error:', err);
        return res.status(500).json({ message: 'Error fetching recommendations' });
    }
};

// Get user statistics
export const getUserStats = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;

        const [totalTrips, totalBookings, totalOrders, upcomingBookings] = await Promise.all([
            prisma.trip.count({
                where: { travellerId: user.id }
            }),
            prisma.booking.count({
                where: { travellerId: user.id }
            }),
            prisma.order.count({
                where: { travellerId: user.id }
            }),
            prisma.booking.count({
                where: {
                    travellerId: user.id,
                    travelDate: {
                        gte: new Date()
                    },
                    status: {
                        in: ['PENDING', 'CONFIRMED']
                    }
                }
            })
        ]);

        // Calculate total spent
        const bookings = await prisma.booking.findMany({
            where: { travellerId: user.id },
            select: { totalFare: true }
        });

        const orders = await prisma.order.findMany({
            where: { travellerId: user.id },
            select: { totalAmount: true }
        });

        const totalSpent =
            bookings.reduce((sum, b) => sum + b.totalFare, 0) +
            orders.reduce((sum, o) => sum + o.totalAmount, 0);

        return res.status(200).json({
            message: 'User statistics fetched successfully',
            stats: {
                totalTrips,
                totalBookings,
                totalOrders,
                upcomingBookings,
                totalSpent
            }
        });
    } catch (err) {
        console.error('Get User Stats Error:', err);
        return res.status(500).json({ message: 'Error fetching user statistics' });
    }
};
