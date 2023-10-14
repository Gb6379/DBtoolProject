import { StringUtils } from '../../utils/string-utils';
import { existsSync, mkdirSync, rmdirSync } from 'fs';
import { ApplicationFolders, ClassNames, NestFileModuleWriterRequest } from '../types';

export abstract class BaseNestModuleWriterService {
  protected tableName!: string;
  #singularName!: string;
  #directory = 'modules';
  protected classNames!: ClassNames;

  constructor({ singularName, tableName }: NestFileModuleWriterRequest) {
    this.tableName = tableName;
    this.#singularName = singularName ?? tableName.slice(0, -1);
    this.classNames = this.#getClassNamesByTableName();
  }

  protected async createFolders(): Promise<void> {
    const { folderNames } = this.#getDirs(this.classNames.fileName);

    const removePreviousDir = async () => {
      if (existsSync(folderNames[0]))
        rmdirSync(folderNames[0], { recursive: true });
    };

    const createFolders = async () => {
      folderNames.forEach((it) => {
        if (!existsSync(it)) {
          mkdirSync(it);
        }
      });
    };

    await removePreviousDir();
    await createFolders();
  }

  #getDirs(fileName: string): ApplicationFolders {
    return {
      folderNames: [
        this.#directory,
        `${this.#directory}/${fileName}`,
        `${this.#directory}/${fileName}/api`,
        `${this.#directory}/${fileName}/database`,
        `${this.#directory}/${fileName}/domain`
      ],
      folderPositions: {
        CLASS_FOLDER: 1,
        API_FOLDER: 2,
        DATABASE_FOLDER: 3,
        DOMAIN_FOLDER: 4
      }
    };
  }

  #getClassNamesByTableName(): ClassNames {
    const fileName = this.tableName.toLowerCase().replace('_', '-');
    const partialClassName = StringUtils.snakeToCamel(this.tableName);
    const capitalizedPartialClassName =
      StringUtils.capitalizeFirstLetter(partialClassName);
    const singularNameNormalized = StringUtils.normalizeCapitalized(
      this.#singularName
    );

    const {
      folderNames,
      folderPositions: { DOMAIN_FOLDER, DATABASE_FOLDER, API_FOLDER }
    } = this.#getDirs(fileName);

    return {
      partialClassName,
      fileName,
      entityName: `${capitalizedPartialClassName}Entity`,
      database: {
        repository: {
          className: `Typeorm${singularNameNormalized}Repository`,
          directory: `${folderNames[DATABASE_FOLDER]}/typeorm-${fileName}.repository.ts`,
          importName: `typeorm-${fileName}.repository`
        },
        entity: {
          className: `${singularNameNormalized}Entity`,
          directory: `${
            folderNames[DATABASE_FOLDER]
          }/${this.#singularName.replace('_', '-')}.entity.ts`,
          importName: `${this.#singularName.replace('_', '-')}.entity`
        }
      },
      api: {
        providers: {
          className: `${StringUtils.uncapitalizedFirstLetter(
            singularNameNormalized
          )}Providers`,
          directory: `${folderNames[API_FOLDER]}/${fileName}.providers.ts`,
          importName: `./${fileName}.providers`
        },
        module: {
          className: `${singularNameNormalized}Module`,
          directory: `${folderNames[API_FOLDER]}/${fileName}.module.ts`
        },
        service: {
          className: `${singularNameNormalized}Service`,
          directory: `${folderNames[API_FOLDER]}/${fileName}.service.ts`,
          importName: `./${fileName}.service`
        }
      },
      domain: {
        class: {
          className: `${singularNameNormalized}`,
          directory: `${
            folderNames[DOMAIN_FOLDER]
          }/${this.#singularName.replace('_', '-')}.ts`
        },
        repository: {
          className: `I${singularNameNormalized}Repository`,
          directory: `${folderNames[DOMAIN_FOLDER]}/${fileName}-repository.interface.ts`,
          importName: `${fileName}-repository.interface`
        },
        service: {
          className: `I${singularNameNormalized}Service`,
          directory: `${folderNames[DOMAIN_FOLDER]}/${fileName}-service.interface.ts`,
          importName: `${fileName}-service.interface`
        }
      }
    };
  }
}
