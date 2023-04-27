import { IUser } from "../interfaces/user.interface";
import config from "../utils/config";
import { MongoClient } from "mongodb";

const URI = `mongodb://${config.MONGODB_USER}:${config.MONGODB_PASSWORD}@${
  config.MONGODB_HOST
}:${config.MONGODB_PORT ?? 27017}`;

export const MONGO_DB = new MongoClient(URI, {
  tlsAllowInvalidHostnames: true,
  sslValidate: true,
  tlsCertificateKeyFile: config.MONGODB_TLS_KEY_FILE,
  tlsCertificateFile: config.MONGODB_TLS_CERT_FILE,
  tlsCAFile: config.MONGODB_TLS_CA_FILE,
});

export const connectMongoDB = async () => {
  MONGO_DB.connect();
};

export const disconnectDB = () => {
  MONGO_DB.close();
};

const fishRegDb = MONGO_DB.db("fishreg");

export const getCompanyByOrganisationId = async function (organisationId: number) {
  let res = await fishRegDb
    .collection(`companies`)
    .find({ organisationId: +organisationId })
    .toArray();
  if (res?.length) return res[0];
  return null;
};

/*
  method to get the user by field and its value
*/
export const getUserByField = async (field: string, value: string | number) => {
  console.debug(`MongoDB.getUserByUserField() called with field ${field} and value ${value}`);
  const query = field === 'organisationId' ?  { [field]: +value, initialUser: true } : { [field]: new RegExp("^" + value + "$", "i") }
  let res = await fishRegDb
    .collection(`users`)
    .find(query)
    .toArray();
  if (res?.length) return res[0];
  return null;
};

/*
  method to update the user in the db
*/
export const updateUser = async function (opts: IUser) {
  console.debug(
    `MongoDB.updateUser() called with`,
    (({ organisationId, userId, userName, ...opts }) => opts)(opts),
  );
  return fishRegDb
    .collection(`users`)
    .updateOne(
      { userId: opts.userId, organisationId: +opts.organisationId },
      { $set: (({ organisationId, userId, userName, ...opts }) => opts)(opts) },
    );
};

/*
  get token from db by jti
*/
export const getToken = async (jti: string) => {
  console.debug(`MongoDB.getToken()`);
  let res = await fishRegDb.collection(`token-service`).find({ jti: jti }).toArray();
  if (res?.length) return res[0];
};

/*
  insert token into db
*/
export const insertToken = async (token: any) => {
  console.debug(`MongoDB.insertToken()`);
  let res;
  try {
    res = await fishRegDb.collection(`token-service`).insertOne(token);
  } catch (error) {
    console.debug(`caught error in MONGODB.insertToken`, error);
  }
  return res;
};

/*
  update token into db by using jti
*/
export const updateToken = async (jti: string) => {
  console.debug(`MongoDB.updateToken()`);
  return fishRegDb
    .collection(`token-service`)
    .updateMany(
      { jti: jti },
      { $set: { exp: Math.floor((Date.now() + 60 * 1000) / 1000) } },
    );
};

/*
  delete token from db by using jti
*/
export const deleteToken = async (jti: string) => {
  console.debug(`MongoDB.deleteToken()`);
  return fishRegDb.collection(`token-service`).deleteOne({ jti: jti });
};

/*
  clean all tokens from db
*/
export const cleanupTokens = async function () {
  console.debug(`MongoDB.cleanupTokens()`);
  return fishRegDb
    .collection(`token-service`)
    .deleteMany({ exp: { $lte: Date.now() / 1000 } });
};

/*
  get code
*/
export const getCode = async (code: string) => {
  console.debug(`MongoDB.getCode() called with code ${code}`);
  let res = await fishRegDb.collection(`codes`).find({ code: code }).toArray();
  if (res?.length) return res[0];
  return null;
};