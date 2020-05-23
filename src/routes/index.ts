import dotenv from 'dotenv';

dotenv.config();

import express from 'express';
import { createClient } from '../services/mongo-client.service';

import * as dacheRoutes from './api/dache.routes';
import { Db } from 'mongodb';

export const createRootRoutes = (db: Db) => {
  const router = express.Router();

  const dacheRouter = dacheRoutes.createRoutes(db);
  router.use('/api/cache', dacheRouter);

  return router;
}