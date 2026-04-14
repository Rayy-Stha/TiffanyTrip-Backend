import cors from "cors";
import "dotenv/config";
import express from "express";
import { createServer } from "http";
import busRoutes from "./routes/busRoutes";
import dashboardRoutes from "./routes/dashboardRoutes";
import messageRoutes from "./routes/messageRoutes";
import paymentRoutes from "./routes/paymentRoutes";
import restaurantRoutes from "./routes/restaurantRoutes";
import routeRoutes from "./routes/routeRoutes";
import tripRoutes from "./routes/tripRoutes";
import UserRouter from "./routes/userRoutes";
import { initSocket } from "./socket";

const app = express();
const httpServer = createServer(app);

// Initialize Socket.io
initSocket(httpServer);

// Middlewares
app.use(cors({
    origin: true, // Allow all origins for development (mobile device IP, localhost, etc.)
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    if (req.method !== 'GET') {
        console.log('Body:', req.body);
    }
    next();
});

// Root Route
app.get("/", (req, res) => {
    res.send("TriffinyTrip Backend is Running...");
});

// Routes
app.use("/api/users", UserRouter());
app.use("/api/buses", busRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/restaurants", restaurantRoutes);
app.use("/api/trips", tripRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/routes", routeRoutes);
app.use("/api/payment", paymentRoutes);

// Load port from .env or fallback to 8001
const PORT = process.env.PORT || 8001;

httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
