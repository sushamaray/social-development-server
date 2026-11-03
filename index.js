
import express from 'express';
import cors from 'cors';
import { connectDB } from './config/db.js';
import eventRoutes from './routes/eventRoutes.js';

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(
    cors({
        origin: [
            "http://localhost:3000",
            "https://socialdevelopmentevents.vercel.app",
        ],
        credentials: true,
    })
);
app.use(express.json());
app.use('/api/events', eventRoutes);

// Home route
app.get('/', (req, res) => {
    res.send('Social Development Server Is Running');
});

// Start server after database connection
async function startServer() {
    try {
        const db = await connectDB();

        app.locals.db = db;

        app.listen(port, () => {
            console.log(`Server is running on port: ${port}`);
        });

    } catch (error) {
        console.error('Server startup failed:', error);
        process.exit(1);
    }
}

startServer();
