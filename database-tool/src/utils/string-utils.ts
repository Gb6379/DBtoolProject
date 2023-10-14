export class StringUtils {
  static capitalizeFirstLetter(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  static uncapitalizedFirstLetter(str: string): string {
    return str.charAt(0).toLocaleLowerCase() + str.slice(1);
  }

  static stringNormalizer(str: string): string {
    const isSnakeCase = str.indexOf('_') != -1;

    return isSnakeCase ? this.snakeToCamel(str) : this.pascalToCamel(str);
  }

  static normalizeCapitalized(str: string): string {
    return this.capitalizeFirstLetter(this.stringNormalizer(str));
  }

  static snakeToCamel(str: string): string {
    return str
      .toLowerCase()
      .replace(/([-_][a-z])/g, (group) =>
        group.toUpperCase().replace('-', '').replace('_', '')
      );
  }

  static pascalToCamel(str: string): string {
    return str.replace(/(\w)(\w*)/g, function (g0, g1, g2) {
      return g1.toLowerCase() + g2.toLowerCase();
    });
  }
}
