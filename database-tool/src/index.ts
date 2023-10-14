import { SqlGeneratorBuilder } from './service/qsl-data-export/sql-generator.builder';
import { NestModuleWriterService } from './service/nest-module-writer/nest-module-writer.service';
import {
  NestFileModuleWriterRequest,
  SqlGeneratorProps
} from './service/types';
import { DatabaseComparerService } from './service/database-comparer.service';

(async (): Promise<void> => {
  const tablesNames: SqlGeneratorProps[] = [
    {
      tableName: 'customers',
      limit: 30,
      where:
        'WHERE id IN( select top 100 ac.customer from analysts_customers ac where analyst = 13605) ORDER BY id ASC'
    }
  ];

  const tables: NestFileModuleWriterRequest[] = [
    {
      tableName: 'permissions_desc',
      singularName: 'permission_desc'
    }
  ];

  //Create NestJS Modules Based on tableName
  await Promise.all(
    tables.map(async (it) =>
      new NestModuleWriterService(it).writeNestModulesByTableName()
    )
  );

  // Create Sql Statements Insert and Create table with Indexes and Triggers
  await Promise.all(
    tablesNames.map(
      async (it) =>
        await new SqlGeneratorBuilder(it.tableName)
          .withCreateTableSql()
          .withInsertSql(it)
          .buildAndWriteSql()
    )
  );

  //Compare columns of database TODO- compare indexes and triggers
  await new DatabaseComparerService({
    ignoredTables: ['sessionStatus'],
    ignoredErrors: { fk: true }
  }).verifyDataBaseIntegrity();
})();
