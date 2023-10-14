import { ColumnInfo } from 'src/database/database-interfaces';

export type SqlGeneratorProps = {
  tableName: string;
  limit?: number | 1000;
  where?: string;
};

export type InsertSqlProps = Pick<SqlGeneratorProps, 'limit' | 'where'>;

export type NestFileModuleWriterRequest = {
  tableName: string;
  singularName?: string;
};

export type TableProps = {
  typescriptType: string;
  isForeign: boolean;
  normalizedName: string;
  classPropertyDecorator: string;
};

export type ColumnParams = {
  it: ColumnInfo;
  columnName: string;
  columnDataType: string;
  columSize: string;
  columnNullable: string;
  isForeign: boolean;
};

export type ApplicationFolders = {
  folderNames: string[];
  folderPositions: {
    CLASS_FOLDER: 1;
    API_FOLDER: 2;
    DATABASE_FOLDER: 3;
    DOMAIN_FOLDER: 4;
  };
};

export type ClassInfo = {
  className: string;
  directory: string;
  importName: string;
};

export type ClassNames = {
  partialClassName: string;
  fileName: string;
  entityName: string;
  api: {
    providers: ClassInfo;
    module: Omit<ClassInfo, 'interfaceName' | 'importName'>;
    service: ClassInfo;
  };
  database: {
    repository: ClassInfo;
    entity: ClassInfo;
  };
  domain: {
    repository: ClassInfo;
    service: ClassInfo;
    class: {
      className: string;
      directory: string;
    };
  };
};
