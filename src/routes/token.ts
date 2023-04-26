import express, { Request, Response } from "express";
import { MONGO_DB } from "./../db";

const router = express.Router();

router.post("/token", async (req: Request, res: Response) => {
  const { body } = req;
  console.debug(`POST /token called`);
  const db = MONGO_DB.db("fishreg");
  let response = await db
    .collection(`users`)
    .find({ userName: new RegExp("^" + body.userName + "$", "i") })
    .toArray();
  console.log(response);
});

export default router;

