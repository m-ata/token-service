import crypto from 'crypto'
import { type IUser } from '../interfaces/user.interface'
import { type ICodeTokenPayload } from '../interfaces/code.interface'

export const ssha = (cleartext: string, salt?: any): string => {
  const sum = crypto.createHash('sha1')
  if (!salt) {
    console.log('no salt given')
    salt = crypto.randomBytes(8).toString('hex')
  } else {
    salt = salt.toString('hex')
  }

  sum.update(cleartext)
  sum.update(salt, 'hex')
  const digest = sum.digest('hex')
  const ssha = '{SSHA}' + Buffer.from(digest + String(salt), 'hex').toString('base64')
  return ssha
}

// password check either they are equal or not
export const checkPassword = (password: string, hash: string): boolean => {
  if (hash.substr(0, 6) === '{SSHA}') {
    return checkSsha(password, hash)
  } else {
    return false
  }
}

// check hashes are eual or not
const checkSsha = (cleartext: string, hash: string): boolean => {
  if (hash.substr(0, 6) !== '{SSHA}') {
    console.error('Not a SSHA hash')
    return false
  }
  const bash = Buffer.from(hash.substr(6) as any, 'base64') as any
  const salt = bash.toString('hex').substr(40)
  const newSsha = ssha(cleartext, salt)
  return hash === newSsha
}

export const getCodeTokenPayload = (userData: ICodeTokenPayload): ICodeTokenPayload => {
  console.debug('BACKEND.getCodeTokenPayload() called with', {
    ...userData,
    code: userData.code ? 'readacted' : null
  })
  const payload = {
    scope: 'user profile',
    code: userData.code,
    organisationId: userData.organisationId,
    stayId: userData.stayId,
    campId: userData.campId
  }

  return payload
}

export const getTokenPayload = (userData: IUser): IUser => {
  console.debug('BACKEND.getTokenPayload() called with', {
    ...userData,
    password: userData.password ? 'readacted' : null
  })
  const payload = {
    firstName: userData.firstName,
    lastName: userData.lastName,
    name: `${String(userData.firstName)} ${String(userData.lastName)}`,
    scope: 'user profile',
    userName: userData.userName,
    email: userData.email,
    emailVerified: userData.emailVerified,
    userId: userData.userId,
    organisationId: userData.organisationId
  }

  return payload
}
