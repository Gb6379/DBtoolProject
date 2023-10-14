import { ApplicationDatabase } from '../../database/database';
import { SqlGeneratorProps } from '../types';

export class CreateInsertSqlService {
  private database = new ApplicationDatabase();

  async getInsertSqlStatement(props: SqlGeneratorProps): Promise<string> {
    try {
      const { tableName } = props;
      const selectValues = await this.database.selectByTableNameAndLimit(props);

      const insertStatements =
        selectValues.reduce((acc: string, row: ArrayLike<unknown>) => {
          const columns = Object.keys(row).reduce(
            (acc, column, idx, elements) =>
              (acc += `[${column}]${idx + 1 !== elements.length ? ', ' : ''}`),
            ''
          );

          const values = this.#mapValuesToInsertQuery(row);
          acc += `INSERT INTO ${tableName} (${columns}) VALUES (${values});\r\n`;

          return acc;
        }, `------------ INSERT DATA INTO ${tableName} ------------\r\n` + `SET IDENTITY_INSERT ${tableName} ON;\r\n`) +
        `SET IDENTITY_INSERT ${tableName} OFF;`;

      return insertStatements;
    } catch (error) {
      console.error('Error:', error);
      throw error;
    }
  }

  #mapValuesToInsertQuery(row: ArrayLike<unknown>): string {
    return Object.values(row)
      .map((value) => {
        if (value === null) {
          return 'null';
        }
        if (value instanceof Date) {
          const datePersonalized = new Date(value);
          const dateFormate = datePersonalized.toISOString();
          return `'${dateFormate}'`;
        }
        if (typeof value === 'boolean') {
          return value === true ? 1 : 0;
        }
        if (typeof value === 'string') {
          return `N'${value.replace(/'/g, "''")}'`;
        }
        return value;
      })
      .join(', ');
  }
}
