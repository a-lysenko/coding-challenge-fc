import dotenv from 'dotenv';

dotenv.config();

import express from 'express';
import { createClient } from '../services/mongo-client.service';

import * as dacheRoutes from './api/dache.routes';
import { Db } from 'mongodb';
import { DacheModel } from '../models/dache.model';

export const createRootRoutes = (db: Db, dacheModel: DacheModel) => {
  const router = express.Router();

  const dacheRouter = dacheRoutes.createRoutes(db, dacheModel);
  router.use('/api/cache', dacheRouter);

  return router;
}