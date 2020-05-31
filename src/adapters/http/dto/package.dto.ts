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
      "scripts": {
        [key: string]: string,
      },
      "keywords": string[],
      "license": string,
      "devDependencies": {
        [key: string]: string,
      },
      "readme": string,
      "_id": string,
      "_nodeVersion": string,
      "_npmVersion": string,
      "dist": {
        "integrity": string,
        "shasum": string,
        "tarball": string
      }
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