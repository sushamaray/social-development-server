
import express from 'express';
import { verifyToken } from '../middleware/verifyToken.js';

import {
    getUpcomingEvents,
    getEventById,
    createEvent,
    getMyEvents,
    updateEvent,
    deleteEvent,
    joinEvent,
    getJoinedEvents
} from '../controllers/eventController.js';

const router = express.Router();

// Public routes
router.get('/upcoming', getUpcomingEvents);

// Protected routes
router.post('/', verifyToken, createEvent);
router.get('/my-events', verifyToken, getMyEvents);
router.get('/joined', verifyToken, getJoinedEvents);
router.patch('/:id', verifyToken, updateEvent);
router.delete('/:id', verifyToken, deleteEvent);
router.post('/:id/join', verifyToken, joinEvent);

// Public event details route
router.get('/:id', getEventById);

export default router;
