import express from 'express';
import logger from 'morgan';
import cookieParser from 'cookie-parser';
import * as rootRoutes from './routes';
import { DacheModel } from './models/dache.model';

export const createServer = async () => {
  const app = express();

  app.use(logger('dev'));
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.use(cookieParser());
// app.use(express.static(path.join(__dirname, 'public')));

  const { client: dbClient, db } = await DacheModel.createClient(process.env.DB_URI);
  const dacheModel = new DacheModel(db);
  const rootRouter = await rootRoutes.createRootRoutes(dacheModel);

  app.use('/', rootRouter);

  return { app, dbClient, db, dacheModel };
}

