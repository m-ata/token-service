import { type IUser } from '../interfaces/user.interface'
import config from '../configs'
import { MongoClient } from 'mongodb'
import { type IDeleteToken, type IToken } from '../interfaces/token.interface'
import { type ICodeValue } from '../interfaces/code.interface'

const URI = `mongodb://${String(config.MONGODB_USER)}:${String(config.MONGODB_PASSWORD)}@${
  String(config.MONGODB_HOST)
}:${config.MONGODB_PORT ?? 27017}`

export const MONGO_DB = new MongoClient(URI, {
  tlsAllowInvalidHostnames: true,
  sslValidate: true,
  tlsCertificateKeyFile: config.MONGODB_TLS_KEY_FILE,
  tlsCertificateFile: config.MONGODB_TLS_CERT_FILE,
  tlsCAFile: config.MONGODB_TLS_CA_FILE
})

export const connectMongoDB = async (): Promise<void> => {
  void MONGO_DB.connect()
}

export const disconnectDB = async (): Promise<void> => {
  void MONGO_DB.close()
}

const fishRegDb = MONGO_DB.db('fishreg')

export const getCompanyByOrganisationId = async function (organisationId: number): Promise<any> {
  const res = await fishRegDb
    .collection('companies')
    .find({ organisationId: +organisationId })
    .toArray()
  if (res?.length) return res[0]
  return null
}

/*
  method to get the user by field and its value
*/
export const getUserByField = async (field: string, value: string | number): Promise<IUser | null> => {
  console.debug(`MongoDB.getUserByUserField() called with field ${field} and value ${value}`)
  const query = field === 'organisationId' ? { [field]: +value, initialUser: true } : { [field]: new RegExp('^' + String(value) + '$', 'i') }
  const res = await fishRegDb
    .collection('users')
    .find(query)
    .toArray()
  if (res?.length) return res[0] as IUser
  return null
}

/*
  method to update the user in the db
*/
export const updateUser = async function (opts: IUser): Promise<IUser> {
  console.debug(
    'MongoDB.updateUser() called with',
    (({ organisationId, userId, userName, ...opts }) => opts)(opts)
  )
  return await fishRegDb
    .collection('users')
    .updateOne(
      { userId: opts.userId, organisationId: opts.organisationId ? +opts.organisationId : 0 },
      { $set: (({ organisationId, userId, userName, ...opts }) => opts)(opts) }
    ) as IUser
}

/*
  get token from db by jti
*/
export const getToken = async (jti: string): Promise<IToken | null> => {
  console.debug('MongoDB.getToken()')
  const res = await fishRegDb.collection('token-service').find({ jti }).toArray()
  if (res?.length) return res[0] as unknown as IToken
  return null
}

/*
  insert token into db
*/
export const insertToken = async (token: any): Promise<IToken> => {
  console.debug('MongoDB.insertToken() ', token)
  let res
  try {
    res = await fishRegDb.collection('token-service').insertOne(token)
  } catch (error) {
    console.debug('caught error in MONGODB.insertToken', error)
  }
  return res as unknown as IToken
}

/*
  update token into db by using jti
*/
export const updateToken = async (jti: string): Promise<any> => {
  console.debug('MongoDB.updateToken()')
  return await fishRegDb
    .collection('token-service')
    .updateMany(
      { jti },
      { $set: { exp: Math.floor((Date.now() + 60 * 1000) / 1000) } }
    )
}

/*
  delete token from db by using jti
*/
export const deleteToken = async (jti: string): Promise<IDeleteToken> => {
  console.debug('MongoDB.deleteToken()')
  return await fishRegDb.collection('token-service').deleteOne({ jti })
}

/*
  clean all tokens from db
*/
export const cleanupTokens = async function (): Promise<IDeleteToken> {
  console.debug('MongoDB.cleanupTokens()')
  return await fishRegDb
    .collection('token-service')
    .deleteMany({ exp: { $lte: Date.now() / 1000 } })
}

/*
  get code
*/
export const getCode = async (code: string): Promise<ICodeValue | null> => {
  console.debug(`MongoDB.getCode() called with code ${code}`)
  const res = await fishRegDb.collection('codes').find({ code }).toArray()
  if (res?.length) return res[0] as unknown as ICodeValue
  return null
}

/*
  tokens
*/
export const getTokenByJti = async function (jti: string): Promise<IToken | null> {
  console.debug('MongoDB.getToken()')
  const res = await fishRegDb.collection('token-service').find({ jti }).toArray()
  if (res?.length) return res[0] as unknown as IToken
  return null
}
