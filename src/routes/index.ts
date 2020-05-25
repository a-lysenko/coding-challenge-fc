import dotenv from 'dotenv';

dotenv.config();

import express from 'express';

import * as dacheRoutes from './api/dache.routes';
import { DacheModel } from '../models/dache.model';

export const createRootRoutes = (dacheModel: DacheModel) => {
  const router = express.Router();

  const dacheRouter = dacheRoutes.createRoutes(dacheModel);
  router.use('/api/cache', dacheRouter);

  return router;
}