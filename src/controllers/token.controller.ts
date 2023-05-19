import {
  authenticateCode,
  authenticateUser
} from '../middlewares/auth.middleware'
import config from '../configs'
import { getCodeTokenPayload, getTokenPayload } from '../utils'
import { cleanupTokens, deleteToken, getTokenByJti, insertToken, updateToken } from '../db'
import fs from 'fs'
import jwt from 'jsonwebtoken'
import { v4 as uuidv4 } from 'uuid'
import { type ITokenPayload, type IToken, type ITokenResponse } from '../interfaces/token.interface'
import { type ICodeTokenPayload } from '../interfaces/code.interface'
import { type IUser } from '../interfaces/user.interface'

/*
  getToken
  called by /token router on "login"
  calls authenticateUser and getTokenPayload, if they dont throw return generateToken promise.
*/
export const getToken = async (options: ITokenPayload): Promise<ITokenResponse> => {
  console.debug('BACKEND.getToken() called with', {
    ...options,
    password: options.password ? 'redacted' : null
  })
  const { client_id } = options
  if (client_id !== config.TOKEN_SERVICE_CLIENT_ID) {
    throw new Error('token-service not configured for requested client_id')
  }
  let userdata
  try {
    userdata = options.code
      ? await authenticateCode({
        code: options.code
      })
      : await authenticateUser({
        userName: String(options?.username),
        userPassword: String(options.password)
      })
  } catch (error) {
    console.error(
      'caught error authenticating user in BACKEND.getToken()',
      error
    )
    throw Object.assign(new Error(), {
      status: 401,
      message: 'errors.unauthorized',
      error: new Error('authentication failed')
    })
  }
  const payload = options.code
    ? getCodeTokenPayload(userdata)
    : getTokenPayload(userdata)
  return options.code ? await generateCodeToken(payload as ICodeTokenPayload) : await generateToken(payload as IUser)
}

/*
  refreshToken
  called by /token router on refresh token
  verify token, throws error if it doesn't exist in DB, otherwise return new token
*/
export const refreshToken = async (options: ITokenPayload): Promise<ITokenResponse> => {
  console.debug('BACKEND.refreshToken() called with', {
    ...options
  })
  if (options.client_id !== config.TOKEN_SERVICE_CLIENT_ID) {
    throw new Error('token-service not configured for requested client_id')
  }
  let sslCertFile = fs.readFileSync(String(config.TOKEN_SERVICE_SSL_KEY))
  sslCertFile = new (Buffer.from(sslCertFile as any, 'utf-8') as any)()
  let token: any
  try {
    token = jwt.verify(
      String(options.refresh_token),
      Buffer.from(sslCertFile).toString('ascii'),
      {
        algorithms: config.JWTCONFIG.algorithm as any
        // issuer: CONFIG.JWTCONFIG.issuer,
      }
    )
  } catch (error) {
    console.error(
      'caught error verifying token in BACKEND.refreshToken()',
      error
    )
    throw Object.assign(new Error(), {
      status: 401,
      message: 'errors.unauthorized',
      error: new Error('refresh token verification failed')
    })
  }

  const tokenInDB = await getTokenByJti(token.jti)
  if (!tokenInDB) {
    throw Object.assign(new Error(), {
      status: 401,
      message: 'errors.unauthorized',
      error: new Error('refresh token not found in database')
    })
  }
  console.debug(
    `BACKEND.refreshToken() refreshing tokens for ${
      token.code ? 'code' : 'userName'
    } ${token.code ? String(token.code) : String(token.userName)} jti ${String(token.jti)} `,
    token
  )
  const userdata = token.code
    ? await authenticateCode({
      ...token,
      refreshToken: true
    })
    : await authenticateUser({
      ...token,
      refreshToken: true
    })
  const payload = token.code
    ? getCodeTokenPayload(userdata)
    : getTokenPayload(userdata)
  // delete the used up refresh token
  await updateToken(token.jti)
  return token.code ? await generateCodeToken(payload as ICodeTokenPayload) : await generateToken(payload as IUser)
}

