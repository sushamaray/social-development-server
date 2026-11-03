
import { getDB } from '../config/db.js';

export async function getUpcomingEvents(req, res) {
    try {
        const db = getDB();

        const events = await db
            .collection('events')
            .find({
                date: { $gt: new Date() }
            })
            .sort({ date: 1 })
            .limit(6)
            .toArray();

        res.status(200).json({
            success: true,
            count: events.length,
            events
        });

    } catch (error) {
        console.error('Error fetching upcoming events:', error);

        res.status(500).json({
            success: false,
            message: 'Failed to fetch upcoming events'
        });
    }
}


export async function createEvent(req, res) {
    try {
        const db = getDB();

        const {
            title,
            description,
            eventType,
            imageURL,
            location,
            date,
            creatorEmail
        } = req.body;

        // Validate required fields
        if (
            !title ||
            !description ||
            !eventType ||
            !imageURL ||
            !location ||
            !date ||
            !creatorEmail
        ) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        const eventDate = new Date(date);

        if (isNaN(eventDate.getTime())) {
            return res.status(400).json({
                success: false,
                message: 'Invalid event date'
            });
        }

        if (eventDate <= new Date()) {
            return res.status(400).json({
                success: false,
                message: 'Event date must be in the future'
            });
        }

        const newEvent = {
            title,
            description,
            eventType,
            imageURL,
            location,
            date: eventDate,
            creatorEmail,
            createdAt: new Date(),
            joinedUsers: []
        };

        const result = await db
            .collection('events')
            .insertOne(newEvent);

        res.status(201).json({
            success: true,
            message: 'Event created successfully',
            eventId: result.insertedId
        });

    } catch (error) {
        console.error('Error creating event:', error);

        res.status(500).json({
            success: false,
            message: 'Failed to create event'
        });
    }
}

