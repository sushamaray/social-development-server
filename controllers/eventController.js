
import { getDB } from '../config/db.js';
import { ObjectId } from 'mongodb';

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


export async function getMyEvents(req, res) {
    try {
        const db = getDB();

        const events = await db
            .collection('events')
            .find({
                creatorId: req.user.id
            })
            .sort({ createdAt: -1 })
            .toArray();

        res.status(200).json({
            success: true,
            count: events.length,
            events
        });

    } catch (error) {
        console.error('Error fetching user events:', error);

        res.status(500).json({
            success: false,
            message: 'Failed to fetch your events'
        });
    }
}


export async function updateEvent(req, res) {
    try {
        const db = getDB();
        const { id } = req.params;

        if (!ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid event ID'
            });
        }

        const allowedFields = [
            'title',
            'description',
            'eventType',
            'imageURL',
            'location',
            'date'
        ];

        const updates = {};

        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                if (
                    field === 'date'
                ) {
                    const eventDate = new Date(req.body.date);

                    if (
                        isNaN(eventDate.getTime()) ||
                        eventDate <= new Date()
                    ) {
                        return res.status(400).json({
                            success: false,
                            message: 'Event date must be a valid future date'
                        });
                    }

                    updates.date = eventDate;
                } else {
                    if (
                        typeof req.body[field] !== 'string' ||
                        !req.body[field].trim()
                    ) {
                        return res.status(400).json({
                            success: false,
                            message: `${field} must be a non-empty string`
                        });
                    }

                    updates[field] = req.body[field].trim();
                }
            }
        }

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No valid fields provided for update'
            });
        }

        updates.updatedAt = new Date();

        const result = await db.collection('events').updateOne(
            {
                _id: new ObjectId(id),
                creatorId: req.user.id
            },
            {
                $set: updates
            }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({
                success: false,
                message: 'Event not found or you are not authorized to update it'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Event updated successfully'
        });

    } catch (error) {
        console.error('Error updating event:', error);

        res.status(500).json({
            success: false,
            message: 'Failed to update event'
        });
    }
}


export async function deleteEvent(req, res) {
    try {
        const db = getDB();
        const { id } = req.params;

        if (!ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid event ID'
            });
        }

        const result = await db.collection('events').deleteOne({
            _id: new ObjectId(id),
            creatorId: req.user.id
        });

        if (result.deletedCount === 0) {
            return res.status(404).json({
                success: false,
                message: 'Event not found or you are not authorized to delete it'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Event deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting event:', error);

        res.status(500).json({
            success: false,
            message: 'Failed to delete event'
        });
    }
}

