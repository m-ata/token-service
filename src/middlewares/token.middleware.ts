import { getCodeTokenPayload } from "../utils";
import config from "../utils/config";
import { authenticateCode, authenticateUser } from "./auth.middleware";
import { getTokenPayload } from "../utils";
import { generateCodeToken } from "../utils";
import { generateToken } from "../utils";
import { updateToken } from "../db";
import fs from "fs";
import jwt from "jsonwebtoken";

/*
  getToken
  called by /token router on "login"
  calls authenticateUser and getTokenPayload, if they dont throw return generateToken promise.
*/
export const getToken = async (options: any) => {
  console.debug(`BACKEND.getToken() called with`, {
    ...options,
    password: options.password ? "redacted" : null,
  });
  const { client_id } = options;
  console.log("client id ", config.TOKEN_SERVICE_CLIENT_ID);
  console.log("options client id ", client_id);
  if (client_id !== config.TOKEN_SERVICE_CLIENT_ID) {
    throw `token-service not configured for requested client_id`;
  }
  let userdata;
  try {
    userdata = options.code
      ? await authenticateCode({
          ...options,
        })
      : await authenticateUser({
          ...options,
          userName: options.username,
          userPassword: options.userPassword,
        });
  } catch (error) {
    console.error(
      `caught error authenticating user in BACKEND.getToken()`,
      error
    );
    throw {
      status: 401,
      message: `errors.unauthorized`,
      error: new Error(`authentication failed`),
    };
  }
  let payload = options.code
    ? await getCodeTokenPayload(userdata)
    : await getTokenPayload(userdata);
  return options.code ? generateCodeToken(payload) : generateToken(payload);
};

export const refreshToken = async (options: any) => {
  console.debug(`BACKEND.refreshToken() called with`, {
    ...options,
  });
  if (options.client_id !== config.TOKEN_SERVICE_CLIENT_ID) {
    throw `token-service not configured for requested client_id`;
  }
  let sslCertFile = fs.readFileSync(config.TOKEN_SERVICE_SSL_KEY);
  sslCertFile = new (Buffer.from(sslCertFile as any, "utf-8") as any)();
  let token: any;
  try {
    token = jwt.verify(
      options.refresh_token,
      Buffer.from(sslCertFile).toString("ascii"),
      {
        algorithms: config.JWTCONFIG.algorithm as any,
        //issuer: CONFIG.JWTCONFIG.issuer,
      }
    );
  } catch (error) {
    console.error(
      `caught error verifying token in BACKEND.refreshToken()`,
      error
    );
    throw {
      status: 401,
      message: `errors.unauthorized`,
      error: new Error(`refresh token verification failed`),
    };
  }

  let tokenInDB = await getToken(token.jti);
  if (!tokenInDB) {
    throw {
      status: 401,
      message: `errors.unauthorized`,
      error: new Error(`refresh token not found in database`),
    };
  }
  console.debug(
    `BACKEND.refreshToken() refreshing tokens for ${
      token.code ? "code" : "userName"
    } ${token.code ? token.code : token.userName} jti ${token.jti} `,
    token
  );
  let userdata = token.code
    ? await authenticateCode({
        ...token,
        refreshToken: true,
      })
    : await authenticateUser({
        ...token,
        refreshToken: true,
      });
  let payload = token.code
    ? await getCodeTokenPayload(userdata)
    : await getTokenPayload(userdata);
  // delete the used up refresh token
  await updateToken(token.jti);
  return token.code ? generateCodeToken(payload) : generateToken(payload);
};
