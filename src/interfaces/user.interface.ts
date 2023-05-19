export interface UserOption {
  userName: string
  userPassword: string
  refreshToken?: boolean
}
export interface IUser {
  organisationId: number
  userName?: string
  firstName?: string
  lastName?: string
  email?: string
  phoneNumber?: string
  configuration?: any
  initialUser?: boolean
  userPassword?: string
  userId?: string
  emailVerified?: boolean
  emailVerificationCode?: string
  camps?: string[]
  source?: string
  password?: string
  scope?: string
  name?: string
}
