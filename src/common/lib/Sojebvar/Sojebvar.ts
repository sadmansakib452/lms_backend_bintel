/**
 * Variable parser
 * @example
 *  const text = 'my name is ${name} and I am ${age} years old';
 *  Sojebvar.addVariable({
 *    name: 'sojeb',
 *    age: 20,
 *  });
 * $text = Sojebvar.parse(text);
 * @author Sojeb Sikder <sojebsikder@gmail.com>
 */
export class Sojebvar {
  private static _variables: any[] = [];

  /**
   * Set custom variable values
   * @param vars
   */
  static addVariable(vars: object) {
    this._variables.push(vars);
  }

  /**
   * Get custom variable values
   * @returns
   */
  static getVariable() {
    return this._variables;
  }

  /**
   * Parse text
   * ${name} -> sojeb
   * @param text
   */
  static parse(text: string) {
    let parsedText = text;

    const pattern = /\${\s*(.+?)\s*\}/g;
    const matches = parsedText.matchAll(pattern);

    for (const match of matches) {
      // ${name}
      const patternMatch = match[0];
      // name
      const patternMatchValue = match[1];

      for (const variable of this._variables) {
        const entries = Object.entries(variable);
        entries.map(([key, val]) => {
          switch (patternMatchValue) {
            case key:
              parsedText = parsedText.replace(patternMatch, val.toString());
              break;
            default:
              break;
          }
        });
      }
    }

    return parsedText;
  }
}
