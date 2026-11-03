
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
            date
        } = req.body;

        // Get creator information from verified JWT
        const creatorEmail = req.user.email;
        const creatorId = req.user.id;

        // Validate required fields
        if (
            !title?.trim() ||
            !description?.trim() ||
            !eventType?.trim() ||
            !imageURL?.trim() ||
            !location?.trim() ||
            !date
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
            title: title.trim(),
            description: description.trim(),
            eventType: eventType.trim(),
            imageURL: imageURL.trim(),
            location: location.trim(),
            date: eventDate,
            creatorEmail,
            creatorId,
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
