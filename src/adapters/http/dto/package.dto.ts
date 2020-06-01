export interface TPackageInput {
  "_id": string,
  "name": string,
  "description": string,
  "dist-tags": {
    "latest": string,
    [key: string]: string,
  },
  "versions": {
    [key: string]: {
      "name": string,
      "version": string,
      "description": string,
      "scripts"?: {
        [key: string]: string,
      },
      "keywords"?: string[],
      "license": string,
      "readme": string,
      "_id": string,
      "_nodeVersion": string,
      "_npmVersion": string,
      "dist": {
        "integrity": string,
        "shasum": string,
        "tarball": string
      },
      "repository"?: {
        "type": string,
        "url": string
      },
      "engines"?: {
        [key: string]: string
      },
      "author"?: string | {
        "name": string,
        "url": string
      },
      "bugs"?: string | {
        "url": string
      },
      "homepage"?: string,
      "dependencies"?: { [key: string]: string },
      "devDependencies"?: { [key: string]: string },
      "peerDependencies"?: { [key: string]: string },
      "optionalDependencies"?: { [key: string]: string },
      "bundledDenpendencies"?: { [key: string]: string },
    }
  },
  "readme": string,
  "_attachments": {
    [key: string]: {
      "content_type": string,
      "data": string,
      "length": number
    }
  }
}

export interface TPackageNormalizeOutput {
  ok: boolean,
}