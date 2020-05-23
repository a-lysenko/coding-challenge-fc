import dotenv from 'dotenv';
import { createServer } from './server';

// initialize configuration
dotenv.config();

async function main() {
  // port is now available to the Node.js runtime
// as if it were an environment variable
  const port = process.env.SERVER_PORT;

  const { app } = await createServer();
// start the Express server
  app.listen( port, () => {
    // tslint:disable-next-line:no-console
    console.log( `server started at http://localhost:${ port }` );
  } );
}

main();
