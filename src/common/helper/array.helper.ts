export class ArrayHelper {
  /**
   * check if element is in array or not
   * @param needle
   * @param haystack
   * @returns
   */
  public static inArray(needle: any, haystack: any[]) {
    const length = haystack.length;
    for (let i = 0; i < length; i++) {
      if (haystack[i] == needle) return true;
    }
    return false;
  }
}
