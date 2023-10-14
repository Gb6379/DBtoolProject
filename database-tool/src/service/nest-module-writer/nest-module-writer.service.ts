import { writeFileSync } from 'fs';
import { ApplicationDatabase } from '../../database/database';
import { TypeormEntityInformationService } from './typeorm-entity-information.service';
import { CompleteColumnInfo } from '../../database/database-interfaces';
import { BaseNestModuleWriterService } from './base-nest-module-writer.service';
import { NestFileModuleWriterRequest } from '../types';

export class NestModuleWriterService extends BaseNestModuleWriterService {
  #dataBase = new ApplicationDatabase();
  #classInformationService = new TypeormEntityInformationService();

  constructor(tableInput: NestFileModuleWriterRequest) {
    super(tableInput);
  }

  async writeNestModulesByTableName(): Promise<void> {
    await this.createFolders();
    const info = await this.#dataBase.getColumnsInfo([this.tableName]);
    const columnsInfo = info[`dbo+${this.tableName}`];

    if (!columnsInfo) {
      console.log(`ERROR CANT FIND TABLE WITH NAME ${this.tableName}`);
      return;
    }

    await this.#writeDatabaseFiles(columnsInfo);
    await this.#writeDomainFiles(columnsInfo);
    await this.#writeApiFiles();

    console.log(`FINISHED table ${this.tableName}`);
  }

