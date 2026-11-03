
import express from 'express';

import {
    getUpcomingEvents,
    createEvent
} from '../controllers/eventController.js';

const router = express.Router();

router.get('/upcoming', getUpcomingEvents);
router.post('/', createEvent);

export default router;
