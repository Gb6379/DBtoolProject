import { StringUtils } from '../../utils/string-utils';
import { CompleteColumnInfo } from '../../database/database-interfaces';
import { TableProps } from '../types';

export class TypeormEntityInformationService {
  getClassInformation(it: CompleteColumnInfo): TableProps {
    const isNullable = new Boolean(it.isNullable).valueOf();
    const isForeign = new Boolean(it.isForeignKey).valueOf();
    const columnDefault = it.columnDefault
      ? `, default: ${it.columnDefault.replace('(', '').replace(')', '')}`
      : '';

    const precisionProp = this.#needPrecisionProperty(it.columnType)
      ? `, precision: ${it.precision}`
      : '';

    let normalizedName = StringUtils.stringNormalizer(it.columnName);

    isNullable ? (normalizedName += '?') : (normalizedName += '!');

    const columnPropertyDecorator = `@Column({ name: '${
      it.columnName
    }', type: '${it.columnType}'${this.#getColumnLength(
      it
    )}${columnDefault}${precisionProp}, nullable: ${isNullable} })`;
    let classPropertyDecorator!: string;

    if (it.columnName == 'id') {
      classPropertyDecorator = `@PrimaryGeneratedColumn('increment')`;
    } else if (it.columnName.includes('id') || isForeign) {
      classPropertyDecorator =
        columnPropertyDecorator +
        ` // TODDO MAP FOREIGN KEY ${it.referencedTableName}`;
    } else {
      classPropertyDecorator = columnPropertyDecorator;
    }

    return {
      typescriptType: this.#getTypescriptTypeByColumnType(it.columnType),
      isForeign,
      normalizedName,
      classPropertyDecorator
    };
  }

  #getColumnLength(it: CompleteColumnInfo) {
    if (it.columnLength) {
      const length =
        it.columnLength == -1 || it.columnLength > 5000
          ? "'max'"
          : it.columnLength;
      return this.#needLengthProperty(it.columnType)
        ? `, length: ${length}`
        : '';
    }

    return '';
  }
  #needLengthProperty(columnType: string): boolean {
    return (
      columnType != 'bit' &&
      columnType.indexOf('date') == -1 &&
      columnType.indexOf('int') == -1 &&
      columnType != 'float' &&
      columnType != 'money' &&
      columnType != 'real' &&
      columnType != 'text'
    );
  }

  #needPrecisionProperty(columnType: string) {
    return ['float', 'decimal'].includes(columnType);
  }

  #getTypescriptTypeByColumnType(columnType: string): string | never {
    let classPropertyName!: string;

    if (columnType.indexOf('char') != -1 || columnType.indexOf('text') != -1)
      classPropertyName = 'string';

    if (columnType.indexOf('date') != -1) classPropertyName = 'Date';

    if (
      columnType.indexOf('int') != -1 ||
      columnType == 'float' ||
      columnType == 'decimal' ||
      columnType == 'money' ||
      columnType == 'real'
    )
      classPropertyName = 'number';

    if (columnType == 'bit') classPropertyName = 'boolean';

    if (!classPropertyName)
      throw new Error(`Unrecognized column type: ${columnType}`);

    return classPropertyName;
  }
}
