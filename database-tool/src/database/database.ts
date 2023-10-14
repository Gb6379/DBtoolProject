import 'reflect-metadata';
import { DataSource } from 'typeorm';

import {
  ColumPartialInfo,
  ColumnInfo,
  CompleteColumnInfo,
  ForeignKeyColumn,
  TableNameAndSchema
} from './database-interfaces';
import { applicationDataSource } from './data-source';
import { Queries } from '../utils/queries';
import { SqlGeneratorProps } from 'src/service/types';

export class ApplicationDatabase {
  async getTableInfoAndConstraints(tableName: string): Promise<ColumnInfo[]> {
    const tableInfo = await this.getTableInfoByName(tableName);
    const tablePk = await this.getTablePrimaryKey(tableName);
    const tableFk = await this.getTableForeignKeys(tableName);

    return (tableInfo as ColumnInfo[]).map((it) => {
      if (it.columnName === tablePk) it['keyType'] = 'PRIMARY KEY';

      const matchingConstraint = tableFk.find(
        ({ columnName }) => it.columnName === columnName
      );

      if (matchingConstraint) {
        it['keyName'] = matchingConstraint.keyName;
        it['keyType'] = 'FOREIGN KEY';
        it['referenceTableName'] = matchingConstraint.referenceTableName;
      }

      return it;
    });
  }

  async getAllTableNamesByDatabase(
    dataSource: DataSource | null = null
  ): Promise<TableNameAndSchema> {
    return (dataSource ?? (await applicationDataSource()))
      .query(
        `
      SELECT
        schema_name(tab.schema_id) as schemaName,
        tab.name as tableName
      FROM
        sys.tables as tab
      ORDER BY
        tableName
      `
      )
      .then((resp: { schemaName: string; tableName: string }[]) =>
        resp.reduce<TableNameAndSchema>((acc, { schemaName, tableName }) => {
          acc[schemaName + tableName] = { tableName, schemaName };
          return acc;
        }, {})
      );
  }

  async getTablePrimaryKey(
    tableName: string,
    dataSource: DataSource | null = null
  ): Promise<string> {
    return await (
      dataSource ?? (await applicationDataSource())
    ).createQueryRunner().query(`
    SELECT
      COLUMN_NAME as columnName
    FROM
      INFORMATION_SCHEMA.KEY_COLUMN_USAGE
    WHERE
      OBJECTPROPERTY(OBJECT_ID(CONSTRAINT_SCHEMA + '.' + QUOTENAME(CONSTRAINT_NAME)),
      'IsPrimaryKey') = 1
      AND TABLE_NAME = '${tableName}';
    `);
  }

  async getTableForeignKeys(
    tableName: string,
    dataSource: DataSource | null = null
  ): Promise<ForeignKeyColumn[]> {
    return await (
      dataSource ?? (await applicationDataSource())
    ).createQueryRunner().query(`
    SELECT
      fk.name AS keyName,
      pc.name AS columnName,
      rt.name AS referenceTableName,
      c.name AS referenceColumnName
    FROM sys.foreign_key_columns AS fkc
    INNER JOIN sys.foreign_keys AS fk ON fkc.constraint_object_id = fk.object_id
    INNER JOIN sys.tables AS t ON fkc.parent_object_id = t.object_id
    INNER JOIN sys.tables AS rt ON fkc.referenced_object_id = rt.object_id
    INNER JOIN sys.columns AS pc ON fkc.parent_object_id = pc.object_id
      AND fkc.parent_column_id = pc.column_id
    INNER JOIN sys.columns AS c ON fkc.referenced_object_id = c.object_id
      AND fkc.referenced_column_id = c.column_id
    WHERE t.name = '${tableName}';
    `);
  }

  async getTableInfoByName(
    tableName: string,
    dataSource: DataSource | null = null
  ): Promise<ColumPartialInfo[]> {
    return await (dataSource ?? (await applicationDataSource()))
      .createQueryBuilder()
      .select(
        `
        isc.COLUMN_NAME as columnName,
        isc.DATA_TYPE as columnType,
        isc.CHARACTER_MAXIMUM_LENGTH as columnLength,
        isc.IS_NULLABLE as isNullable,
        isc.TABLE_NAME as tableName,
        isc.COLUMN_DEFAULT as columnDefaultValue,
        isc.TABLE_SCHEMA as tableSchema
    `
      )
      .from('INFORMATION_SCHEMA.COLUMNS', 'isc')
      .where('TABLE_NAME = :tableName', { tableName: tableName })
      .getRawMany();
  }

