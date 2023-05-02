import config from "../configs";
import fs from "fs";
import jwt from "jsonwebtoken";
import { Request } from "express";
import { getTokenByJti } from "../db";

export const verifyToken = async (http_request: Request) => {
  console.debug(`UTIL.verifyToken verifying token`);

  if (!http_request.headers || !http_request.headers.authorization) {
    throw {
      status: 401,
      message: `errors.unauthorized`,
      error: new Error(`no token passed`),
    };
  }
  let token: any;
  // check if token is valid
  try {
    let authorization_header = http_request.headers.authorization.substring(
      7,
      http_request.headers.authorization.length,
    );

    let sslCertFile = fs.readFileSync(config.TOKEN_SERVICE_SSL_KEY);
    sslCertFile = new Buffer(sslCertFile as any, "utf-8");
    token = jwt.verify(
      authorization_header,
      Buffer.from(sslCertFile).toString("ascii"),
      {
        algorithms: config.JWTCONFIG.algorithm,
        //issuer: CONFIG.JWTCONFIG.issuer,
      } as any,
    );
  } catch (error) {
    console.error(`error in UTIL.verifyToken `, error);
    throw {
      status: 401,
      message: `errors.unauthorized`,
      error: new Error(`token verification failed`),
    };
  }
  // check if this token jti actually exists in DB
  try {
    let tokenInDB = await getTokenByJti(token.jti);
    if (!tokenInDB) {
      throw `token jti not found in DB`;
    }
  } catch (error) {
    console.error(`error in UTIL.verifyToken `, error);
    throw {
      status: 401,
      message: `errors.unauthorized`,
      error: new Error(`token not found`),
    };
  }
  return token;
}