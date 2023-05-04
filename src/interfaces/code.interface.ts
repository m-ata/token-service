export interface ICode {
    code: string;
}

export interface ICodeTokenPayload {
    organisationId?: number;
    campId: string;
    stayId: string;
    code: string;
    codeType?: string;
    scope?: string
}