  async getTablesInfoByName(
    tableName: string[],
    dataSource: DataSource | null = null
  ): Promise<ColumPartialInfo[]> {
    return await (dataSource ?? (await applicationDataSource()))
      .createQueryBuilder()
      .select(
        `
        isc.COLUMN_NAME as columnName,
        isc.DATA_TYPE as columnType,
        isc.CHARACTER_MAXIMUM_LENGTH as columnLength,
        isc.IS_NULLABLE as isNullable,
        isc.TABLE_NAME as tableName,
        isc.COLUMN_DEFAULT as columnDefaultValue,
        isc.TABLE_SCHEMA as tableSchema
        `
      )
      .from('INFORMATION_SCHEMA.COLUMNS', 'isc')
      .where('TABLE_NAME IN (:...tableName)', { tableName: tableName })
      .getRawMany();
  }

  async getColumnsInfo(
    tableNames: string[],
    dataSource: DataSource | null = null
  ): Promise<Record<string, CompleteColumnInfo[]>> {
    const params = tableNames.reduce(
      (acc, it, idx, list) =>
        (acc += `'${it}'${idx + 1 < list.length ? ',' : ''}`),
      ' '
    );
    const resp = (await (dataSource ?? (await applicationDataSource())).query(`
    SELECT
    c.CHARACTER_MAXIMUM_LENGTH  AS columnLength,
    c.COLUMN_NAME               AS columnName,
    c.DATA_TYPE                 AS columnType,
    c.TABLE_SCHEMA              AS schemaName,
    c.COLUMN_DEFAULT            AS columnDefault,
    c.TABLE_NAME                AS tableName,
    c.NUMERIC_PRECISION         AS precision,
    k.COLUMN_NAME               AS referencedTableName,
    c.COLLATION_NAME 			      AS collations,
    k.CONSTRAINT_NAME 		    	AS constraintName,
    CASE WHEN c.COLUMN_NAME IN ( SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE WHERE TABLE_NAME IN ( ${params}) AND CONSTRAINT_NAME LIKE 'FK_%')
    THEN 1 ELSE 0 END   AS isForeignKey,
    CASE WHEN c.IS_NULLABLE = 'YES' THEN 1 ELSE 0 END AS isNullable,
    CASE WHEN pk.COLUMN_NAME IS NOT NULL THEN 1 ELSE 0 END AS isPrimary
    FROM INFORMATION_SCHEMA.COLUMNS c
    LEFT JOIN (
        SELECT
            ku.TABLE_NAME,
            ku.COLUMN_NAME
        FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE ku
        JOIN INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc ON
            ku.CONSTRAINT_NAME = tc.CONSTRAINT_NAME
        WHERE tc.CONSTRAINT_TYPE = 'PRIMARY KEY'
    ) pk ON c.TABLE_NAME = pk.TABLE_NAME AND c.COLUMN_NAME = pk.COLUMN_NAME
    LEFT JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE k ON
        c.TABLE_NAME = k.TABLE_NAME AND c.COLUMN_NAME = k.COLUMN_NAME
    LEFT JOIN INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS rc ON
        k.CONSTRAINT_NAME = rc.CONSTRAINT_NAME
    WHERE c.TABLE_NAME IN ( ${params} )
    `)) as CompleteColumnInfo[];

    return resp.reduce((acc, it) => {
      const key = `${it.schemaName}+${it.tableName}`;
      it.columnDefault = it.columnDefault
        ?.replace('((', '(')
        .replace('))', ')');

      if (!acc[key]) acc[key] = [];

      acc[key].push(it);
      return acc;
    }, {} as Record<string, CompleteColumnInfo[]>);
  }

  async selectByTableNameAndLimit({
    tableName,
    limit,
    where
  }: SqlGeneratorProps) {
    const query = `SELECT TOP ${limit ?? 100} * FROM ${tableName} ${
      where ?? ''
    } ;`;
    const resp = (await applicationDataSource()).query(query);
    return resp;
  }

  async generateTableDLL(tableName: string): Promise<any> {
    const procedureExist = await this.doesStoredProcedureExist('sp_getddl');
    if (procedureExist) {
      const query = `EXEC sp_getddl @TBL = '${tableName}'`;
      const resp = await (await applicationDataSource()).query(query);
      return await resp[0];
    } else {
      this.createGetDDLProcedure();
    }
  }

  async createGetDDLProcedure(schemaName: string | null = 'dbo'): Promise<any> {
    const query = await new Queries().getDDLQuery(schemaName);
    const resp = (await applicationDataSource()).query(query);
    console.log(resp);
    return resp;
  }

  async doesStoredProcedureExist(procedureName: string): Promise<boolean> {
    const result = await (
      await applicationDataSource()
    ).query(`
    SELECT COUNT(1) as count
    FROM sys.procedures
    WHERE name = '${procedureName}'
    `);
    const procedureExist = result[0].count > 0;

    return procedureExist;
  }
}
