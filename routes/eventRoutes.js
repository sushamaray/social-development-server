
import express from 'express';

import { verifyToken } from '../middleware/verifyToken.js';

import {
    getUpcomingEvents,
    createEvent,
    getMyEvents,
    updateEvent,
    deleteEvent,
    joinEvent,
    getJoinedEvents
} from '../controllers/eventController.js';

const router = express.Router();

// Public route
router.get('/upcoming', getUpcomingEvents);

// Protected routes
router.post('/', verifyToken, createEvent);
router.get('/my-events', verifyToken, getMyEvents);
router.patch('/:id', verifyToken, updateEvent);
router.delete('/:id', verifyToken, deleteEvent);

// Joined Events routes
router.post('/:id/join', verifyToken, joinEvent);
router.get('/joined', verifyToken, getJoinedEvents);

// Temporary JWT verification test route
router.get('/protected-test', verifyToken, (req, res) => {
    res.status(200).json({
        success: true,
        message: 'JWT verified successfully!',
        user: req.user,
    });
});

export default router;
