"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cors_1 = __importDefault(require("cors"));
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const busRoutes_1 = __importDefault(require("./routes/busRoutes"));
const dashboardRoutes_1 = __importDefault(require("./routes/dashboardRoutes"));
const messageRoutes_1 = __importDefault(require("./routes/messageRoutes"));
const paymentRoutes_1 = __importDefault(require("./routes/paymentRoutes"));
const restaurantRoutes_1 = __importDefault(require("./routes/restaurantRoutes"));
const routeRoutes_1 = __importDefault(require("./routes/routeRoutes"));
const tripRoutes_1 = __importDefault(require("./routes/tripRoutes"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const socket_1 = require("./socket");
const app = (0, express_1.default)();
const httpServer = (0, http_1.createServer)(app);
// Initialize Socket.io
(0, socket_1.initSocket)(httpServer);
// Middlewares
app.use((0, cors_1.default)({
    origin: true, // Allow all origins for development (mobile device IP, localhost, etc.)
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express_1.default.json());
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
app.use("/api/users", (0, userRoutes_1.default)());
app.use("/api/buses", busRoutes_1.default);
app.use("/api/messages", messageRoutes_1.default);
app.use("/api/restaurants", restaurantRoutes_1.default);
app.use("/api/trips", tripRoutes_1.default);
app.use("/api/dashboard", dashboardRoutes_1.default);
app.use("/api/routes", routeRoutes_1.default);
app.use("/api/payment", paymentRoutes_1.default);
// Load port from .env or fallback to 8001
const PORT = process.env.PORT || 8001;
httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
//# sourceMappingURL=app.js.map