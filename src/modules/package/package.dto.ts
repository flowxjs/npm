export interface TPackageVersions {
  [version: string]: string,
}

export interface TPackageInfomation {
  _id: string,
  description: string,
  homepage: string,
  keywords: string[],
  license: string,
  name: string,
  readme: string,
  version: string,
  author: {
    name: string,
    email: string,
  },
  maintainers: {
    name: string,
    email: string,
  }[],
  bugs: {
    url: string,
  },
  repository: string | { type: string, url: string },
  dependencies?: { [key: string]: string },
  devDependencies?: { [key: string]: string },
  peerDependencies?: { [key: string]: string },
  optionalDependencies?: { [key: string]: string },
  bundledDenpendencies?: { [key: string]: string },
  dist?: {
    integrity: string,
    shasum: string,
    tarball: string,
  },
  versions?: {
    [key: string]: TPackageInfomation
  },
  ['dist-tags']?: TPackageVersions,
  _rev: string,
  deprecated?: string
}