import dotenv from 'dotenv';
import express from 'express';
import cookieParser from 'cookie-parser';
import logger from 'morgan';

// initialize configuration
dotenv.config();

import * as rootRoutes from './routes';

async function main() {
  // port is now available to the Node.js runtime
// as if it were an environment variable
  const port = process.env.SERVER_PORT;

  const app = express();

  app.use(logger('dev'));
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.use(cookieParser());
// app.use(express.static(path.join(__dirname, 'public')));

  const mainRouter = await rootRoutes.createRoutesAsync();

  app.use('/', mainRouter);

// start the Express server
  app.listen( port, () => {
    // tslint:disable-next-line:no-console
    console.log( `server started at http://localhost:${ port }` );
  } );
}

main();
