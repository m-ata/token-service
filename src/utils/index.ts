import crypto from "crypto";
import fs from "fs";
import config from "./config";
import { v4 as uuidv4 } from "uuid";
import jwt from "jsonwebtoken";
import { cleanupTokens, deleteToken } from "../db";
import { insertToken } from "../db";

export const ssha = (cleartext: string, salt?: any) => {
  let sum = crypto.createHash("sha1");
  if (!salt) {
    console.log("no salt given");
    salt = crypto.randomBytes(8).toString("hex");
  } else {
    salt = salt.toString("hex");
  }

  sum.update(cleartext);
  sum.update(salt, "hex");
  const digest = sum.digest("hex");
  const ssha = "{SSHA}" + Buffer.from(digest + salt, "hex").toString("base64");
  return ssha;
};

export const checkPassword = (in_password: string, hash: string) => {
  if (hash.substr(0, 6) === "{SSHA}") {
    return checkSsha(in_password, hash);
  } else {
    return false;
  }
};

const checkSsha = (cleartext: string, hash: string) => {
  if (hash.substr(0, 6) !== "{SSHA}") {
    console.error("Not a SSHA hash");
    return false;
  }
  console.log('Buffer ===> ', Buffer);
  var bash = Buffer.from(hash.substr(6) as any, "base64") as any;
  var salt = bash.toString("hex").substr(40);
  var newSsha = ssha(cleartext, salt);
  return hash === newSsha;
};

export const getCodeTokenPayload = async (userData: any) => {
  console.debug(`BACKEND.getCodeTokenPayload() called with`, {
    ...userData,
    code: userData.code ? "readacted" : null,
  });
  let payload = {
    scope: "user profile",
    code: userData.code,
    organisationId: userData.organisationId,
    stayId: userData.stayId,
    campId: userData.campId,
  };

  return payload;
};

export const getTokenPayload = async (userData: any) => {
  console.debug(`BACKEND.getTokenPayload() called with`, {
    ...userData,
    password: userData.password ? "readacted" : null,
  });
  let payload = {
    firstName: userData.firstName,
    lastName: userData.lastName,
    name: userData.firstName + " " + userData.lastName,
    scope: "user profile",
    userName: userData.userName,
    email: userData.email,
    emailVerified: userData.emailVerified,
    userId: userData.userId,
    organisationId: userData.organisationId,
  };

  return payload;
};

export const generateCodeToken = async (payload: any) => {
  console.debug(`BACKEND.generateCodeToken() called with`, {
    ...payload,
    code: payload.code ? "redacted" : null,
  });
  let sslKeyFile = fs.readFileSync(config.TOKEN_SERVICE_SSL_KEY);
  let sslKey = new Buffer(sslKeyFile as any, "utf-8") as any;

  let tokenExpiryDate = config.CODE_TOKEN_EXPIRY;
  let refreshTokenExpiryDate = config.CODE_REFRESHTOKEN_EXPIRY;
  let jwtid = uuidv4();
  let access_token = jwt.sign(
    Object.assign(
      {},
      {
        typ: "Bearer",
        nbf: parseInt(((Date.now() - 60 * 60 * 1000) / 1000).toString()),
      },
      payload
    ),
    Buffer.from(sslKey).toString("ascii"),
    {
      ...config.JWTCONFIG,
      jwtid: jwtid,
      expiresIn: +tokenExpiryDate,
      subject: payload.code,
    } as any
  );

  let refresh_token = jwt.sign(
    Object.assign(
      {},
      {
        typ: "Bearer",
        nbf: parseInt(((Date.now() - 60 * 60 * 1000) / 1000).toString()),
      },
      { code: payload.code }
    ),
    Buffer.from(sslKey).toString("ascii"),
    {
      ...config.JWTCONFIG,
      jwtid: jwtid,
      expiresIn: +refreshTokenExpiryDate,
      subject: payload.code,
    } as any
  );

  console.log("generated tokens created: ", {
    access_token: access_token,
    refresh_token: refresh_token,
    expires_in: tokenExpiryDate,
    refresh_expires_in: refreshTokenExpiryDate,
  });
  try {
    await cleanupTokens();
  } catch (error) {
    console.error(`caught error cleaning up tokens`, error);
  }

  await insertToken(jwt.decode(refresh_token));
  return {
    access_token: access_token,
    refresh_token: refresh_token,
    expires_in: tokenExpiryDate,
    refresh_expires_in: refreshTokenExpiryDate,
  };
};

/*
  getToken
  called by getTolken and refreshToken
  requires passed "payload"
*/
export const generateToken = async (payload: any) => {
  console.debug(`BACKEND.generateToken() called with`, {
    ...payload,
    userPassword: payload.userPassword ? "redacted" : null,
  });
  let sslKeyFile = fs.readFileSync(config.TOKEN_SERVICE_SSL_KEY);
  let sslKey = new Buffer(sslKeyFile as any, "utf-8") as any;

  let tokenExpiryDate = config.TOKEN_EXPIRY;
  let refreshTokenExpiryDate = config.REFRESHTOKEN_EXPIRY;
  let jwtid = uuidv4();
  let access_token = jwt.sign(
    Object.assign(
      {},
      {
        typ: "Bearer",
        nbf: parseInt(((Date.now() - 60 * 60 * 1000) / 1000).toString()),
      },
      payload
    ),
    Buffer.from(sslKey).toString("ascii"),
    {
      ...config.JWTCONFIG,
      jwtid: jwtid,
      expiresIn: +tokenExpiryDate,
      subject: payload.userName,
    } as any
  );

  let refresh_token = jwt.sign(
    Object.assign(
      {},
      {
        typ: "Bearer",
        nbf: parseInt(((Date.now() - 60 * 60 * 1000) / 1000).toString()),
      },
      { userName: payload.userName }
    ),
    Buffer.from(sslKey).toString("ascii"),
    {
      ...config.JWTCONFIG,
      jwtid: jwtid,
      expiresIn: +refreshTokenExpiryDate,
      subject: payload.userName,
    } as any
  );

  console.log("generated tokens created: ", {
    access_token: access_token,
    refresh_token: refresh_token,
    expires_in: config.TOKEN_EXPIRY,
    refresh_expires_in: config.REFRESHTOKEN_EXPIRY,
  });
  try {
    await cleanupTokens();
  } catch (error) {
    console.error(`caught error cleaning up tokens`, error);
  }

  await insertToken(jwt.decode(refresh_token));
  return {
    access_token: access_token,
    refresh_token: refresh_token,
    expires_in: config.TOKEN_EXPIRY,
    refresh_expires_in: config.REFRESHTOKEN_EXPIRY,
  };
};

/*
  logout token
*/
export const logout = async (token: any) => {
  console.debug(
    `BACKEND.logout() called for userName ${token.userName} jti ${token.jti}`,
  );

  await deleteToken(token.jti);
  return true;
};
