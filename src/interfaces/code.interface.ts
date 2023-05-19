export interface ICode {
  code: string
}

export interface ICodeValue {
  organisationId?: number
  campId: string
  stayId: string
  code: string
  codeType?: string
  scope?: string
}
