export interface TUpdateInput {
  close: boolean;
  registries: string[];
  domain: string;
  packageCacheExpireTime: number;
  loginType: string;
  scopes: string[];
}