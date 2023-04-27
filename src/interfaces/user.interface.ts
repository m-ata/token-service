export interface UserOption {
    userName: string;
    password: string;
    refreshToken?: boolean;
}
export interface IUser {
    organisationId: number;
    userName: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    configuration: Object;
    initialUser?: boolean;
    userPassword: string;
    userId: string;
    emailVerified?: boolean;
    emailVerificationCode?: string;
    camps: Array<any>; // will be strongly typed later
}