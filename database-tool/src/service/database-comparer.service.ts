import { writeFileSync } from 'fs';
import { testDataSource } from '../database/data-source';
import { ApplicationDatabase } from '../database/database';
import {
  CompleteColumnInfo,
  TableNameAndSchema
} from '../database/database-interfaces';

type IgnoredErrors = {
  fk?: boolean;
  pk?: boolean;
};

export type DataBaseCompareProps = {
  ignoredTables?: string[];
  ignoredErrors?: IgnoredErrors;
};

export class DatabaseComparerService {
  #dataBase: ApplicationDatabase = new ApplicationDatabase();
  #errors: string[] = [];
  #ignoredTables: Set<string>;
  #ignoredErrors?: IgnoredErrors;

  constructor({ ignoredTables, ignoredErrors }: DataBaseCompareProps) {
    this.#ignoredTables = new Set([...(ignoredTables ?? [])]);
    this.#ignoredErrors = ignoredErrors;
  }

  async verifyDataBaseIntegrity() {
    const devDtSource = await testDataSource();

    const dboTableNames = this.validateDboTablesExistOnApp(
      await this.#dataBase.getAllTableNamesByDatabase(devDtSource),
      await this.#dataBase.getAllTableNamesByDatabase()
    );

    const appColumnsInfo = await this.#dataBase.getColumnsInfo(dboTableNames);
    const devColumnsInfo = await this.#dataBase.getColumnsInfo(
      dboTableNames,
      devDtSource
    );

    for (const [key, appValues] of Object.entries(appColumnsInfo)) {
      const devValues = devColumnsInfo[key];
      this.verifyIfColumnExists(devValues, appValues, 'Application');
      this.verifyIfColumnExists(appValues, devValues, 'Test');
      this.verifyColumnTypes(devValues, appValues);
    }

    if (this.#errors.length >= 1) {
      writeFileSync(
        'errors.txt',
        this.#errors.reduce((acc, it) => (acc += it + '\r\n'), '')
      );
    }

    console.log('FINISHED');
  }

  validateDboTablesExistOnApp(
    dev: TableNameAndSchema,
    app: TableNameAndSchema
  ) {
    return Object.entries(dev).reduce(
      (acc, [key, { schemaName, tableName }]) => {
        if (schemaName == 'dbo') {
          !app[key]
            ? this.#errors.push(
                `TABLE_VALIDATION_ERROR on Table '${schemaName}.${tableName}' DOESN'T EXISTS ON APPLICATION`
              )
            : acc.push(tableName);
        }

        return acc;
      },
      [] as string[]
    );
  }

  verifyIfColumnExists(
    devTableInfo: CompleteColumnInfo[],
    appTableInfo: CompleteColumnInfo[],
    target: string
  ) {
    devTableInfo.forEach((element) => {
      const toCompare = appTableInfo.find(
        (val) => element.columnName == val.columnName
      );

      if (!toCompare) {
        this.#errors.push(
          `COLUMN_NOT_EXISTS_ERROR on Table ${element.tableName} ${element.columnName} doesn't exist on ${target} database`
        );
      }
    });
  }

  verifyColumnTypes(app: CompleteColumnInfo[], dev: CompleteColumnInfo[]) {
    const errorMessages: string[] = [];

    for (const it of app) {
      if (this.#ignoredTables.has(it.columnName)) continue;

      const toCompare = dev.find((val) => val.columnName == it.columnName);

      if (this.#ignoredTables.has(it.tableName) || !toCompare) {
        continue;
      }

      const keys = Object.keys(it) as Array<keyof CompleteColumnInfo>;
      for (const key of keys) {
        const compare = it[key];
        const toCompar = toCompare[key];

        if (
          (this.#ignoredErrors?.fk && key == 'isForeignKey') ||
          key == 'referencedTableName'
        ) {
          continue;
        }

        if (compare !== toCompar) {
          errorMessages.push(
            `COLUMN_TYPE_VALIDATION_ERROR on Table '${it.tableName}' ERROR TYPE: ${key} at Column '${it.columnName}' expect ${toCompar} received ${compare}`
          );
        }
      }
    }

    if (errorMessages.length >= 1) {
      errorMessages.forEach((it) => this.#errors.push(it));
      this.#errors.push('');
    }
  }
}
