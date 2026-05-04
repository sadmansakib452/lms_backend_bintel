/**
 * StringHelper
 * @class StringHelper
 * @author Sojeb Sikder <sojebsikder@gmail.com>
 */
export class StringHelper {
  // public static randomString(length: number = 32): string {
  //   const randomName = Array(length)
  //     .fill(null)
  //     .map(() => Math.round(Math.random() * 16).toString(16))
  //     .join('');
  //   return randomName;
  // }

  public static randomString(length: number = 8): string {
    const now = Date.now().toString(36);
    const remainingLength = Math.max(length - now.length, 0);

    const randomPart = Array(remainingLength)
      .fill(null)
      .map(() => Math.floor(Math.random() * 36).toString(36))
      .join('');

    const result = (now + randomPart).slice(0, length);
    return result;
  }

  /**
   * Capitalize the first letter of a string.
   * @param string
   * @returns
   */
  public static cfirst(string: string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  /**
   * Uncapitalize the first letter of a string.
   * @param string
   * @returns
   */
  public static ucfirst(string: string) {
    return string.charAt(0).toLowerCase() + string.slice(1);
  }

  public static trim(str: string, chr: string) {
    const rgxtrim = !chr
      ? new RegExp('^\\s+|\\s+$', 'g')
      : new RegExp('^' + chr + '+|' + chr + '+$', 'g');
    return str.replace(rgxtrim, '');
  }
  public static rtrim(str: string, chr: string) {
    const rgxtrim = !chr ? new RegExp('\\s+$') : new RegExp(chr + '+$');
    return str.replace(rgxtrim, '');
  }
  public static ltrim(str: string, chr: string) {
    const rgxtrim = !chr ? new RegExp('^\\s+') : new RegExp('^' + chr + '+');
    return str.replace(rgxtrim, '');
  }

  // get read time in minutes
  public static getReadTime(text: string, wordsPerMinute: number = 200) {
    const words = text.split(/\s+/g).length;
    const minutes = Math.ceil(words / wordsPerMinute);
    return minutes;
  }

  // pad string to a fixed length
  // example: strPad('123', 10, '0', 'left') => '000000123'
  public static strPad(
    input: string,
    length: number,
    padString: string = ' ',
    padType: 'left' | 'right' | 'both' = 'right',
  ) {
    input = String(input); // Ensure the input is a string

    if (input.length >= length) {
      return input; // No padding needed
    }

    const padLength = length - input.length;
    const padding = padString
      .repeat(Math.ceil(padLength / padString.length))
      .substring(0, padLength);

    switch (padType) {
      case 'left':
        return padding + input;
      case 'both':
        const leftPad = Math.floor(padLength / 2);
        const rightPad = padLength - leftPad;
        return (
          padString
            .repeat(Math.ceil(leftPad / padString.length))
            .substring(0, leftPad) +
          input +
          padString
            .repeat(Math.ceil(rightPad / padString.length))
            .substring(0, rightPad)
        );
      case 'right':
      default:
        return input + padding;
    }
  }
}
