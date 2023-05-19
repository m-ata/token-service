import express from 'express'
import { connectMongoDB } from './db'
import router from './routes/token'
import { once } from 'events'

const startServer = async (): Promise<void> => {
  const app = express()
  app.use(express.urlencoded({ extended: true }))
  // app.use(json()); // parse the request into json
  await connectMongoDB()
  app.use('/', router)
  const server = app.listen(process.env.LISTEN_PORT)
  await once(server, 'listening')
  console.info(`Server listening on port ${String(process.env.LISTEN_PORT)}`)
}

void startServer()
