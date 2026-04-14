import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set');
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    try {
        await prisma.$connect();
        console.log('Successfully connected to database');
        
        // Let's try to query the User table to ensure it exists
        const userCount = await prisma.user.count();
        console.log(`User count: ${userCount}`);
        
        await prisma.$disconnect();
        await pool.end();
    } catch (e) {
        console.error('Error connecting to database:', e);
        process.exit(1);
    }
}

main();

