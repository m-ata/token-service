import { checkPassword, ssha } from '../utils'
import { getCode, getUserByField, updateUser } from '../db'
import { type UserOption } from '../interfaces/user.interface'
import { type ICode } from '../interfaces/code.interface'

export const authenticateUser = async (options: UserOption): Promise<any> => {
  const { userName, userPassword, refreshToken = false } = options
  let response: any
  if (userName?.match(/^admin#/)) {
    response = await getUserByField('userName', 'admin')
    const organisationId = userName.replace(/^admin#/, '')
    response = {
      ...response,
      organisationId: +organisationId,
      source: 'admin'
    }
  } else {
    response = await getUserByField('userName', userName)
    response = {
      ...response,
      source: 'userName'
    }
  }

  if (!response?.userId) {
    response = await getUserByField('email', userName)
    response = {
      ...response,
      source: 'email'
    }
  }

  if (!response?.userId) {
    response = await getUserByField('organisationId', userName)
    response = {
      ...response,
      source: 'organisationId'
    }
  }

  if (!response?.userId) {
    throw new Error('invalid user specified')
  }

  if (
    !refreshToken &&
    response.source !== 'organisationId' &&
    !response.userPassword
  ) {
    console.log(
      'User had no previous password set, setting the one he specified'
    )
    const sshapassword = ssha(userPassword)
    await updateUser({
      userId: response.userId,
      organisationId: response.organisationId,
      userPassword: sshapassword
    })
    return response
  }
  console.log(response)
  if (refreshToken || checkPassword(userPassword, response.userPassword)) {
    return response
  }
  throw new Error('invalid password')
}

export const authenticateCode = async (options: ICode): Promise<any> => {
  console.debug('BACKEND.authenticateCode() called with', {
    ...options,
    code: options.code ? 'readacted' : null
  })
  const { code } = options
  const result = await getCode(code)

  if (!result) {
    throw new Error('invalid code specified')
  }

  console.log('got code result', result)

  return result
}
