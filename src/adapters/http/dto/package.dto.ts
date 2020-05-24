export interface TPackageInput {
  _id: string,
  name: string,
  description: string,
  version?: string,
  deprecated?: string,
  ["dist-tags"]: {
    [key: string]: string
  },
  versions: {
    [key: string]: Omit<TPackageInput, '_attachments'>,
  },
  readme: string,
  maintainers: { name: string, email: string }[],
  _attachments?: {
    [key: string]: {
      content_type: string,
      data: string,
      length: number,
    }
  }
}

export interface TPackageNormalizeOutput {
  ok: boolean,
}