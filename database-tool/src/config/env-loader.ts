import { config } from 'dotenv';

config();

export interface DataSourceConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
}

export const ApplicationDataSourceEnv: DataSourceConfig = {
  host: process.env.DB_HOST ?? '',
  port: parseInt(process.env.DB_PORT ?? '1433'),
  username: process.env.DB_USER ?? '',
  password: process.env.DB_PASSWORD ?? '',
  database: process.env.DB_NAME ?? ''
};

export const TestDataSourceEnv: DataSourceConfig = {
  host: process.env.DEV_DB_HOST ?? '',
  port: parseInt(process.env.DEV_DB_PORT ?? '1433'),
  username: process.env.DEV_DB_USER ?? '',
  password: process.env.DEV_DB_PASSWORD ?? '',
  database: process.env.DEV_DB_NAME ?? ''
};
