import { existsSync, mkdirSync, rmdirSync, writeFileSync } from 'fs';
import { CreateInsertSqlService } from './create-insert.-sql.service';
import { CreateTableSqlService } from './create-table-sql.service';
import { InsertSqlProps } from '../types';

export class SqlGeneratorBuilder {
  #directory = 'sqls';
  #tableName: string;
  #promises: Promise<string>[] = [];

  constructor(tableName: string) {
    this.#tableName = tableName;
  }

  withInsertSql({ limit, where }: InsertSqlProps) {
    this.#promises.push(
      new CreateInsertSqlService().getInsertSqlStatement({
        tableName: this.#tableName,
        limit,
        where
      })
    );

    return this;
  }

  withCreateTableSql() {
    this.#promises.push(
      new CreateTableSqlService().getCreateTableSql(this.#tableName)
    );

    return this;
  }

  async buildAndWriteSql() {
    this.#createCleanFolder();
    const sqls = await Promise.all(this.#promises);

    const fileName = `${this.#directory}/${this.#tableName
      .toLowerCase()
      .replace('_', '-')}.sql`;

    writeFileSync(fileName, sqls.join('\r\n\r\n\r\n'));
  }

  #createCleanFolder() {
    if (existsSync(this.#directory))
      rmdirSync(this.#directory, { recursive: true });

    mkdirSync(this.#directory);
  }
}
