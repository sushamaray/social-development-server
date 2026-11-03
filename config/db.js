
import { MongoClient } from 'mongodb';
import 'dotenv/config';

const uri = process.env.MONGODB_URI;

const client = new MongoClient(uri);

let db;

export async function connectDB() {
    try {
        await client.connect();

        db = client.db(process.env.DB_NAME);

        console.log('MongoDB Connected Successfully!');

        return db;
    } catch (error) {
        console.error('MongoDB Connection Failed:', error);
        throw error;
    }
}

export function getDB() {
    if (!db) {
        throw new Error('Database is not connected yet!');
    }

    return db;
}
