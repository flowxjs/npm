export interface TUserLoginInput {
  _id: string,
  name: string,
  password: string,
  email: string,
  type: 'user',
  roles: [],
  date: Date
}

export interface TUserLoginOutput {
  ok: boolean,
  id: string,
  rev: string,
}

export interface TUserInfoOutput {
  account: string,
  name: string,
  email: string,
  avatar: string,
}