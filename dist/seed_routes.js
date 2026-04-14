"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🌱 Seeding routes...');
    const routes = [
        {
            name: 'KTM-PKR',
            origin: 'Kathmandu',
            destination: 'Pokhara',
            distance: 200,
            duration: 480, // 8 hours in minutes
            stops: [
                { name: 'Kathmandu', lat: 27.7172, lng: 85.3240, arrivalTime: '0' },
                { name: 'Mugling', lat: 27.8546, lng: 84.5574, arrivalTime: '180' },
                { name: 'Dumre', lat: 27.9702, lng: 84.4170, arrivalTime: '240' },
                { name: 'Pokhara', lat: 28.2096, lng: 83.9856, arrivalTime: '480' }
            ],
        },
        {
            name: 'KTM-CIT',
            origin: 'Kathmandu',
            destination: 'Chitwan',
            distance: 175,
            duration: 360, // 6 hours
            stops: [
                { name: 'Kathmandu', lat: 27.7172, lng: 85.3240, arrivalTime: '0' },
                { name: 'Mugling', lat: 27.8546, lng: 84.5574, arrivalTime: '180' },
                { name: 'Narayanghat', lat: 27.6961, lng: 84.4334, arrivalTime: '300' },
                { name: 'Chitwan', lat: 27.5255, lng: 84.4357, arrivalTime: '360' }
            ],
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
            ],
        }
    ];
    for (const route of routes) {
        const createdRoute = await prisma.route.create({
            data: route,
        });
        console.log(`✅ Created route: ${createdRoute.name}`);
    }
    console.log('✨ Seeding finished.');
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed_routes.js.map