  async #writeApiFiles() {
    this.#writeApiService();
    this.#writeApiProviders();
    this.#writeModule();
  }

  async #writeDomainFiles(columnsInfo: CompleteColumnInfo[]) {
    this.#writeDomainInterfaces();
    this.#writeDomainClass(columnsInfo);
  }

  async #writeDatabaseFiles(columnsInfo: CompleteColumnInfo[]) {
    this.#writeEntity(columnsInfo);
    this.#writeTypeormDatabaseClass();
  }

  #writeDomainInterfaces() {
    const {
      domain: { repository, service }
    } = this.classNames;
    const repoClassName = repository.className;
    const repositoryInterface = `export abstract class ${repoClassName} {}\n`;
    const serviceInterface =
      `import { ${repoClassName} } from './${repository.importName}';` +
      `\n\nexport abstract class ${service.className} extends ${repoClassName} {}\n`;

    writeFileSync(repository.directory, repositoryInterface);
    writeFileSync(service.directory, serviceInterface);
  }

  #writeDomainClass(columnsInfo: CompleteColumnInfo[]) {
    const classes = this.classNames;
    let classCreationStr = columnsInfo?.reduce((acc, it) => {
      const { normalizedName, typescriptType } =
        this.#classInformationService.getClassInformation(it);

      const createClassProperty = `${normalizedName}: ${typescriptType};`;

      return (acc += `  ${createClassProperty}\r\n`);
    }, `export class ${classes.domain.class.className} {\r\n`);
    classCreationStr += '}\n';

    writeFileSync(classes.domain.class.directory, classCreationStr);
  }

  #writeApiService() {
    const classes = this.classNames;
    const serviceStr =
      `import { ${classes.domain.repository.className} } from '../domain/${classes.domain.repository.importName}';\r\n` +
      `import { ${classes.domain.service.className} } from '../domain/${classes.domain.service.importName}';\r\n\r\n` +
      `export class ${classes.api.service.className} implements ${classes.domain.service.className} {\r\n` +
      `  constructor(private readonly ${classes.partialClassName}Repository: ${classes.domain.repository.className}) {}\r\n` +
      `}\n`;

    writeFileSync(classes.api.service.directory, serviceStr);
  }

  #writeEntity(columnsInfo: CompleteColumnInfo[]) {
    const classes = this.classNames;
    const classDeclaration =
      `import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';\n\n` +
      `@Entity({ name: '${this.tableName}' })\n` +
      `export class ${classes.database.entity.className} {\n`;

    let classCreationStr = columnsInfo.reduce((acc, it) => {
      const { classPropertyDecorator, normalizedName, typescriptType } =
        this.#classInformationService.getClassInformation(it);

      const createClassProperty = `${normalizedName}: ${typescriptType};`;

      return (acc += `  ${classPropertyDecorator}\n  ${createClassProperty}\n\n`);
    }, classDeclaration);

    classCreationStr = classCreationStr += '}';

    writeFileSync(classes.database.entity.directory, classCreationStr);
  }

  #writeModule() {
    const classes = this.classNames;
    const moduleStr =
      `import { AppTypeormModule } from '@app-commons/api/database/typeorm.module';\r\n` +
      `import { ${classes.api.providers.className} } from '${classes.api.providers.importName}';\r\n` +
      `import { ${classes.domain.service.className} } from '../domain/${classes.domain.service.importName}';\r\n` +
      `import { Module } from '@nestjs/common';\r\n\r\n` +
      `@Module({\r\n` +
      `  imports: [AppTypeormModule],\r\n` +
      `  providers: [...${classes.api.providers.className}],\r\n` +
      `  controllers: [],\r\n` +
      `  exports: [${classes.domain.service.className}]\r\n` +
      `})\r\n` +
      `export class ${classes.api.module.className} {}\n`;

    writeFileSync(classes.api.module.directory, moduleStr);
  }

  #writeTypeormDatabaseClass() {
    const classes = this.classNames;
    const typeormRepositoryStr =
      `import { Repository } from 'typeorm';\r\n` +
      `import { ${classes.database.entity.className} } from './${classes.database.entity.importName}';\r\n` +
      `import { ${classes.domain.repository.className} } from '../domain/${classes.domain.repository.importName}';\r\n\r\n` +
      `export class ${classes.database.repository.className} implements ${classes.domain.repository.className} {\r\n` +
      `  constructor(\r\n` +
      `    private readonly ${classes.partialClassName}Repository: Repository<${classes.database.entity.className}>\r\n` +
      `  ) {}\r\n` +
      `}\n`;

    writeFileSync(classes.database.repository.directory, typeormRepositoryStr);
  }

  #writeApiProviders() {
    const classes = this.classNames;
    const classProviderStr =
      "import { Provider } from '@nestjs/common';\r\n" +
      "import { TYPEORM_DATA_SOURCE } from '@app-commons/api/database/typeorm-providers';\r\n" +
      `import { ${classes.domain.repository.className} } from '../domain/${classes.domain.repository.importName}';\r\n` +
      `import { ${classes.api.service.className} } from '${classes.api.service.importName}';\r\n` +
      `import { ${classes.database.repository.className} } from '../database/${classes.database.repository.importName}';\r\n` +
      `import { ${classes.database.entity.className} } from '../database/${classes.database.entity.importName}';\r\n` +
      `import { ${classes.domain.service.className} } from '../domain/${classes.domain.service.importName}';\r\n` +
      "import { DataSource } from 'typeorm';\r\n\r\n" +
      `export const ${classes.api.providers.className}: Provider[] = [\r\n` +
      `  {\r\n` +
      `    provide: ${classes.domain.repository.className},\r\n` +
      `    useFactory: (dataSource: DataSource) =>\r\n` +
      `      new ${classes.database.repository.className}(dataSource.getRepository(${classes.database.entity.className})),\r\n` +
      `    inject: [TYPEORM_DATA_SOURCE]\r\n` +
      `  },\r\n` +
      `  {\r\n` +
      `    provide: ${classes.domain.service.className},\r\n` +
      `    useFactory: (${classes.partialClassName}: ${classes.domain.repository.className}) =>\r\n` +
      `      new ${classes.api.service.className}(${classes.partialClassName}),\r\n` +
      `    inject: [${classes.partialClassName}]\r\n` +
      `  }\r\n` +
      `];\n`;

    writeFileSync(classes.api.providers.directory, classProviderStr);
  }
}
