export interface ColumnConstraints {
  keyName: string;
  keyType: string;
  columnName: string;
}

export interface ColumPartialInfo {
  columnName: string;
  columnType: string;
  columnLength: number | null;
  isNullable: string;
}

export type TableNameAndSchema = Record<
  string,
  { tableName: string; schemaName: string }
>;

export interface CompleteColumnInfo {
  precision?: string;
  columnName: string;
  columnType: string;
  isForeignKey: string;
  isPrimary: string;
  columnLength: number | null;
  isNullable: string;
  tableName: string;
  columnDefaultValue?: string;
  schemaName: string;
  referencedTableName?: string;
  columnDefault?: string;
}

export interface ColumnInfo extends ColumPartialInfo {
  keyName?: string;
  keyType?: string;
  referenceColumnName?: string;
  referenceTableName?: string;
}

export interface ForeignKeyColumn {
  keyName: string;
  columnName: string;
  referenceTableName: string;
  referenceColumnName: string;
}
