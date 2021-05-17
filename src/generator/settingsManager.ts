export type SettingsData = {
  prismaClientContextField: string
}

/**
 * Class to help users safely and intuitively change NexusPrisma's generator settings.
 */
export class SettingsManager {
  private data: SettingsData

  constructor() {
    this.data = {
      prismaClientContextField: 'prisma',
    }
  }

  /**
   * The name of the GraphQL context field to get an instance of Prisma Client from.
   *
   * This instance of Prisma Client is accessed in the default resolvers for relational fields.
   *
   * @default prisma
   */
  set prismaClientContextField(value: string) {
    this.data.prismaClientContextField = value
  }
}
