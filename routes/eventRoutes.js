
import express from 'express';

import { verifyToken } from '../middleware/verifyToken.js';

import {
  getUpcomingEvents,
  createEvent
} from '../controllers/eventController.js';

const router = express.Router();

router.get('/upcoming', getUpcomingEvents);
router.post('/', createEvent);

router.get('/protected-test', verifyToken, (req, res) => {
  res.status(200).json({
    success: true,
    message: 'JWT verified successfully!',
    user: req.user,
  });
});

export default router;
