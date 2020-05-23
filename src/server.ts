import express from 'express';
import logger from 'morgan';
import cookieParser from 'cookie-parser';
import * as rootRoutes from './routes';
import { createClient } from './services/mongo-client.service';

export const createServer = async () => {
  const app = express();

  app.use(logger('dev'));
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.use(cookieParser());
// app.use(express.static(path.join(__dirname, 'public')));

  const {client: dbClient, db} = await createClient();
  const rootRouter = await rootRoutes.createRootRoutes(db);

  app.use('/', rootRouter);

  return { app, dbClient, db };
}

