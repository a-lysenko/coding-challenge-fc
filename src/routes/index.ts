import { MongoClient } from 'mongodb';
import express from 'express';
import * as dacheRoutes from './api/dache.routes';

import dotenv from 'dotenv';
dotenv.config();

export const createRoutesAsync = async () => {
  const router = express.Router();

  const client = new MongoClient(process.env.DB_URI, { useNewUrlParser: true, useUnifiedTopology: true });

  await client.connect();

  const db = client.db();

  const dacheRouter = dacheRoutes.createRoutes(db);
  router.use('/api/cache', dacheRouter);

  return router;
}