import config from '../configs'
import fs from 'fs'
import jwt from 'jsonwebtoken'
import { type Request } from 'express'
import { getTokenByJti } from '../db'
import { type IToken } from '../interfaces/token.interface'

export const verifyToken = async (http_request: Request): Promise<IToken> => {
  console.debug('UTIL.verifyToken verifying token')

  if (!http_request?.headers || !http_request?.headers?.authorization) {
    throw Object.assign(new Error(), {
      status: 401,
      message: 'errors.unauthorized',
      error: new Error('no token passed')
    })
  }
  let token: IToken
  // check if token is valid
  try {
    const authorization_header = http_request.headers.authorization.substring(
      7,
      http_request.headers.authorization.length
    )

    let sslCertFile = fs.readFileSync(String(config.TOKEN_SERVICE_SSL_KEY))
    sslCertFile = Buffer.from(sslCertFile as any, 'utf-8') as any
    token = jwt.verify(
      authorization_header,
      Buffer.from(sslCertFile).toString('ascii'),
      {
        algorithms: config.JWTCONFIG.algorithm
        // issuer: CONFIG.JWTCONFIG.issuer,
      } as any
    ) as any
  } catch (error) {
    console.error('error in UTIL.verifyToken ', error)
    throw Object.assign(new Error(), {
      status: 401,
      message: 'errors.unauthorized',
      error: new Error('token verification failed')
    })
  }
  // check if this token jti actually exists in DB
  try {
    const tokenInDB = await getTokenByJti(token.jti)
    if (!tokenInDB) {
      throw new Error('token jti not found in DB')
    }
  } catch (error) {
    console.error('error in UTIL.verifyToken ', error)
    throw Object.assign(new Error(), {
      status: 401,
      message: 'errors.unauthorized',
      error: new Error('token not found')
    })
  }
  return token
}
