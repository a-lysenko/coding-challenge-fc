import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';

dotenv.config();

export const createClient = async (
  DB_URI = process.env.DB_URI,
  connectAutomatically = true
) => {
  const client = new MongoClient(
    DB_URI,
    { useNewUrlParser: true, useUnifiedTopology: true }
  );

  if (connectAutomatically) {
    await client.connect();
  }

  const db = client.db();
  return { client, db };
}