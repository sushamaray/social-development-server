
import { getDB } from "../config/db.js";
import { ObjectId } from "mongodb";

// Get all upcoming events (Public)
export async function getUpcomingEvents(req, res) {
  try {
    const db = getDB();

    const filter = {
      date: { $gt: new Date() },
    };

    const limit = Number(req.query.limit);

    let query = db
      .collection("events")
      .find(filter, {
        projection: {
          title: 1,
          description: 1,
          eventType: 1,
          imageURL: 1,
          location: 1,
          date: 1,
        },
      })
      .sort({ date: 1 });

    if (Number.isInteger(limit) && limit > 0) {
      query = query.limit(limit);
    }

    const events = await query.toArray();

    res.status(200).json({
      success: true,
      count: events.length,
      events,
    });
  } catch (error) {
    console.error("Error fetching upcoming events:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch upcoming events",
    });
  }
}

// Create a new event (Private)
export async function createEvent(req, res) {
  try {
    const db = getDB();

    const { title, description, eventType, imageURL, location, date } =
      req.body;

    const creatorEmail = req.user.email;
    const creatorId = req.user.id;

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
        message: "All fields are required",
      });
    }

    const eventDate = new Date(date);

    if (isNaN(eventDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid event date",
      });
    }

    if (eventDate <= new Date()) {
      return res.status(400).json({
        success: false,
        message: "Event date must be in the future",
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
      joinedUsers: [],
    };

    const result = await db.collection("events").insertOne(newEvent);

    res.status(201).json({
      success: true,
      message: "Event created successfully",
      eventId: result.insertedId,
    });
  } catch (error) {
    console.error("Error creating event:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create event",
    });
  }
}

// Get events created by the logged-in user (Private)
export async function getMyEvents(req, res) {
  try {
    const db = getDB();

    const events = await db
      .collection("events")
      .find({
        creatorId: req.user.id,
      })
      .sort({ createdAt: -1 })
      .toArray();

    res.status(200).json({
      success: true,
      count: events.length,
      events,
    });
  } catch (error) {
    console.error("Error fetching user events:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch your events",
    });
  }
}

// Update an event (Private - Owner only)
export async function updateEvent(req, res) {
  try {
    const db = getDB();
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid event ID",
      });
    }

    const allowedFields = [
      "title",
      "description",
      "eventType",
      "imageURL",
      "location",
      "date",
    ];

    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        if (field === "date") {
          const eventDate = new Date(req.body.date);

          if (isNaN(eventDate.getTime()) || eventDate <= new Date()) {
            return res.status(400).json({
              success: false,
              message: "Event date must be a valid future date",
            });
          }

          updates.date = eventDate;
        } else {
          if (
            typeof req.body[field] !== "string" ||
            !req.body[field].trim()
          ) {
            return res.status(400).json({
              success: false,
              message: `${field} must be a non-empty string`,
            });
          }

          updates[field] = req.body[field].trim();
        }
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid fields provided for update",
      });
    }

    updates.updatedAt = new Date();

    const result = await db.collection("events").updateOne(
      {
        _id: new ObjectId(id),
        creatorId: req.user.id,
      },
      {
        $set: updates,
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Event not found or you are not authorized to update it",
      });
    }

    res.status(200).json({
      success: true,
      message: "Event updated successfully",
    });
  } catch (error) {
    console.error("Error updating event:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update event",
    });
  }
}

// Delete an event (Private - Owner only)
export async function deleteEvent(req, res) {
  try {
    const db = getDB();
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid event ID",
      });
    }

    const result = await db.collection("events").deleteOne({
      _id: new ObjectId(id),
      creatorId: req.user.id,
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Event not found or you are not authorized to delete it",
      });
    }

    res.status(200).json({
      success: true,
      message: "Event deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting event:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete event",
    });
  }
}

// Join an event (Private)
export async function joinEvent(req, res) {
  try {
    const db = getDB();
    const { id } = req.params;
    const userId = req.user.id;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid event ID",
      });
    }

    const event = await db.collection("events").findOne({
      _id: new ObjectId(id),
    });

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    if (event.date <= new Date()) {
      return res.status(400).json({
        success: false,
        message: "Cannot join an event that has already started",
      });
    }

    const result = await db.collection("events").updateOne(
      {
        _id: new ObjectId(id),
        date: { $gt: new Date() },
        joinedUsers: { $ne: userId },
      },
      {
        $addToSet: {
          joinedUsers: userId,
        },
      }
    );

    if (result.modifiedCount === 0) {
      const latestEvent = await db.collection("events").findOne({
        _id: new ObjectId(id),
      });

      if (!latestEvent) {
        return res.status(404).json({
          success: false,
          message: "Event not found",
        });
      }

      if (latestEvent.joinedUsers?.includes(userId)) {
        return res.status(409).json({
          success: false,
          message: "You have already joined this event",
        });
      }

      return res.status(400).json({
        success: false,
        message: "Cannot join an event that has already started",
      });
    }

    res.status(200).json({
      success: true,
      message: "You have successfully joined the event",
    });
  } catch (error) {
    console.error("Error joining event:", error);

    res.status(500).json({
      success: false,
      message: "Failed to join event",
    });
  }
}

// Get events joined by the logged-in user (Private)
export async function getJoinedEvents(req, res) {
  try {
    const db = getDB();

    const events = await db
      .collection("events")
      .find({
        joinedUsers: req.user.id,
      })
      .sort({ date: 1 })
      .toArray();

    res.status(200).json({
      success: true,
      count: events.length,
      events,
    });
  } catch (error) {
    console.error("Error fetching joined events:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch joined events",
    });
  }
}

// Get event details (Public)
export async function getEventById(req, res) {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid event ID",
      });
    }

    const db = getDB();

    const event = await db.collection("events").findOne(
      {
        _id: new ObjectId(id),
      },
      {
        projection: {
          title: 1,
          description: 1,
          eventType: 1,
          imageURL: 1,
          location: 1,
          date: 1,
        },
      }
    );

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    res.status(200).json({
      success: true,
      event,
    });
  } catch (error) {
    console.error("Error fetching event:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch event",
    });
  }
}

// Check whether the logged-in user has joined an event (Private)
export async function getEventJoinStatus(req, res) {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid event ID",
      });
    }

    const db = getDB();

    const event = await db.collection("events").findOne(
      {
        _id: new ObjectId(id),
      },
      {
        projection: {
          joinedUsers: 1,
        },
      }
    );

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    const hasJoined =
      event.joinedUsers?.includes(req.user.id) || false;

    res.status(200).json({
      success: true,
      hasJoined,
    });
  } catch (error) {
    console.error("Error checking event join status:", error);

    res.status(500).json({
      success: false,
      message: "Failed to check join status",
    });
  }
}
