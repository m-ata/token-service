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
