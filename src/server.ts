import express from 'express';
import { json } from 'body-parser';
import { connectMongoDB } from './db';
import router from './routes/token';
import { once } from 'events';

const startServer = async () => {
    const app = express();
    app.use(express.urlencoded({ extended: true }));
    app.use(json()); // parse the request into json
    connectMongoDB();
    console.log(process.env);
    console.log(router);
    app.use('/', router);
    const server = app.listen(process.env.LISTEN_PORT);
    await once(server, "listening");
    console.info(`Server listening on port ${process.env.LISTEN_PORT}`);
}

startServer();
