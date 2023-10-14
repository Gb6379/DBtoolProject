import { ApplicationDatabase } from '../../database/database';

export class CreateTableSqlService {
  private database = new ApplicationDatabase();

  async getCreateTableSql(tableName: string): Promise<string> {
    try {
      const ddl = await this.database.generateTableDLL(tableName);

      const ddlStr = Object.values(ddl).reduce(
        (acc: string, it: unknown) => (acc += it as string),
        `------------ CREATE TABLE ${tableName} ------------ \r\n\r\n`
      );

      return ddlStr;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }
}
