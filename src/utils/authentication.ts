import mongoose from "mongoose";
import { UserOption } from "../interfaces/userOption.interface";
import { MONGO_DB } from "../db";

export const authenticateUser = async (options: UserOption) => {
  const { userName, password, refreshToken = false } = options;
  let response: any;
  if (userName && userName.match(/^admin#/)) {
    response = await getUserByUserName("admin");
    let organisationId = userName.replace(/^admin#/, "");
    response = {
      ...response,
      organisationId: +organisationId,
      source: "admin",
    };
  } else {
    response = await getUserByUserName(userName);
    response = {
      ...response,
      source: "userName",
    };
  }
};

const getUserByUserName = async (userName: string) => {
  const db = MONGO_DB.db("fishreg");
  let res = await db
    .collection(`users`)
    .find({ userName: new RegExp("^" + userName + "$", "i") })
    .toArray();
  console.log(res);
};
