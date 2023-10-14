import { DataSource } from 'typeorm';
import {
  ApplicationDataSourceEnv,
  TestDataSourceEnv
} from '../config/env-loader';

export const applicationDataSource = async () => {
  const { host, database, password, port, username } = ApplicationDataSourceEnv;
  return new DataSource({
    type: 'mssql',
    host,
    port,
    username,
    password,
    database,
    synchronize: false,
    logging: true,
    options: {
      encrypt: false
    }
  }).initialize();
};

export const testDataSource = async (): Promise<DataSource> => {
  const { host, database, password, port, username } = TestDataSourceEnv;
  return new DataSource({
    type: 'mssql',
    host,
    port,
    username,
    password,
    database,
    synchronize: false,
    logging: true,
    options: {
      encrypt: false
    },
    requestTimeout: 50000000
  }).initialize();
};
