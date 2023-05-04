export interface ITokenPayload {
    client_id: string;
    grant_type?: string;
    password?: string;
    userPassword?: string;
    username?: string;
    code?: string;
    refresh_token?: string;
}

export interface ICodeTokenPayload {
    organisationId?: number;
    campId: string;
    stayId: string;
    code: string;
    codeType?: string;
    scope?: string
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