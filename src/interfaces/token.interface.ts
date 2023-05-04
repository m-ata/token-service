export interface ITokenPayload {
    client_id: string;
    grant_type?: string;
    password?: string;
    userPassword?: string;
    username?: string;
    code?: string;
    refresh_token?: string;
}

export interface IToken {
    typ: string;
    nbf: number;
    scope: string;
    code: string;
    organisationId: number;
    stayId: string;
    campId: string;
    iat: string;
    exp: string;
    aud: string;
    iss: string;
    sub: string;
    jti: string;
}

export interface ITokenResponse {
    access_token: string;
    refresh_token: string;
    expires_in: string | number;
    refresh_expires_in: string | number;
}

export interface IJwtConfig {
    algorithm: string;
    audience?: string;
    issuer?: string;
    noTimestamp?: false;
}