
import prisma from './src/model/index';

async function main() {
    try {
        console.log('Successfully imported prisma client from src/model/index');
        await prisma.$connect();
        console.log('Successfully connected to database');
        await prisma.$disconnect();
        process.exit(0);
    } catch (e) {
        console.error('Failed to import or connect:', e);
        process.exit(1);
    }
}

main();