export const generateCodeToken = async (payload: ICodeTokenPayload): Promise<ITokenResponse> => {
  console.debug('BACKEND.generateCodeToken() called with', {
    ...payload,
    code: payload.code ? 'redacted' : null
  })
  const sslKeyFile = fs.readFileSync(String(config.TOKEN_SERVICE_SSL_KEY))
  const sslKey = Buffer.from(sslKeyFile as any, 'utf-8') as any

  const tokenExpiryDate = config.CODE_TOKEN_EXPIRY
  const refreshTokenExpiryDate = config.CODE_REFRESHTOKEN_EXPIRY
  const jwtid = uuidv4()
  const access_token = jwt.sign(
    Object.assign(
      {},
      {
        typ: 'Bearer',
        nbf: parseInt(((Date.now() - 60 * 60 * 1000) / 1000).toString())
      },
      payload
    ),
    Buffer.from(sslKey).toString('ascii'),
    {
      ...config.JWTCONFIG,
      jwtid,
      expiresIn: +tokenExpiryDate,
      subject: payload.code
    } as any
  )

  const refresh_token = jwt.sign(
    Object.assign(
      {},
      {
        typ: 'Bearer',
        nbf: parseInt(((Date.now() - 60 * 60 * 1000) / 1000).toString())
      },
      { code: payload.code }
    ),
    Buffer.from(sslKey).toString('ascii'),
    {
      ...config.JWTCONFIG,
      jwtid,
      expiresIn: +refreshTokenExpiryDate,
      subject: payload.code
    } as any
  )

  console.log('generated tokens created: ', {
    access_token,
    refresh_token,
    expires_in: tokenExpiryDate,
    refresh_expires_in: refreshTokenExpiryDate
  })
  try {
    await cleanupTokens()
  } catch (error) {
    console.error('caught error cleaning up tokens', error)
  }

  await insertToken(jwt.decode(refresh_token))
  return {
    access_token,
    refresh_token,
    expires_in: tokenExpiryDate,
    refresh_expires_in: refreshTokenExpiryDate
  }
}

/*
  generateToken
  called by getToken and refreshToken
  requires passed "payload"
*/
export const generateToken = async (payload: IUser): Promise<ITokenResponse> => {
  console.debug('BACKEND.generateToken() called with', {
    ...payload,
    userPassword: payload.userPassword ? 'redacted' : null
  })
  const sslKeyFile = fs.readFileSync(String(config.TOKEN_SERVICE_SSL_KEY))
  const sslKey = Buffer.from(sslKeyFile as any, 'utf-8') as any

  const tokenExpiryDate = config.TOKEN_EXPIRY
  const refreshTokenExpiryDate = config.REFRESHTOKEN_EXPIRY
  const jwtid = uuidv4()
  const access_token = jwt.sign(
    Object.assign(
      {},
      {
        typ: 'Bearer',
        nbf: parseInt(((Date.now() - 60 * 60 * 1000) / 1000).toString())
      },
      payload
    ),
    Buffer.from(sslKey).toString('ascii'),
    {
      ...config.JWTCONFIG,
      jwtid,
      expiresIn: +tokenExpiryDate,
      subject: payload.userName
    } as any
  )

  const refresh_token = jwt.sign(
    Object.assign(
      {},
      {
        typ: 'Bearer',
        nbf: parseInt(((Date.now() - 60 * 60 * 1000) / 1000).toString())
      },
      { userName: payload.userName }
    ),
    Buffer.from(sslKey).toString('ascii'),
    {
      ...config.JWTCONFIG,
      jwtid,
      expiresIn: +refreshTokenExpiryDate,
      subject: payload.userName
    } as any
  )

  console.log('generated tokens created: ', {
    access_token,
    refresh_token,
    expires_in: config.TOKEN_EXPIRY,
    refresh_expires_in: config.REFRESHTOKEN_EXPIRY
  })
  try {
    await cleanupTokens()
  } catch (error) {
    console.error('caught error cleaning up tokens', error)
  }

  await insertToken(jwt.decode(refresh_token))
  return {
    access_token,
    refresh_token,
    expires_in: config.TOKEN_EXPIRY,
    refresh_expires_in: config.REFRESHTOKEN_EXPIRY
  }
}

/*
  logout token
*/
export const logout = async (token: IToken): Promise<boolean> => {
  console.debug(
      `BACKEND.logout() called for userName ${String(token.userName)} jti ${token.jti}`
  )

  await deleteToken(token.jti)
  return true
}
