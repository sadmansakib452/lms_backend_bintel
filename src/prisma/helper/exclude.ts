// Exclude keys from user
export class PrismaHelper {
  /**
   * exlcude field
   * @param user
   * @param keys
   * @returns
   */
  static exclude<T, Key extends keyof T>(user: T, keys: Key[]): Omit<T, Key> {
    for (const key of keys) {
      delete user[key];
    }
    return user;
  }
}
