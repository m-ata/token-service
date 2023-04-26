import express, { Request, Response } from "express";
import { MONGO_DB } from "./../db";

const router = express.Router();

router.post("/token", async (req: Request, res: Response) => {
  const { body } = req;
  console.debug(`POST /token called`);
  const db = MONGO_DB.db("fishreg");
  let response = await db
    .collection(`users`)
    .find({ userName: body.username })
    .toArray();
  console.log(response);
  res.status(200).send(response);
});

export default router;

